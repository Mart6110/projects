package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"sports-app/backend/internal/auth"
	"sports-app/backend/internal/db"
	"sports-app/backend/internal/handlers"
)

func main() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-me"
		log.Println("warning: JWT_SECRET not set, using an insecure default for local development")
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}
	mongoDatabase := os.Getenv("MONGODB_DATABASE")
	if mongoDatabase == "" {
		mongoDatabase = "sports_app"
	}

	conn, err := db.Connect(mongoURI, mongoDatabase)
	if err != nil {
		log.Fatalf("could not connect to MongoDB: %v", err)
	}

	if err := ensureIndexes(conn); err != nil {
		log.Fatalf("could not create indexes: %v", err)
	}

	app := &handlers.App{DB: conn, Secret: secret}

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/register", app.Register)
		r.Post("/auth/login", app.Login)

		r.Group(func(r chi.Router) {
			r.Use(auth.Middleware(secret))

			r.Get("/routines", app.ListRoutines)
			r.Post("/routines", app.CreateRoutine)
			r.Get("/routines/{id}", app.GetRoutine)
			r.Delete("/routines/{id}", app.DeleteRoutine)

			r.Get("/sessions", app.ListSessions)
			r.Post("/sessions", app.CreateSession)
			r.Get("/sessions/{id}", app.GetSession)

			r.Get("/runs", app.ListRuns)
			r.Post("/runs", app.CreateRun)
			r.Get("/runs/{id}", app.GetRun)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func ensureIndexes(conn *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := conn.Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}
