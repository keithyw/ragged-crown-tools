package database

import (
	"context"
	"fmt"
	"log/slog"
	"ragged-crown-tools/api/internal/config"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type Mongo struct {
	client *mongo.Client
	config *config.MongoConfig
	log *slog.Logger
	DB *mongo.Database
}

func NewMongo(config *config.MongoConfig, log *slog.Logger) *Mongo {
	return &Mongo{
		config: config,
		log: log,
	}
}

func (db *Mongo) Connect() error {
	clientOptions := options.Client().ApplyURI(db.config.URI)
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), db.config.Timeout)
	defer cancel()

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return err
	}

	db.client = client
	db.DB = client.Database(db.config.DB)
	return nil
}

func (db *Mongo) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	if err := db.client.Disconnect(ctx); err != nil {
		return fmt.Errorf("failed to disconnect from MongoDB: %w", err)
	}
	return nil
}