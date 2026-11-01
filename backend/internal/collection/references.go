package collection

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sort"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// refSource is one place that stores another document's _id: the field `Field`
// (a dotted path; Mongo walks arrays in it) of documents in `Collection`.
type refSource struct {
	Collection string
	Field      string
}

// The backend's one piece of schema knowledge: for each collection, which
// fields in which collections hold its documents' _ids (as hex strings).
// Direct references only. Adding a reference field to a schema? Add it here
// (DATA-MODEL.md, [Backend 5]).
//
// Not covered yet, so they report no referrers even when used: events, and
// zones' edgeExits. What zones' placements point at is found by a scan of the
// placements, not by this map ([Backend 8], [Backend 10]).
var referenceSources = map[string][]refSource{
	"tile_defs": {
		{"zones", "terrain"},
	},
	"sprites": {
		{"tile_defs", "spriteId"},
		{"items", "spriteId"},
		{"entities", "spriteId"},
	},
	"items": {
		// HAS_ITEM conditions, GIVE_ITEM and TAKE_ITEM actions
		{"items", "interactions.conditions.itemId"},
		{"entities", "interactions.conditions.itemId"},
		{"items", "interactions.actions.itemId"},
		{"entities", "interactions.actions.itemId"},
		// SPAWN actions
		{"items", "interactions.actions.defId"},
		{"entities", "interactions.actions.defId"},
	},
	"entities": {
		// SPAWN actions
		{"items", "interactions.actions.defId"},
		{"entities", "interactions.actions.defId"},
	},
	"zones": {
		// TELEPORT actions on a def (the editor doesn't offer them yet). Portal
		// destinations and TELEPORTs on placements are found by the placement
		// scan below. edgeExits are not covered: the schema doesn't have them yet.
		{"items", "interactions.actions.destination.zoneId"},
		{"entities", "interactions.actions.destination.zoneId"},
	},
}

// A source is matched by plain equality on its Field unless it is listed here.
// Equality only looks one array level deep, which is not enough for fields
// that hold arrays of arrays.
var customFilters = map[refSource]func(id string) bson.M{
	// terrain is rows of tile _ids, [y][x]: some row has a cell equal to id.
	{"zones", "terrain"}: func(id string) bson.M {
		return bson.M{"terrain": bson.M{"$elemMatch": bson.M{"$elemMatch": bson.M{"$eq": id}}}}
	},
}

func (s refSource) filter(id string) bson.M {
	if f, ok := customFilters[s]; ok {
		return f(id)
	}
	return bson.M{s.Field: id}
}

// Targets that zones' placements point at: defs placed on the map, and zones
// that portals lead to. A zone's placements are keyed by dynamic "x,y" cells,
// which a query path can't name, so these are found by walking the zones in Go
// instead (see placementReferrer).
var placedTargets = map[string]bool{
	"items":    true,
	"entities": true,
	"zones":    true,
}

// containsID reports whether the string id appears anywhere inside v, however
// deeply nested. It is deliberately not path-aware: an _id is 24 hex
// characters, so a match that is not a reference is practically impossible,
// and this covers stacks, contents and custom values alike ([Backend 9]).
func containsID(v any, id string) bool {
	switch x := v.(type) {
	case string:
		return x == id
	case bson.M:
		for _, e := range x {
			if containsID(e, id) {
				return true
			}
		}
	case bson.D:
		for _, e := range x {
			if containsID(e.Value, id) {
				return true
			}
		}
	case bson.A:
		for _, e := range x {
			if containsID(e, id) {
				return true
			}
		}
	}
	return false
}

// placementReferrer returns the first zone with `id` anywhere in a cell's
// placements, and that cell's key ("x,y"), or nil if none. When the target is
// itself a zone it is left out: a portal may lead to a spot in its own zone,
// and that must not block deleting it.
func (r *repository) placementReferrer(ctx context.Context, collName, id string) (*Referrer, error) {
	filter := bson.M{}
	if collName == "zones" {
		oid, err := parseID(id)
		if err != nil {
			return nil, err
		}
		filter["_id"] = bson.M{"$ne": oid}
	}
	cur, err := r.db.Collection("zones").Find(ctx, filter,
		options.Find().SetProjection(bson.M{"name": 1, "id": 1, "placements": 1}))
	if err != nil {
		return nil, fmt.Errorf("scan zone placements for %s: %w", id, err)
	}
	defer cur.Close(ctx)

	for cur.Next(ctx) {
		var zone struct {
			Referrer   `bson:",inline"`
			Placements bson.M `bson:"placements"`
		}
		if err := cur.Decode(&zone); err != nil {
			return nil, fmt.Errorf("scan zone placements for %s: %w", id, err)
		}
		// Sorted so the same zone always reports the same cell.
		cells := make([]string, 0, len(zone.Placements))
		for cell := range zone.Placements {
			cells = append(cells, cell)
		}
		sort.Strings(cells)
		for _, cell := range cells {
			if containsID(zone.Placements[cell], id) {
				ref := zone.Referrer
				ref.Collection = "zones"
				ref.Cell = cell
				return &ref, nil
			}
		}
	}
	if err := cur.Err(); err != nil {
		return nil, fmt.Errorf("scan zone placements for %s: %w", id, err)
	}
	return nil, nil
}

// Referrer is the first document found that points at the target. Cell is set
// when the referrer is a zone and the reference sits in a placement stack.
type Referrer struct {
	Collection string             `json:"collection"`
	ID         primitive.ObjectID `json:"_id" bson:"_id"`
	UserID     string             `json:"id,omitempty" bson:"id"`
	Name       string             `json:"name" bson:"name"`
	Cell       string             `json:"cell,omitempty" bson:"-"`
}

// FirstReferrer returns the first document that references the document `id`
// of `collName`, or nil if none does. It stops at the first hit.
func (r *repository) FirstReferrer(ctx context.Context, collName, id string) (*Referrer, error) {
	if _, err := parseID(id); err != nil {
		return nil, err
	}

	// A referrer is looked up by its own fields, never by the target's _id
	// type: references are stored as hex strings.
	projection := options.FindOne().SetProjection(bson.M{"name": 1, "id": 1})
	for _, src := range referenceSources[collName] {
		var ref Referrer
		err := r.db.Collection(src.Collection).
			FindOne(ctx, src.filter(id), projection).
			Decode(&ref)
		if errors.Is(err, mongo.ErrNoDocuments) {
			continue
		}
		if err != nil {
			return nil, fmt.Errorf("find referrer of %s in %s.%s: %w", id, src.Collection, src.Field, err)
		}
		ref.Collection = src.Collection
		return &ref, nil
	}
	if placedTargets[collName] {
		return r.placementReferrer(ctx, collName, id)
	}
	return nil, nil
}

// GetReferrer answers "does anything reference this document?" with
// {"referencedBy": null} or {"referencedBy": {collection, _id, id, name}}.
func (h *CollectionHandler) GetReferrer(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")

	ref, err := h.repository.FirstReferrer(r.Context(), collName, chi.URLParam(r, "id"))
	if err != nil {
		h.fail(w, err, "get_referrer", collName)
		return
	}
	writeJSON(w, http.StatusOK, map[string]*Referrer{"referencedBy": ref})
}
