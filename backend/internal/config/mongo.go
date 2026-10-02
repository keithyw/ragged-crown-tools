package config

import (
	"os"
	"strconv"
	"time"
)

type MongoConfig struct {
	URI string
	DB string
	Timeout time.Duration
}

func NewMongoConfig() (*MongoConfig, error) {
	timeout, err := strconv.Atoi(os.Getenv("MONGO_TIMEOUT"))
	if err != nil {
		return nil, err
	}
	
	return &MongoConfig{
		URI: os.Getenv("MONGODB_URI"),
		DB: os.Getenv("MONGO_DATABASE"),
		Timeout: time.Duration(timeout) * time.Second,
	}, nil
}