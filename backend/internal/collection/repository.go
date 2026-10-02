package collection

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository interface {
	GetAll(ctx context.Context, collName string) ([]bson.M, error)
	GetByID(ctx context.Context, collName, id string) (bson.M, error)
	Upsert(ctx context.Context, collName, id string, doc bson.M) error
	Delete(ctx context.Context, collName, id string) error
}

type repository struct {
	db mongo.Database
}

func NewRepository(db mongo.Database) Repository {
	return &repository{db: db}
}

func (r *repository) GetAll(ctx context.Context, collName string) ([]bson.M, error) {
	coll := r.db.Collection(collName)
	cursor, err := coll.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to query collection %s: %w", collName, err)
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("failed to decode collection %s: %w", collName, err)
	}

	if results == nil {
		results = []bson.M{}
	}

	return results, nil
}

func (r *repository) GetByID(ctx context.Context, collName, id string) (bson.M, error) {
	coll := r.db.Collection(collName)
	var result bson.M

	err := coll.FindOne(ctx, bson.M{"_id": id}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("document with _id %s not found in %s", id, collName)
		}
		return nil, err
	}

	return result, nil
}

func (r *repository) Upsert(ctx context.Context, collName, id string, doc bson.M) error {
	coll := r.db.Collection(collName)

	doc["_id"] = id
	doc["updated_at"] = time.Now().UTC()

	opts := options.Update().SetUpsert(true)
	_, err := coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": doc}, opts)
	if err != nil {
		return fmt.Errorf("failed to upsert document %s in %s: %w", id, collName, err)
	}

	return nil
}

func (r *repository) Delete(ctx context.Context, collName, id string) error {
	coll := r.db.Collection(collName)

	_, err := coll.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return fmt.Errorf("failed to delete document %s from %s: %w", id, collName, err)
	}

	return nil
}