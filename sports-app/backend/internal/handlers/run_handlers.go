package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"sports-app/backend/internal/models"
)

type runRequest struct {
	StartedAt       string  `json:"started_at"`
	EndedAt         string  `json:"ended_at"`
	DistanceMeters  float64 `json:"distance_meters"`
	DurationSeconds int     `json:"duration_seconds"`
	Points          []struct {
		Sequence   int     `json:"sequence"`
		Latitude   float64 `json:"latitude"`
		Longitude  float64 `json:"longitude"`
		RecordedAt string  `json:"recorded_at"`
	} `json:"points"`
}

func (a *App) CreateRun(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)

	var req runRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.StartedAt == "" || req.EndedAt == "" {
		writeError(w, http.StatusBadRequest, "started_at and ended_at are required")
		return
	}

	startedAt, err := time.Parse(time.RFC3339, req.StartedAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "started_at must be RFC3339")
		return
	}
	endedAt, err := time.Parse(time.RFC3339, req.EndedAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, "ended_at must be RFC3339")
		return
	}

	points := make([]models.RunPoint, len(req.Points))
	for i, p := range req.Points {
		recordedAt, err := time.Parse(time.RFC3339, p.RecordedAt)
		if err != nil {
			writeError(w, http.StatusBadRequest, "points[].recorded_at must be RFC3339")
			return
		}
		points[i] = models.RunPoint{
			Sequence:   p.Sequence,
			Latitude:   p.Latitude,
			Longitude:  p.Longitude,
			RecordedAt: recordedAt,
		}
	}

	run := models.Run{
		ID:              bson.NewObjectID(),
		UserID:          userID,
		StartedAt:       startedAt,
		EndedAt:         endedAt,
		DistanceMeters:  req.DistanceMeters,
		DurationSeconds: req.DurationSeconds,
		Points:          points,
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if _, err := a.runs().InsertOne(ctx, run); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save run")
		return
	}

	writeJSON(w, http.StatusCreated, run)
}

func (a *App) ListRuns(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	cursor, err := a.runs().Find(
		ctx,
		bson.M{"user_id": userID},
		options.Find().
			SetSort(bson.D{{Key: "started_at", Value: -1}}).
			SetProjection(bson.M{"points": 0}),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load runs")
		return
	}
	defer cursor.Close(ctx)

	runs := []models.Run{}
	if err := cursor.All(ctx, &runs); err != nil {
		writeError(w, http.StatusInternalServerError, "could not read runs")
		return
	}

	writeJSON(w, http.StatusOK, runs)
}

func (a *App) GetRun(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)
	runID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid run id")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var run models.Run
	err = a.runs().FindOne(ctx, bson.M{"_id": runID, "user_id": userID}).Decode(&run)
	if err != nil {
		writeError(w, http.StatusNotFound, "run not found")
		return
	}

	writeJSON(w, http.StatusOK, run)
}
