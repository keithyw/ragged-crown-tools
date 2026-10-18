package collection

import (
	"fmt"
	"math"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const maxLimit = 1000

// fieldName allows dotted paths. The character class has no '$', so a caller
// can never name a Mongo operator.
var fieldName = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_.]*$`)

// Query params that control the listing instead of filtering it.
var reserved = map[string]bool{"sort": true, "limit": true, "offset": true}

// ListOptions is what GetAll needs, already validated.
type ListOptions struct {
	Filter bson.M
	Sort   bson.D
	Limit  int64 // 0 means no limit
	Offset int64
}

func invalid(format string, args ...any) error {
	return fmt.Errorf("%w: %s", ErrInvalidQuery, fmt.Sprintf(format, args...))
}

// ParseListOptions turns URL query params into ListOptions.
//
// Any param that is not reserved is an equality match on that field. Values
// are always strings straight from the URL, so they can never carry a Mongo
// operator. Repeating a param means "any of".
func ParseListOptions(q url.Values) (ListOptions, error) {
	opts := ListOptions{Filter: bson.M{}}

	for key, values := range q {
		if reserved[key] {
			continue
		}
		if !fieldName.MatchString(key) {
			return ListOptions{}, invalid("bad filter field %q", key)
		}
		v, err := filterValue(key, values)
		if err != nil {
			return ListOptions{}, err
		}
		opts.Filter[key] = v
	}

	var err error
	if opts.Sort, err = parseSort(q); err != nil {
		return ListOptions{}, err
	}
	if opts.Limit, err = parseInt(q, "limit", 1, maxLimit, "an integer from 1 to 1000"); err != nil {
		return ListOptions{}, err
	}
	if opts.Offset, err = parseInt(q, "offset", 0, math.MaxInt64, "an integer >= 0"); err != nil {
		return ListOptions{}, err
	}
	return opts, nil
}

func filterValue(key string, values []string) (any, error) {
	// _id is stored as an ObjectID, not a string, so it has to be converted.
	if key == "_id" {
		oids := make([]primitive.ObjectID, len(values))
		for i, v := range values {
			oid, err := primitive.ObjectIDFromHex(v)
			if err != nil {
				return nil, invalid("_id %q is not a valid id", v)
			}
			oids[i] = oid
		}
		if len(oids) == 1 {
			return oids[0], nil
		}
		return bson.M{"$in": oids}, nil
	}
	if len(values) == 1 {
		return values[0], nil
	}
	return bson.M{"$in": values}, nil
}

// parseSort reads sort=field or sort=-field. The default is _id ascending.
// Any other field gets _id as a tiebreaker so paging stays stable.
func parseSort(q url.Values) (bson.D, error) {
	field, dir := "_id", 1
	if vals, ok := q["sort"]; ok {
		if len(vals) > 1 {
			return nil, invalid("sort takes one field")
		}
		field = vals[0]
		if strings.HasPrefix(field, "-") {
			dir = -1
			field = field[1:]
		}
		if !fieldName.MatchString(field) {
			return nil, invalid("bad sort field %q", vals[0])
		}
	}

	sort := bson.D{{Key: field, Value: dir}}
	if field != "_id" {
		sort = append(sort, bson.E{Key: "_id", Value: 1})
	}
	return sort, nil
}

// parseInt returns 0 when the param is absent.
func parseInt(q url.Values, key string, min, max int64, want string) (int64, error) {
	vals, ok := q[key]
	if !ok {
		return 0, nil
	}
	if len(vals) > 1 {
		return 0, invalid("%s can only be given once", key)
	}
	n, err := strconv.ParseInt(vals[0], 10, 64)
	if err != nil || n < min || n > max {
		return 0, invalid("%s must be %s", key, want)
	}
	return n, nil
}
