package collection

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson"
)

type CollectionHandler struct {
	repository Repository
	log *slog.Logger
}

func NewCollectionHandler(repo Repository, log *slog.Logger) *CollectionHandler {
	return &CollectionHandler{
		repository: repo,
		log: log,
	}
}

func (h *CollectionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")
	id := chi.URLParam(r, "id")

	if err := h.repository.Delete(r.Context(), collName, id); err != nil {
		h.log.Error("Failed to delete document", slog.String("collection", collName), slog.String("id", id), slog.String("error", err.Error()))
		http.Error(w, `{"error":"failed to delete document"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted", "id": id})
}

func (h *CollectionHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")

	docs, err := h.repository.GetAll(r.Context(), collName)
	if err != nil {
		h.log.Error("Failed to fetch collection documents", slog.String("collection", collName), slog.String("error", err.Error()))
		http.Error(w, `{"error":"failed to retrieve documents"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docs)
}

func (h *CollectionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")
	id := chi.URLParam(r, "id")

	doc, err := h.repository.GetByID(r.Context(), collName, id)
	if err != nil {
		h.log.Warn("Document not found", slog.String("collection", collName), slog.String("id", id))
		http.Error(w, `{"error":"document not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(doc)
}

func (h *CollectionHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")
	id := chi.URLParam(r, "id")

	var payload bson.M
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.log.Warn("Invalid JSON payload", slog.String("collection", collName), slog.String("id", id), slog.String("error", err.Error()))
		http.Error(w, `{"error":"invalid json body"}`, http.StatusBadRequest)
		return
	}

	if err := h.repository.Upsert(r.Context(), collName, id, payload); err != nil {
		h.log.Error("Failed to save document", slog.String("collection", collName), slog.String("id", id), slog.String("error", err.Error()))
		http.Error(w, `{"error":"failed to save document"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "saved", "id": id})
}

