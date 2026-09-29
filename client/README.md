# Snaptics Angular Application

This directory contains the Angular frontend. See the [repository README](../README.md) for features, prerequisites, backend configuration, architecture, and deployment instructions.

Run commands from this directory:

```powershell
npm ci
npm start
```

Configure both environment files as described in the main README before connecting to the backend. The default development URL is `http://localhost:4200`.

- Production build: `npm run build`
- Browser tests: `npm test`
- One-time headless tests: `npm test -- --watch=false --browsers=ChromeHeadless`

Keep this directory's `package-lock.json` tracked. Local logs and HTTPS credentials should remain outside version control.
