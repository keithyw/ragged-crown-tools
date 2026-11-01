package collection

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

// A custom filter for a source that is not in the map would never run.
func TestCustomFiltersMatchASource(t *testing.T) {
	for custom := range customFilters {
		found := false
		for _, sources := range referenceSources {
			for _, src := range sources {
				if src == custom {
					found = true
				}
			}
		}
		if !found {
			t.Errorf("custom filter for %+v is not a source in referenceSources", custom)
		}
	}
}

// A typo in the reference map would silently report "nothing references this",
// so check that every collection in it is a real one.
func TestReferenceSourcesUseValidCollections(t *testing.T) {
	for target, sources := range referenceSources {
		if !validCollections[target] {
			t.Errorf("target %q is not an allowed collection", target)
		}
		for _, src := range sources {
			if !validCollections[src.Collection] {
				t.Errorf("%s referenced from %q, which is not an allowed collection", target, src.Collection)
			}
			if src.Field == "" {
				t.Errorf("%s has a source in %s with no field", target, src.Collection)
			}
		}
	}
}

// The walk must find an _id however deep it sits, in either shape the driver
// may decode a nested document to.
func TestContainsID(t *testing.T) {
	const id = "64b7f0c2a1b2c3d4e5f60718"
	stack := bson.A{
		bson.M{"uid": "a", "defId": "other"},
		bson.M{"uid": "b", "contents": bson.A{
			bson.D{{Key: "customValues", Value: bson.M{"s1": bson.M{"itemId": id}}}},
		}},
	}
	if !containsID(stack, id) {
		t.Error("id nested in contents and custom values was not found")
	}
	if containsID(stack, "64b7f0c2a1b2c3d4e5f60719") {
		t.Error("found an id that is not there")
	}
}
