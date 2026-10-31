package collection

import "testing"

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
