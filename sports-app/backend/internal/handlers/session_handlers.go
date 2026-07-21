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

type sessionRequest struct {
	RoutineID string `json:"routine_id"`
	Notes     string `json:"notes"`
	StartedAt string `json:"started_at"`
	Logs      []struct {
		ExerciseName string   `json:"exercise_name"`
		SetNumber    int      `json:"set_number"`
		Reps         int      `json:"reps"`
		WeightKg     *float64 `json:"weight_kg,omitempty"`
	} `json:"logs"`
}

func (a *App) CreateSession(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)

	var req sessionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.RoutineID == "" || len(req.Logs) == 0 {
		writeError(w, http.StatusBadRequest, "routine_id and at least one log entry are required")
		return
	}
	routineID, err := bson.ObjectIDFromHex(req.RoutineID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid routine_id")
		return
	}

	startedAt := time.Now().UTC()
	if req.StartedAt != "" {
		if parsed, err := time.Parse(time.RFC3339, req.StartedAt); err == nil {
			startedAt = parsed
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// verify the routine belongs to this user
	routine, err := findRoutineOwner(ctx, a.routines(), routineID)
	if err != nil || routine.UserID != userID {
		writeError(w, http.StatusNotFound, "routine not found")
		return
	}

	logs := make([]models.SessionExerciseLog, len(req.Logs))
	for i, l := range req.Logs {
		logs[i] = models.SessionExerciseLog{
			ExerciseName: l.ExerciseName,
			SetNumber:    l.SetNumber,
			Reps:         l.Reps,
			WeightKg:     l.WeightKg,
		}
	}

	session := models.RoutineSession{
		ID:          bson.NewObjectID(),
		UserID:      userID,
		RoutineID:   routineID,
		RoutineName: routine.Name,
		Notes:       req.Notes,
		StartedAt:   startedAt,
		CompletedAt: time.Now().UTC(),
		Logs:        logs,
	}

	if _, err := a.sessions().InsertOne(ctx, session); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save session")
		return
	}

	writeJSON(w, http.StatusCreated, session)
}

func (a *App) ListSessions(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	cursor, err := a.sessions().Find(
		ctx,
		bson.M{"user_id": userID},
		options.Find().SetSort(bson.D{{Key: "completed_at", Value: -1}}),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load sessions")
		return
	}
	defer cursor.Close(ctx)

	sessions := []models.RoutineSession{}
	if err := cursor.All(ctx, &sessions); err != nil {
		writeError(w, http.StatusInternalServerError, "could not read sessions")
		return
	}

	writeJSON(w, http.StatusOK, sessions)
}

func (a *App) GetSession(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)
	sessionID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid session id")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var session models.RoutineSession
	err = a.sessions().FindOne(ctx, bson.M{"_id": sessionID, "user_id": userID}).Decode(&session)
	if err != nil {
		writeError(w, http.StatusNotFound, "session not found")
		return
	}

	writeJSON(w, http.StatusOK, session)
}
