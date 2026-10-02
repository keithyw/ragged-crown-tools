package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"ragged-crown-tools/api/internal/config"
	"ragged-crown-tools/api/internal/database"
	"ragged-crown-tools/api/internal/server"
)

func main() {
	log := slog.Default()
	var err error

	mongoConfig, err := config.NewMongoConfig()
	if err != nil {
		panic(fmt.Errorf("failed to create MongoDB config: %v", err))
	}

	mongoDB := database.NewMongo(mongoConfig, log)
	if err := mongoDB.Connect(); err != nil {
		panic(fmt.Errorf("failed to connect to MongoDB: %v", err))
	}
	defer mongoDB.Close()

	server := server.NewServer(*mongoDB, log)
	log.Info(fmt.Sprintf("Server starting on %s", ":8080"))
	http.ListenAndServe(":8080", server)
}