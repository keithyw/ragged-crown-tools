package collection

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

var validCollections = map[string]bool{
	"tile_defs": true,
	"items":     true,
	"entities":  true,
	"events":    true,
	"zones":     true,
	"maps":      true,
}

type ValidationMiddleware struct {
	log *slog.Logger
}

func NewValidationMiddleware(log *slog.Logger) *ValidationMiddleware {
	return &ValidationMiddleware{
		log: log,
	}
}

func (m *ValidationMiddleware) ValidateCollection(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		collectionName := chi.URLParam(r, "collection")
		if !validCollections[collectionName] {
			m.log.Warn("Attempted to access invalid collection", slog.String("collection", collectionName))
			http.Error(w, `{"error":"collection not found"}`, http.StatusNotFound)
			return
		}

		next.ServeHTTP(w, r)

	})
}