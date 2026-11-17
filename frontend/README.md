# Vox frontend

React + Vite frontend for the live Hindi transcription service.

## Source layout

```text
src/
├── app/                 # Composition root; wires infrastructure into the UI
├── presentation/        # React pages, reusable view components, assets, and styles
├── application/         # Recording and transcription workflow
├── domain/              # Framework-independent transcript operations
└── infrastructure/      # Browser audio capture and WebSocket adapter
```

The four application layers are `presentation`, `application`, `domain`, and `infrastructure`. `app/App.jsx` is the composition root: it creates the browser adapters and injects them into the presentation page. Application code depends on those adapters through injected functions, so it does not import browser or network implementations directly.

## WebSocket configuration

By default, the frontend connects to `ws://<current-host>:8000` (or `wss://` when served over HTTPS). To use another endpoint, set `VITE_TRANSCRIBE_WS_URL` in a frontend `.env` file, for example:

```env
VITE_TRANSCRIBE_WS_URL=ws://localhost:8000
```

## Run locally

```sh
npm install
npm run dev
```
