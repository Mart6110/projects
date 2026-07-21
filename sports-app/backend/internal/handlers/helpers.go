package handlers

import (
	"encoding/json"
	"net/http"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"sports-app/backend/internal/auth"
)

type App struct {
	DB     *mongo.Database
	Secret string
}

func (a *App) users() *mongo.Collection    { return a.DB.Collection("users") }
func (a *App) routines() *mongo.Collection { return a.DB.Collection("routines") }
func (a *App) sessions() *mongo.Collection { return a.DB.Collection("routine_sessions") }
func (a *App) runs() *mongo.Collection     { return a.DB.Collection("runs") }

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeJSON(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func currentUserID(r *http.Request) (bson.ObjectID, bool) {
	return auth.UserIDFromContext(r.Context())
}
