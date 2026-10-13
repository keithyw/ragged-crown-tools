package collection

import (
	"encoding/json"
	"errors"
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

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func (h *CollectionHandler) fail(w http.ResponseWriter, err error, op, collName string) {
	switch {
	case errors.Is(err, ErrInvalidID):
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
	case errors.Is(err, ErrNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "document not found"})
	case errors.Is(err, ErrDuplicate):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "a document with that id already exists"})
	default:
		h.log.Error("request failed", slog.String("op", op), slog.String("collection", collName), slog.String("error", err.Error()))
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
	}
}

func decodeBody(r *http.Request) (bson.M, error) {
	var payload bson.M
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func (h *CollectionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")

	if err := h.repository.Delete(r.Context(), collName, chi.URLParam(r, "id")); err != nil {
		h.fail(w, err, "delete", collName)
		return
	}
	w.WriteHeader(http.StatusNoContent)	
}

func (h *CollectionHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")

	docs, err := h.repository.GetAll(r.Context(), collName)
	if err != nil {
		h.fail(w, err, "get_all", collName)
		return
	}
	writeJSON(w, http.StatusOK, docs)
}

func (h *CollectionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")
	id := chi.URLParam(r, "id")

	doc, err := h.repository.GetByID(r.Context(), collName, id)
	if err != nil {
		h.fail(w, err, "get_by_id", collName)
		return
	}
	writeJSON(w, http.StatusOK, doc)
}

func (h *CollectionHandler) Post(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")

	payload, err := decodeBody(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json body"})
		return
	}

	doc, err := h.repository.Create(r.Context(), collName, payload)
	if err != nil {
		h.fail(w, err, "create", collName)
		return
	}
	writeJSON(w, http.StatusCreated, doc)
}

func (h *CollectionHandler) Put(w http.ResponseWriter, r *http.Request) {
	collName := chi.URLParam(r, "collection")

	payload, err := decodeBody(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json body"})
		return
	}

	doc, err := h.repository.Replace(r.Context(), collName, chi.URLParam(r, "id"), payload)
	if err != nil {
		h.fail(w, err, "replace", collName)
		return
	}
	writeJSON(w, http.StatusOK, doc)
}

