package database

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) *pgxpool.Pool {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("db connect fail: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("db ping fail: %v", err)
	}
	log.Println("db connected")
	return pool
}
