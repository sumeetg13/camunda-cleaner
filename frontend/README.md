# Camunda Cleaner Frontend

Modern React-based UI for managing Camunda process instances and deployments.

## Features

- **Modern UI**: Built with React, Vite, and Tailwind CSS
- **Real-time Updates**: Optional polling for live data updates
- **Bulk Operations**: Select and delete multiple instances at once
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Smooth Animations**: Polished transitions and feedback
- **Error Handling**: Comprehensive error handling and user feedback

## Development

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` with proxy to backend on `http://localhost:7171`.

### Build for Production

```bash
npm run build
```

Build output will be in `dist/` directory, which can be served by the Flask backend.

## Environment Variables

Create `.env` file in the frontend directory:

```
VITE_API_BASE=http://localhost:7171
```

## Component Structure

- `App.jsx` - Main application container
- `components/SearchBar.jsx` - Search input with polling controls
- `components/DeploymentCard.jsx` - Deployment display with instances
- `components/ProcessInstance.jsx` - Individual instance with delete
- `components/LoadingSpinner.jsx` - Loading state indicator
- `components/ErrorAlert.jsx` - Error message display
- `hooks/useCamundaApi.js` - API interaction hook
- `hooks/usePolling.js` - Auto-refresh polling hook
- `utils/api.js` - API client functions

## Features in Detail

### Bulk Selection
- Checkboxes on each instance for selection
- Select all within deployment
- Bulk delete selected instances
- Visual feedback for selected state

### Real-time Polling
- Toggle on/off with switch
- Configurable intervals (3s, 5s, 10s, 30s)
- Auto-refresh when data is stale
- Pauses during user interactions

### Deletion Safety
- Double confirmation for destructive actions
- Optimistic updates with rollback on error
- Clear visual feedback during operations
- Undo capability via data refresh

## Styling

Uses Tailwind CSS with custom component classes defined in `src/styles/index.css`.

Custom animations:
- `fade-out` - Smooth removal animation
- `slide-in` - Entry animation for cards
- `spin-slow` - Loading indicator
