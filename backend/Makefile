# Makefile for FastAPI + PostgreSQL project

# Database config
DB_USER=''
DB_PASS=""
DB_NAME=gestion_articles
DB_HOST=localhost
DB_PORT=5432

# .env config
ENV_FILE=.env
ENV_CONTENT=DATABASE_URL=postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

.PHONY: env install install-uv run run-uv dev dev-uv clean createdb sync

env:
	@echo "🔧 Creating .env file..."
	@echo $(ENV_CONTENT) > $(ENV_FILE)
	@echo "✅ .env created with database URL."

install:
	@echo "📦 Installing Python dependencies..."
	pip install -r requirements.txt

install-uv:
	@echo "📦 Installing Python dependencies with uv..."
	uv pip install -r requirements.txt

sync: install-uv

run:
	@echo "🚀 Running FastAPI app..."
	uvicorn main:app --reload

run-uv:
	@echo "🚀 Running FastAPI app with uv..."
	uv run uvicorn main:app --reload

dev: env install run

dev-uv: env sync run-uv

createdb:
	@echo "🛠️ Creating PostgreSQL database if not exists..."
	@psql -U $(DB_USER) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)'" | grep -q 1 || createdb -U $(DB_USER) $(DB_NAME)
	@echo "✅ Database '$(DB_NAME)' is ready."

clean:
	@echo "🧹 Cleaning up environment..."
	rm -f $(ENV_FILE)
	rm -rf __pycache__
	@echo "🗑️ .env deleted."