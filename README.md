# Snaptics Client

Angular frontend for **Snaptics**, an AI-assisted income and expense tracker. Users can record transactions, scan receipts, manage personal and shared budgets, and explore financial insights through a web interface.

**Team:** 4 members · **Role of Dat Nguyen:** Full-stack Developer · **Development:** May–August 2026

[Backend repository](https://github.com/DatNguyenSE/Snaptics-API) · [AWS architecture](https://github.com/DatNguyenSE/Snaptics-API#aws-architecture) · [Getting started](#getting-started)

> **Hosting status:** AWS resources are currently suspended to reduce costs. Previously configured cloud URLs may be unavailable; use a configured development backend to run the application locally.

## Features

- **Dashboard and analytics:** visualize income, expenses, category summaries, and spending trends.
- **Transactions:** create, edit, and review transaction records through manual entry and AI-assisted workflows.
- **Receipt and image scanning:** upload images to the backend, review extracted items, and receive processing results through SignalR.
- **Budgets:** manage personal and shared budgets, members, deposits, and income sources.
- **AI assistant:** interact with backend AI services through a conversational interface.
- **Accounts and settings:** registration, login, profile settings, and notifications.
- **Administration and support:** user management, support tickets, categories, and background-job management screens.

AI inference, receipt extraction, database operations, and authorization enforcement belong to the [backend](https://github.com/DatNguyenSE/Snaptics-API). API keys and AWS credentials must not be placed in browser code.

## Technology stack

| Area | Technologies |
| --- | --- |
| Framework | Angular 20, TypeScript |
| UI | HTML/CSS, Tailwind CSS 4, Tabler UI, Angular CDK |
| State and API integration | RxJS, Angular HttpClient |
| Real-time updates | Microsoft SignalR client |
| Charts | ApexCharts, Chart.js and Angular integrations |
| Routing and access | Angular Router, route guards, JWT integration |
| Testing | Jasmine, Karma |
| Hosting | AWS Amplify; optional manual S3 deployment script |

## Frontend architecture

```text
Snaptics-Client/
├── client/
│   ├── src/app/
│   │   ├── core/          API services, interceptors, guards
│   │   ├── environments/ API and SignalR endpoint settings
│   │   ├── features/      Landing, authentication, shared screens
│   │   ├── user-page/     Dashboard, transactions, budgets, AI features
│   │   ├── admin/         Administration pages and services
│   │   ├── settings-page/ Profile and account settings
│   │   └── models/        DTOs and client models
│   ├── public/            Static assets
│   ├── angular.json       Angular build and development-server settings
│   ├── proxy.conf.json    Optional development proxy
│   ├── package.json       Application scripts and dependencies
│   └── package-lock.json  Dependency lockfile used by npm ci
└── deploy-frontend.ps1    Alternative manual S3 deployment script
```

Feature routes are lazy-loaded. Shared services handle API requests and transaction state with RxJS. The SignalR connection receives notifications and AI processing results without requiring receipt-processing HTTP requests to remain open.

### Receipt analysis flow

1. The user uploads a receipt or image from the scanning interface.
2. The client submits the file to the API and waits for a processing result.
3. The backend uses S3, SQS, and external AI services to process the image.
4. SignalR delivers `ReceiveAiResult` or `ReceiveAiError` to the client.
5. The user reviews the extracted data before submitting a transaction.

See the [backend architecture diagram](https://github.com/DatNguyenSE/Snaptics-API/blob/main/docs/aws-architecture.png) for the AWS deployment topology.

## Getting started

The following commands use PowerShell. Run npm commands **inside `client/`**, not at the repository root.

### 1. Prerequisites

- Git, npm, and a Node.js version supported by the locked Angular packages: **20.19+ within Node 20, 22.12+ within Node 22, or Node 24+**.
- A running [Snaptics API](https://github.com/DatNguyenSE/Snaptics-API#local-setup) with its database and integrations configured.
- Chrome or Chromium for the Karma browser tests.

You do not need a globally installed Angular CLI; npm scripts use the project's local CLI.

### 2. Install dependencies

```powershell
git clone https://github.com/DatNguyenSE/Snaptics-Client.git
Set-Location Snaptics-Client/client
npm ci
```

Keep `client/package-lock.json` in version control so local and hosted builds use the same resolved dependencies. The empty lockfile previously present at the repository root is not used by this Angular application.

### 3. Configure the backend connection

Review both files:

- `client/src/app/environments/environment.ts`
- `client/src/app/environments/environment.development.ts`

For a local API running with its HTTPS profile, set the endpoint values in **both files**:

```typescript
apiUrl: 'https://localhost:7176/',
hubUrl: 'https://localhost:7176/hubs/',
useMockAuth: false,
useMockTransactions: false,
useHangfireDemoData: false,
```

These are properties to update in the existing environment objects, not a replacement for the complete files. Keep each file's existing `production` setting. `hubUrl` ends with `/hubs/` because the notification service appends `notification`.

**Current environment behavior:** some services import `environment.development` directly, others import `environment`, and `angular.json` does not define environment file replacements. Selecting a production build does not automatically switch every service to the production file. Keep endpoint and mock settings consistent across both files, and set both sets of mock flags to `false` when using the real API.

Trust the backend's local HTTPS certificate using `dotnet dev-certs https --trust` on the backend development machine. Configure backend CORS to allow the frontend origin, normally `http://localhost:4200`.

**Development proxy:** `client/proxy.conf.json` currently references a previous cloud IP. Absolute `apiUrl` and `hubUrl` values bypass the Angular proxy. If you choose relative URLs instead, update the proxy targets to your local API and retain WebSocket forwarding for `/hubs`. Changing only the proxy does not redirect requests that use absolute cloud URLs.

### 4. Start the development server

```powershell
npm start
```

Open **http://localhost:4200**. The current development server uses HTTP (`ssl: false`), so local `.pem` files are not required for the default setup. If you enable HTTPS, generate your own development certificate; do not reuse the previously committed private key.

The frontend can render without a working backend, but account, transaction, receipt-processing, and shared-budget flows require their corresponding API services.

## Available commands

Run these from `client/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Angular development server |
| `npm run build` | Build with the default production configuration |
| `npm run watch` | Rebuild using the development configuration |
| `npm test` | Run Jasmine tests in Karma |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Run browser tests once in headless mode |

Production browser assets are emitted under `client/dist/client/browser/` when viewed from the repository root. Test tooling is configured, but the current app-level tests are basic smoke checks rather than comprehensive feature coverage. No end-to-end test target is configured.

## Deployment

### AWS Amplify

Connect this repository to an Amplify application and configure:

- **Application root:** `client`.
- **Build commands:** `npm ci`, followed by `npm run build`, executed from the application root.
- **Artifact directory:** `dist/client/browser`, relative to the application root.
- **SPA routing:** configure a rewrite so Angular routes load `index.html` when opened directly, without rewriting static assets.
- **API configuration:** point both environment files at the deployed backend and disable mock flags before building.

Hosting configuration lives in Amplify; this repository does not currently include an `amplify.yml` or a frontend GitHub Actions workflow. Backend GitHub Actions builds and deployment are maintained in the separate API repository.

Angular endpoint settings are bundled at build time. Hosting environment variables do not replace those TypeScript values automatically; use an explicit configuration-generation step if you adopt environment-variable-driven builds.

### Manual S3 deployment

[deploy-frontend.ps1](deploy-frontend.ps1) is an alternative, manually invoked deployment script. It builds the frontend and synchronizes the output to an S3 website bucket.

Review the script before use: it contains project-specific resource names, can configure public website access, and uses `aws s3 sync --delete`. It is not needed for local development and does not run automatically on push. Keep it unused while AWS hosting is suspended.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Requests still target the old cloud URL | Update both environment files; some services import the development file directly |
| API connection or certificate errors | Confirm the backend is running, its HTTPS certificate is trusted, and CORS permits the frontend origin |
| AI results never arrive | Check the SignalR connection and the backend SQS/AI configuration |
| npm cannot find the application package | Run npm inside `client/` |
| A deployed Angular route returns 404 on refresh | Configure the host's SPA rewrite to `index.html` |
| Tests cannot launch a browser | Install Chrome/Chromium or set `CHROME_BIN` to the available executable |

## Related repository

[Snaptics API](https://github.com/DatNguyenSE/Snaptics-API) contains the ASP.NET Core backend, business logic, EF Core migrations, AI integrations, and AWS architecture documentation.
