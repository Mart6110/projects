package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"sports-app/backend/internal/models"
)

type routineRequest struct {
	Name      string `json:"name"`
	Exercises []struct {
		Name     string   `json:"name"`
		Sets     int      `json:"sets"`
		Reps     int      `json:"reps"`
		WeightKg *float64 `json:"weight_kg,omitempty"`
	} `json:"exercises"`
}

func (a *App) ListRoutines(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	cursor, err := a.routines().Find(
		ctx,
		bson.M{"user_id": userID},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load routines")
		return
	}
	defer cursor.Close(ctx)

	routines := []models.Routine{}
	if err := cursor.All(ctx, &routines); err != nil {
		writeError(w, http.StatusInternalServerError, "could not read routines")
		return
	}

	writeJSON(w, http.StatusOK, routines)
}

func (a *App) CreateRoutine(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)

	var req routineRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	exercises := make([]models.RoutineExercise, len(req.Exercises))
	for i, ex := range req.Exercises {
		exercises[i] = models.RoutineExercise{
			Name:     ex.Name,
			Sets:     ex.Sets,
			Reps:     ex.Reps,
			WeightKg: ex.WeightKg,
		}
	}

	routine := models.Routine{
		ID:        bson.NewObjectID(),
		UserID:    userID,
		Name:      req.Name,
		CreatedAt: time.Now().UTC(),
		Exercises: exercises,
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if _, err := a.routines().InsertOne(ctx, routine); err != nil {
		writeError(w, http.StatusInternalServerError, "could not create routine")
		return
	}

	writeJSON(w, http.StatusCreated, routine)
}

func (a *App) GetRoutine(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)
	routineID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid routine id")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var routine models.Routine
	err = a.routines().FindOne(ctx, bson.M{"_id": routineID, "user_id": userID}).Decode(&routine)
	if err != nil {
		writeError(w, http.StatusNotFound, "routine not found")
		return
	}

	writeJSON(w, http.StatusOK, routine)
}

func (a *App) DeleteRoutine(w http.ResponseWriter, r *http.Request) {
	userID, _ := currentUserID(r)
	routineID, err := bson.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid routine id")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	res, err := a.routines().DeleteOne(ctx, bson.M{"_id": routineID, "user_id": userID})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not delete routine")
		return
	}
	if res.DeletedCount == 0 {
		writeError(w, http.StatusNotFound, "routine not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// findRoutineOwner is used by session_handlers.go to verify a routine belongs
// to the current user before logging a session against it.
func findRoutineOwner(ctx context.Context, coll *mongo.Collection, routineID bson.ObjectID) (models.Routine, error) {
	var routine models.Routine
	err := coll.FindOne(ctx, bson.M{"_id": routineID}).Decode(&routine)
	return routine, err
}
