# Makefile for React + Vite frontend

# Default API URL
API_URL=http://localhost:8000/api
ENV_FILE=.env

.PHONY: env install dev build clean

env:
	@echo "🔧 Creating .env file..."
	@echo "VITE_API_URL=$(API_URL)" > $(ENV_FILE)
	@echo "✅ .env created with API_URL=$(API_URL)"

install:
	@echo "📦 Installing frontend dependencies..."
	npm install

dev:
	@echo "🚀 Starting Vite development server..."
	npm run dev

build:
	@echo "🏗️ Building production frontend..."
	npm run build

clean:
	@echo "🧹 Cleaning build output and .env..."
	rm -rf dist
	rm -f .env