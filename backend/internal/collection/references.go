package collection

import (
	"context"
	"errors"
	"fmt"
	"net/http"

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
// Not covered yet, so they report no referrers even when used: tile_defs and
// zones (referenced by zones' terrain and placements) and events.
var referenceSources = map[string][]refSource{
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
}

// Referrer is the first document found that points at the target.
type Referrer struct {
	Collection string             `json:"collection"`
	ID         primitive.ObjectID `json:"_id" bson:"_id"`
	UserID     string             `json:"id,omitempty" bson:"id"`
	Name       string             `json:"name" bson:"name"`
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
			FindOne(ctx, bson.M{src.Field: id}, projection).
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
