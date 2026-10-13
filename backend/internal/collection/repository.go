package collection

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrDuplicate = errors.New("duplicate key")
	ErrNotFound  = errors.New("not found")
	ErrInvalidID = errors.New("invalid id")
)

type Repository interface {
	Create(ctx context.Context, colName string, doc bson.M) (bson.M, error)
	GetAll(ctx context.Context, collName string) ([]bson.M, error)
	GetByID(ctx context.Context, collName, id string) (bson.M, error)
	Replace(ctx context.Context, collName, id string, doc bson.M) (bson.M, error)
	Delete(ctx context.Context, collName, id string) error
}

type repository struct {
	db mongo.Database
}

func NewRepository(db mongo.Database) Repository {
	return &repository{db: db}
}

func parseID(id string) (primitive.ObjectID, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return primitive.NilObjectID, ErrInvalidID
	}
	return oid, nil
}

func (r *repository) Create(ctx context.Context, collName string, doc bson.M) (bson.M, error) {
	delete(doc, "_id")
	coll := r.db.Collection(collName)
	doc["updated_at"] = time.Now().UTC()
	res, err := coll.InsertOne(ctx, doc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, fmt.Errorf("%w: %s", ErrDuplicate, collName)
		}
	}

	doc["_id"] = res.InsertedID 

	return doc, nil
}

func (r *repository) GetAll(ctx context.Context, collName string) ([]bson.M, error) {
	cursor, err := r.db.Collection(collName).Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to query collection %s: %w", collName, err)
	}
	defer cursor.Close(ctx)

	results := []bson.M{}
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("failed to decode collection %s: %w", collName, err)
	}

	return results, nil
}

func (r *repository) GetByID(ctx context.Context, collName, id string) (bson.M, error) {
	oid, err := parseID(id)
	if err != nil {
		return nil, err
	}

	var result bson.M
	err = r.db.Collection(collName).FindOne(ctx, bson.M{"_id": oid}).Decode(&result)
	
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get %s from %s: %w", id, collName, err)
	}

	return result, nil
}

func (r *repository) Replace(ctx context.Context, collName, id string, doc bson.M) (bson.M, error) {
	oid, err := parseID(id)
	if err != nil {
		return nil, err
	}

	delete(doc, "_id")
	doc["updated_at"] = time.Now().UTC()

	opts := options.FindOneAndReplace().SetReturnDocument(options.After)
	var result bson.M

	err = r.db.Collection(collName).FindOneAndReplace(ctx, bson.M{"_id": oid}, doc, opts).Decode(&result)

	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrNotFound
	}
	if mongo.IsDuplicateKeyError(err) {
		return nil, ErrDuplicate
	}
	if err != nil {
		return nil, fmt.Errorf("replace %s in %s: %w", id, collName, err)
	}

	return result, nil
}

func (r *repository) Delete(ctx context.Context, collName, id string) error {
	oid, err := parseID(id)
	if err != nil {
		return err
	}

	res, err := r.db.Collection(collName).DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return fmt.Errorf("failed to delete document %s from %s: %w", id, collName, err)
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}