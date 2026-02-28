# Camunda Cleaner

A modern web application for managing and cleaning up Camunda BPM process instances and deployments.

## Features

- **Modern React UI**: Clean, responsive interface built with React, Vite, and Tailwind CSS
- **Real-time Updates**: Optional polling for live data updates
- **Bulk Operations**: Select and delete multiple instances at once
- **Process Management**: Search, view, and delete process instances by deployment
- **Full Deployment Control**: Delete all instances for a deployment or entire deployments
- **Camunda Integration**: Direct integration with Camunda REST API

## Architecture

### Backend (Flask)
- `app.py` - Flask application with JSON API endpoints
- CORS enabled for frontend development
- Environment-based configuration

### Frontend (React)
- Modern React app with Vite
- Tailwind CSS for styling
- Component-based architecture
- Custom hooks for API and polling

## Installation

### Backend Requirements
- Python 3.9+
- pip

### Frontend Requirements
- Node.js 16+
- npm

### Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd camunda-cleaner
```

2. **Install backend dependencies**:
```bash
pip install -e .
```

3. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

4. **Configure environment**:
```bash
# Backend (create .env or set in environment)
export CAMUNDA_USER=demo
export CAMUNDA_PASSWORD=demo
export CAMUNDA_BASE_URL=http://localhost:8080/engine-rest
export PORT=7171

# Frontend (create frontend/.env)
echo "VITE_API_BASE=http://localhost:7171" > frontend/.env
```

## Running the Application

### Development Mode

Run both backend and frontend:

**Terminal 1 - Backend**:
```bash
camunda-cleaner
# or
python -m camunda_cleaner.app
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` with API proxy to backend.

### Production Mode

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend (it will serve the built React app):
```bash
camunda-cleaner
```

The application will be available at `http://localhost:7171`.

## API Endpoints

### GET `/api/process-definitions?key={key}`
Fetch process definitions and instances for a given key.

### DELETE `/delete-instance`
Delete a single process instance (JSON body: `{"instance_id": "..."}`)

### POST `/delete-deployment-instances`
Delete all instances for a deployment (JSON body: `{"deployment_id": "..."}`)

### POST `/delete-all-deployments`
Delete all deployments for a process key (JSON body: `{"process_key": "..."}`)

### GET `/api/health`
Health check endpoint.

## Configuration

Environment Variables:

- `CAMUNDA_USER` - Camunda username (default: "demo")
- `CAMUNDA_PASSWORD` - Camunda password (default: "demo")
- `CAMUNDA_BASE_URL` - Camunda REST API endpoint (default: "http://localhost:8080/engine-rest")
- `PORT` - Backend server port (default: 7171)

## Usage

1. **Search for Process Definitions**: Enter a process definition key
2. **View Deployments**: See all deployments with their process definitions
3. **Manage Instances**:
   - Delete individual instances
   - Delete all instances for a deployment
   - Select and delete multiple instances
4. **Real-time Updates**: Enable auto-refresh for live data
5. **Clean Deployments**: Delete all deployments when needed

## Component Structure

### Backend
- `app.py` - Flask application with API endpoints
- `pyproject.toml` - Project configuration

### Frontend
- `frontend/src/App.jsx` - Main application
- `frontend/src/components/` - React components
- `frontend/src/hooks/` - Custom hooks (useCamundaApi, usePolling)
- `frontend/src/utils/api.js` - API client

## Main Operations

1. **Process Definition Search**: GET `/engine-rest/process-definition`
2. **Delete Instance**: DELETE `/process-instance/{id}`
3. **Bulk Delete Instances**: POST `/process-instance/delete`
4. **Delete Deployment**: DELETE `/deployment/{id}?cascade=true`

## Development

### Backend Development
The Flask backend runs on port 7171 with CORS enabled for frontend development.

### Frontend Development
The Vite dev server runs on port 5173 with proxy configuration to route API calls to the backend.

### Building for Production
```bash
cd frontend
npm run build
```
The built files will be in `frontend/dist/` and served by the Flask backend.

## License

MIT License - see LICENSE file for details
