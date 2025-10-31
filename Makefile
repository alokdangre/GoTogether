# GoTogether Development Makefile

.PHONY: help install dev build test clean docker-build docker-up docker-down migrate seed

# Default target
help:
	@echo "GoTogether Development Commands:"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  install          Install all dependencies"
	@echo "  setup            Complete project setup"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start development servers"
	@echo "  backend-dev      Start backend development server"
	@echo "  frontend-dev     Start frontend development server"
	@echo ""
	@echo "Database:"
	@echo "  migrate          Run database migrations"
	@echo "  migrate-create   Create new migration"
	@echo "  seed             Seed database with sample data"
	@echo "  db-reset         Reset database"
	@echo ""
	@echo "Testing:"
	@echo "  test             Run all tests"
	@echo "  test-backend     Run backend tests"
	@echo "  test-frontend    Run frontend tests"
	@echo "  test-e2e         Run end-to-end tests"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build     Build Docker images"
	@echo "  docker-up        Start all services with Docker"
	@echo "  docker-down      Stop all Docker services"
	@echo "  docker-logs      View Docker logs"
	@echo ""
	@echo "Production:"
	@echo "  build            Build for production"
	@echo "  deploy           Deploy to production"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean            Clean build artifacts"
	@echo "  lint             Run linters"
	@echo "  format           Format code"

# Setup & Installation
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

setup: install
	@echo "Setting up environment files..."
	cp .env.example .env
	@echo "Setting up database..."
	$(MAKE) docker-up
	sleep 10
	$(MAKE) migrate
	@echo "Setup complete! Run 'make dev' to start development servers."

# Development
dev:
	@echo "Starting development servers..."
	docker-compose up postgres redis -d
	sleep 5
	$(MAKE) backend-dev &
	$(MAKE) frontend-dev

backend-dev:
	@echo "Starting backend development server..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

# Database
migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head

migrate-create:
	@echo "Creating new migration..."
	@read -p "Enter migration message: " msg; \
	cd backend && alembic revision --autogenerate -m "$$msg"

seed:
	@echo "Seeding database with sample data..."
	cd backend && python -c "from app.utils.seed import seed_database; seed_database()"

db-reset:
	@echo "Resetting database..."
	docker-compose down postgres
	docker volume rm gotogether_postgres_data
	docker-compose up postgres -d
	sleep 10
	$(MAKE) migrate
	$(MAKE) seed

# Testing
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && python -m pytest tests/ -v

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

test-e2e:
	@echo "Running end-to-end tests..."
	cd frontend && npm run e2e

# Docker
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting all services with Docker..."
	docker-compose up -d

docker-down:
	@echo "Stopping all Docker services..."
	docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose logs -f

# Production
build:
	@echo "Building for production..."
	cd frontend && npm run build
	cd backend && pip install -r requirements.txt

deploy:
	@echo "Deploying to production..."
	# Add your deployment commands here
	@echo "Deployment commands not configured. Please set up your deployment pipeline."

# Maintenance
clean:
	@echo "Cleaning build artifacts..."
	cd frontend && rm -rf .next node_modules/.cache
	cd backend && find . -type d -name __pycache__ -exec rm -rf {} +
	cd backend && find . -name "*.pyc" -delete
	docker system prune -f

lint:
	@echo "Running linters..."
	cd backend && black --check . && isort --check-only .
	cd frontend && npm run lint

format:
	@echo "Formatting code..."
	cd backend && black . && isort .
	cd frontend && npm run lint -- --fix

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/health || echo "Backend: DOWN"
	@curl -f http://localhost:3000 || echo "Frontend: DOWN"

# Logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

# Quick commands
quick-start: docker-up migrate
	@echo "Quick start complete! Services are running."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "API Docs: http://localhost:8000/docs"
