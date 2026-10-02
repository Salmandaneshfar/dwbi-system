# Infra360

Infra360 is a modular infrastructure resource-management platform. Its backend is built with FastAPI, SQLModel, and JWT authentication, while the web interface communicates with the API and supports Excel import/export workflows.

## Features

- Modular infrastructure inventory and resource management
- FastAPI backend with interactive OpenAPI documentation
- JWT-based authentication
- SQLModel persistence
- Web interface integrated with the backend API
- Excel import and export support
- Health endpoint for operational checks

## Repository structure

- `backend/` - FastAPI application, models, services, authentication, and persistence
- `docs/` - Architecture, requirements, and roadmap documentation
- `index.html`, `script.js`, `style.css` - Current web interface
- `server.js` - Current Node.js integration server
- `install.bat` - Windows service installation helper

## Backend setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Salmandaneshfar/dwbi-system.git
   cd dwbi-system/backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create the local environment file:

   ```bash
   Copy-Item .env.example .env
   ```

5. Replace every placeholder in `.env`. Generate a strong JWT secret with:

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

6. Start the development server:

   ```bash
   uvicorn app.main:app --reload
   ```

## Endpoints

- Health check: `GET /healthz`
- Swagger UI: `GET /api/docs`
- OpenAPI schema: `GET /api/openapi.json`

## Security

- The application has no built-in default password.
- `SECRET_KEY` and `INITIAL_ADMIN_PASSWORD` are required environment variables.
- Never commit `.env`, database files, exports, logs, or production credentials.
- Use a unique initial password of at least 12 characters and rotate it after provisioning.
- Use HTTPS and a managed secret store in production.

## Current status

The FastAPI backend, JWT authentication, modular resource management, API-integrated UI, and Excel import/export workflow are implemented. Architecture notes and planned improvements are maintained in `docs/`.

## Contributing

Create a `feature/<feature-name>` branch for new work and update `docs/roadmap.md` when scope or status changes.
