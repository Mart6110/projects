package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Email        string        `bson:"email" json:"email"`
	PasswordHash string        `bson:"password_hash" json:"-"`
	CreatedAt    time.Time     `bson:"created_at" json:"created_at"`
}

type RoutineExercise struct {
	Name     string   `bson:"name" json:"name"`
	Sets     int      `bson:"sets" json:"sets"`
	Reps     int      `bson:"reps" json:"reps"`
	WeightKg *float64 `bson:"weight_kg,omitempty" json:"weight_kg,omitempty"`
}

type Routine struct {
	ID        bson.ObjectID     `bson:"_id,omitempty" json:"id"`
	UserID    bson.ObjectID     `bson:"user_id" json:"user_id"`
	Name      string            `bson:"name" json:"name"`
	CreatedAt time.Time         `bson:"created_at" json:"created_at"`
	Exercises []RoutineExercise `bson:"exercises" json:"exercises"`
}

type SessionExerciseLog struct {
	ExerciseName string   `bson:"exercise_name" json:"exercise_name"`
	SetNumber    int      `bson:"set_number" json:"set_number"`
	Reps         int      `bson:"reps" json:"reps"`
	WeightKg     *float64 `bson:"weight_kg,omitempty" json:"weight_kg,omitempty"`
}

type RoutineSession struct {
	ID          bson.ObjectID        `bson:"_id,omitempty" json:"id"`
	UserID      bson.ObjectID        `bson:"user_id" json:"user_id"`
	RoutineID   bson.ObjectID        `bson:"routine_id" json:"routine_id"`
	RoutineName string               `bson:"routine_name" json:"routine_name"`
	Notes       string               `bson:"notes,omitempty" json:"notes,omitempty"`
	StartedAt   time.Time            `bson:"started_at" json:"started_at"`
	CompletedAt time.Time            `bson:"completed_at" json:"completed_at"`
	Logs        []SessionExerciseLog `bson:"logs" json:"logs"`
}

type RunPoint struct {
	Sequence   int       `bson:"sequence" json:"sequence"`
	Latitude   float64   `bson:"latitude" json:"latitude"`
	Longitude  float64   `bson:"longitude" json:"longitude"`
	RecordedAt time.Time `bson:"recorded_at" json:"recorded_at"`
}

type Run struct {
	ID              bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          bson.ObjectID `bson:"user_id" json:"user_id"`
	StartedAt       time.Time     `bson:"started_at" json:"started_at"`
	EndedAt         time.Time     `bson:"ended_at" json:"ended_at"`
	DistanceMeters  float64       `bson:"distance_meters" json:"distance_meters"`
	DurationSeconds int           `bson:"duration_seconds" json:"duration_seconds"`
	Points          []RunPoint    `bson:"points,omitempty" json:"points,omitempty"`
}
