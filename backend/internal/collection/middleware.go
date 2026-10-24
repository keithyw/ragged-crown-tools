package collection

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Adding a collection here? Also add it to scripts/ensure-indexes.js and
// mcp/src/index.ts, then run `make db-indexes` and `make sandbox-indexes`
// (ARCHITECTURE.md sections 6.3 and 7).
var validCollections = map[string]bool{
	"sprites": true,
	"tile_defs": true,
	"items":     true,
	"entities":  true,
	"events":    true,
	"zones":     true,
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
