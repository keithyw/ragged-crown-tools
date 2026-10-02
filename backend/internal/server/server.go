package server

import (
	"log/slog"
	"net/http"
	"ragged-crown-tools/api/internal/collection"
	"ragged-crown-tools/api/internal/database"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func NewServer(store database.Mongo, log *slog.Logger) http.Handler {
	middleware := collection.NewValidationMiddleware(log)
	repo := collection.NewRepository(*store.DB)
	h := collection.NewCollectionHandler(repo, log)
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"}, // probably need to move this into config
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/collection/{collection}", func(r chi.Router) {
		r.Use(middleware.ValidateCollection)
		r.Delete("/{id}", h.Delete)
		r.Get("/", h.GetAll)
		r.Get("/{id}", h.GetByID)
		r.Post("/{id}", h.Upsert)
		r.Put("/{id}", h.Upsert)
	})
	return r
}