package collection

import (
	"errors"
	"net/url"
	"reflect"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestParseListOptions(t *testing.T) {
	id1 := primitive.NewObjectID()
	id2 := primitive.NewObjectID()
	idSort := bson.D{{Key: "_id", Value: 1}}

	tests := []struct {
		name  string
		query string
		want  ListOptions
	}{
		{"no params", "", ListOptions{Filter: bson.M{}, Sort: idSort}},
		{"equality filter", "kind=object", ListOptions{
			Filter: bson.M{"kind": "object"}, Sort: idSort}},
		{"repeated param is any-of", "kind=object&kind=portal", ListOptions{
			Filter: bson.M{"kind": bson.M{"$in": []string{"object", "portal"}}}, Sort: idSort}},
		{"dotted path", "glyph.symbol=x", ListOptions{
			Filter: bson.M{"glyph.symbol": "x"}, Sort: idSort}},
		{"values are plain strings, never operators", "name=$gt", ListOptions{
			Filter: bson.M{"name": "$gt"}, Sort: idSort}},
		{"_id becomes an ObjectID", "_id=" + id1.Hex(), ListOptions{
			Filter: bson.M{"_id": id1}, Sort: idSort}},
		{"repeated _id is any-of", "_id=" + id1.Hex() + "&_id=" + id2.Hex(), ListOptions{
			Filter: bson.M{"_id": bson.M{"$in": []primitive.ObjectID{id1, id2}}}, Sort: idSort}},
		{"sort ascending adds _id tiebreaker", "sort=name", ListOptions{
			Filter: bson.M{}, Sort: bson.D{{Key: "name", Value: 1}, {Key: "_id", Value: 1}}}},
		{"sort descending", "sort=-name", ListOptions{
			Filter: bson.M{}, Sort: bson.D{{Key: "name", Value: -1}, {Key: "_id", Value: 1}}}},
		{"sort by _id descending", "sort=-_id", ListOptions{
			Filter: bson.M{}, Sort: bson.D{{Key: "_id", Value: -1}}}},
		{"limit and offset", "limit=2&offset=2", ListOptions{
			Filter: bson.M{}, Sort: idSort, Limit: 2, Offset: 2}},
		{"limit at the maximum", "limit=1000", ListOptions{
			Filter: bson.M{}, Sort: idSort, Limit: 1000}},
		{"everything together", "kind=object&sort=-name&limit=5&offset=10", ListOptions{
			Filter: bson.M{"kind": "object"},
			Sort:   bson.D{{Key: "name", Value: -1}, {Key: "_id", Value: 1}},
			Limit:  5, Offset: 10}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q, err := url.ParseQuery(tt.query)
			if err != nil {
				t.Fatalf("bad test query: %v", err)
			}
			got, err := ParseListOptions(q)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestParseListOptionsRejects(t *testing.T) {
	tests := []struct{ name, query string }{
		{"operator as field name", "$where=1"},
		{"dollar inside a field name", "a$b=1"},
		{"field starting with a digit", "1a=x"},
		{"_id not hex", "_id=nothex"},
		{"one bad _id among good ones", "_id=" + primitive.NewObjectID().Hex() + "&_id=nope"},
		{"limit zero", "limit=0"},
		{"limit not a number", "limit=abc"},
		{"limit over the maximum", "limit=1001"},
		{"limit negative", "limit=-1"},
		{"limit given twice", "limit=1&limit=2"},
		{"offset negative", "offset=-1"},
		{"offset not a number", "offset=abc"},
		{"sort operator", "sort=$natural"},
		{"sort empty", "sort="},
		{"sort only a minus", "sort=-"},
		{"sort given twice", "sort=a&sort=b"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q, err := url.ParseQuery(tt.query)
			if err != nil {
				t.Fatalf("bad test query: %v", err)
			}
			if _, err := ParseListOptions(q); !errors.Is(err, ErrInvalidQuery) {
				t.Errorf("got %v, want ErrInvalidQuery", err)
			}
		})
	}
}
