# AI Code Security Reviewer

An AI-powered code security reviewer that combines Semgrep, Gitleaks, and Gemini AI to detect vulnerabilities, discover exposed API credentials, explain flaws in plain English, and recommend secure overrides.

This repository features user authentication, session persistence, and code analysis history vaulting using an Express gateway and MongoDB.

---

## Architecture Overview

```
                      +------------------------------------------+
                      |         React Frontend (Vite)            |
                      |          http://localhost:5173           |
                      +------------------------------------------+
                                           |
                                           |  Proxies /api requests
                                           v
                      +------------------------------------------+
                      |         Express API Gateway              |
                      |          http://localhost:5000           |
                      +------------------------------------------+
                         /                                    \
                        / Auth, Sessions,                       \ Proxies /analyze POST
                       /  & History Sync                         \
                      v                                           v
         +--------------------------+               +--------------------------+
         |     MongoDB Database     |               |    FastAPI Scan Engine   |
         |  (Sessions, Users, Vault)|               |    http://localhost:8000 |
         +--------------------------+               +--------------------------+
```

1.  **Vite / React Frontend (Port 5173):** High-fidelity dashboard that communicates with the Express API gateway via Vite's proxy mapping (`/api` mapped to `http://localhost:5000`). Access controls are enforced using a React authentication context (`UserContext`) and protected route guards.
2.  **Express API Gateway (Port 5000):** Manages user authentication, checks session states, persists sessions in MongoDB (`connect-mongo`), syncs offline history, and forwards code analysis requests to the FastAPI backend.
3.  **FastAPI Analysis Service (Port 8000):** Core scanning engine that executes Semgrep rules, triggers Gitleaks credential checkers, and aggregates findings with OWASP/CWE metrics and Gemini-driven explanations.
4.  **MongoDB Atlas (Cloud Cluster):** Stores hashed user credentials (bcrypt), session tokens, and the persistent scan history vault.

---

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   Python (3.10+)
-   MongoDB Atlas Connection String (pre-configured)

---

### Step 1: Configure and Start FastAPI Service

1.  Navigate to the `analysis-service` directory:
    ```bash
    cd analysis-service
    ```
2.  Activate the virtual environment:
    -   **Windows:**
        ```bash
        new-env\Scripts\activate
        ```
    -   **macOS/Linux:**
        ```bash
        source new-env/bin/activate
        ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Start the FastAPI server:
    ```bash
    python -m uvicorn app.main:app --port 8000
    ```

---

### Step 2: Configure and Start Express API Gateway

1.  Navigate to the `express-api` directory:
    ```bash
    cd express-api
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Express server in development mode:
    ```bash
    npm run dev
    ```
    *The gateway will automatically establish a connection to the MongoDB Atlas database cluster.*

---

### Step 3: Configure and Start React Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the Vite development server:
    ```bash
    npm run dev
    ```
4.  Open your browser to `http://localhost:5173`.

---

## Authentication Endpoints (Express Gateway)

The Express gateway exposes the following cookie-based session paths (proxied under `/api` in frontend):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new user with username, email, and password. Establishes session. |
| `POST` | `/auth/login` | Authenticate username/email and password. Establishes session. |
| `POST` | `/auth/logout` | Terminate current user session and purge the session cookie. |
| `GET` | `/auth/me` | Fetch active user session profile (returns user object or `null`). |
| `GET` | `/history` | Fetch persistent analysis history vault for the logged-in user. |
| `POST` | `/history` | Save/Sync a code security analysis report to the user's MongoDB vault. |
| `DELETE` | `/history/:id` | Delete a single scan report by its `analysis_id`. |
| `DELETE` | `/history` | Purge all scan reports for the authenticated user. |
