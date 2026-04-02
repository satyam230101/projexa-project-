# API Keys and Environment Setup Guide

This guide explains exactly where to add API keys, where to get each key, and how to verify your setup.

## 1. Project Structure (Current)

- `frontend/` -> React app
- `backend/` -> FastAPI app
- `backend/.env` -> backend secret keys
- `frontend/.env` -> frontend runtime config (public-safe values only)

Do not put backend secrets in frontend files.

## 2. Create Environment Files

Create these two files:

1. `backend/.env`
2. `frontend/.env`

You already have templates:

- `backend/.env.example`
- `frontend/.env.example`

Copy from templates and fill values.

## 3. Backend .env (All API keys)

Add this in `backend/.env`:

```env
APP_NAME=Telemedicine Backend
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
FRONTEND_ORIGIN=http://localhost:5173

JWT_SECRET_KEY=replace_with_a_long_random_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=

EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=
SENDGRID_API_KEY=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_SITE_NAME=Telemedicine App

SEARCH_PROVIDER=auto
TAVILY_API_KEY=
SERPAPI_API_KEY=
TRUSTED_GUIDELINE_SOURCES=who.int,aiims.edu,medlineplus.gov,cdc.gov,nice.org.uk
```

## 4. Frontend .env

Add this in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Only keep public-safe values in `frontend/.env`.

## 5. Where to Get Each API Key

## 5.1 Firebase (Database + Storage)

Used for: users, reports, consultations, contacts, storage upload.

Steps:

1. Go to Firebase Console: `https://console.firebase.google.com/`
2. Create project or use existing project.
3. Enable Firestore Database.
4. Enable Cloud Storage.
5. Go to Project Settings -> Service Accounts.
6. Generate new private key JSON.
7. Map fields from JSON to backend `.env`:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY` (keep `\n` escaped)
8. Storage bucket name -> `FIREBASE_STORAGE_BUCKET`.

## 5.2 Email Provider (OTP mails)

You chose OTP flow for signup and forgot password.

You can use either:

1. Resend (recommended)
2. SendGrid

### Resend

1. Go to `https://resend.com/`
2. Create account and API key.
3. Verify sender domain/email.
4. Set:
   - `EMAIL_PROVIDER=resend`
   - `RESEND_API_KEY=<key>`
   - `EMAIL_FROM=<verified_sender>`

### SendGrid

1. Go to `https://sendgrid.com/`
2. Create API key with Mail Send permissions.
3. Verify sender identity/domain.
4. Set:
   - `EMAIL_PROVIDER=sendgrid`
   - `SENDGRID_API_KEY=<key>`
   - `EMAIL_FROM=<verified_sender>`

## 5.3 OpenRouter (Chatbot model)

Used for: LangChain chatbot agent response generation.

Steps:

1. Go to `https://openrouter.ai/`
2. Create API key.
3. Choose model id (examples):
   - `openai/gpt-4o-mini`
   - `anthropic/claude-3.5-sonnet`
4. Set:
   - `OPENROUTER_API_KEY=<key>`
   - `OPENROUTER_MODEL=<model_id>`
   - `OPENROUTER_SITE_URL=http://localhost:5173`
   - `OPENROUTER_SITE_NAME=Telemedicine App`

## 5.4 Tavily (Trusted-source retrieval)

Used for: searching WHO/AIIMS/trusted sources for report/chat grounding.

Steps:

1. Go to `https://tavily.com/`
2. Create API key.
3. Set:
   - `SEARCH_PROVIDER=auto` (or `tavily`)
   - `TAVILY_API_KEY=<key>`

## 5.5 SerpAPI (optional fallback)

Used as optional backup provider.

1. Go to `https://serpapi.com/`
2. Create API key.
3. Set:
   - `SERPAPI_API_KEY=<key>`

If you do not set SerpAPI, app can still use Tavily and free DuckDuckGo fallback.

## 6. API Provider Priority (Search)

Current behavior:

- If `SEARCH_PROVIDER=auto`: `tavily -> serpapi -> duckduckgo`
- If `SEARCH_PROVIDER=tavily`: `tavily -> duckduckgo`
- If `SEARCH_PROVIDER=serpapi`: `serpapi -> duckduckgo`

Trusted domain filtering still applies:

- WHO
- AIIMS
- MedlinePlus
- CDC
- NICE

## 7. Run Backend (Python 3.11)

From project root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Backend should start on `http://localhost:8000`.

## 8. Run Frontend

From project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend should start on `http://localhost:5173`.

## 9. Quick Verification Checklist

## 9.1 Health endpoint

Open:

- `http://localhost:8000/api/health`

Expected JSON:

```json
{"status":"ok","service":"telemedicine-fastapi"}
```

## 9.2 Signup OTP flow

1. Go to app auth page.
2. Register with email.
3. OTP arrives in email.
4. Verify OTP page works.

## 9.3 Forgot password OTP flow

1. Click forgot password.
2. Enter email.
3. OTP arrives.
4. Verify and set new password.

## 9.4 Chatbot citations

Ask in chatbot and confirm response includes trusted source links.

## 9.5 Report analysis

Upload PDF report in health upload section and check:

- summary
- risk level
- recommendations
- citations

## 10. Common Issues

1. OTP email not sending:
   - sender not verified in Resend/SendGrid
   - wrong API key
   - wrong `EMAIL_FROM`

2. Firebase auth/db errors:
   - malformed `FIREBASE_PRIVATE_KEY` newlines
   - wrong project id

3. Chatbot no model response:
   - missing `OPENROUTER_API_KEY`
   - missing `OPENROUTER_MODEL`

4. Trusted search empty:
   - missing Tavily/SerpAPI key
   - strict domain filter + unrelated query

## 11. Security Notes

1. Never commit `.env` files.
2. Keep backend keys only in `backend/.env`.
3. Rotate keys if leaked.
4. Use different keys for development and production.
5. Use a strong random `JWT_SECRET_KEY`.
