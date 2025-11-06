# Backend Structure

This backend follows a clean, modular architecture for better maintainability and scalability.

## Directory Structure

```
backend/
├── app/                    # Main application package
│   ├── __init__.py
│   ├── main.py            # FastAPI application setup
│   ├── core/              # Core functionality
│   │   ├── __init__.py
│   │   ├── config.py      # Application configuration
│   │   ├── database.py    # Database connection and initialization
│   │   └── security.py    # Authentication and authorization
│   ├── models/            # Pydantic models/schemas
│   │   ├── __init__.py
│   │   └── schemas.py     # API request/response models
│   ├── api/               # API routes
│   │   ├── __init__.py
│   │   └── v1/            # API version 1
│   │       ├── __init__.py
│   │       ├── articles.py
│   │       ├── auth.py
│   │       ├── categories.py
│   │       └── sous_categories.py
│   ├── services/          # Business logic (future use)
│   │   └── __init__.py
│   └── utils/             # Utility functions (future use)
│       └── __init__.py
├── scripts/               # Utility scripts
│   ├── create_admin.py
│   ├── reset_admin_password.py
│   ├── debug_login.py
│   ├── check_permissions.py
│   └── test_server.py
├── tests/                 # Test files
├── uploads/               # File uploads directory
├── main.py                # Entry point (imports from app.main)
├── requirements.txt       # Python dependencies
├── pyproject.toml         # Project configuration
├── .env                   # Environment variables
└── Makefile              # Build and run commands
```

## Key Components

### Core Module (`app/core/`)

- **config.py**: Centralized configuration using environment variables
- **database.py**: Database connection management and initialization
- **security.py**: Authentication, authorization, and password hashing

### Models (`app/models/`)

- **schemas.py**: Pydantic models for request/response validation

### API Routes (`app/api/v1/`)

- **articles.py**: Article CRUD operations
- **auth.py**: Authentication and user management
- **categories.py**: Category management
- **sous_categories.py**: Subcategory management

## Running the Application

### Using Makefile

```bash
# Install dependencies
make install-uv

# Run the application
make run-uv

# Full dev setup
make dev-uv
```

### Using uv directly

```bash
# Install dependencies
uv pip install -r requirements.txt

# Run the application
uv run uvicorn main:app --reload
```

### Using traditional pip

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn main:app --reload
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_articles
SECRET_KEY=your-secret-key-here-change-in-production
```

## Scripts

Utility scripts are located in the `scripts/` directory:

- `create_admin.py`: Create admin user
- `reset_admin_password.py`: Reset admin password
- `debug_login.py`: Debug login issues
- `check_permissions.py`: Check user permissions
- `test_server.py`: Test server connectivity

Run scripts from the backend directory:

```bash
python scripts/create_admin.py
```

## Development

The project uses:

- **FastAPI** for the web framework
- **asyncpg** for PostgreSQL async operations
- **Pydantic** for data validation
- **passlib** for password hashing
- **python-jose** for JWT tokens

## Project Structure Benefits

1. **Separation of Concerns**: Clear separation between routes, business logic, and data access
2. **Scalability**: Easy to add new features and API versions
3. **Maintainability**: Well-organized code that's easy to navigate
4. **Testability**: Clear module boundaries make testing easier
5. **Configuration Management**: Centralized settings management
