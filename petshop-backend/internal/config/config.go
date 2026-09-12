package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort       string
	DatabaseURL   string
	JWTSecret     string
	ClaudeAPIKey  string
}

func Load() *Config {
	_ = godotenv.Load() // ok if .env missing, fall back to real env vars

	return &Config{
		AppPort:      getEnv("APP_PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", ""),
		JWTSecret:    getEnv("JWT_SECRET", ""),
		ClaudeAPIKey: getEnv("CLAUDE_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
