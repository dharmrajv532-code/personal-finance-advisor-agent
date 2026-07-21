# 🚀 Deployment Guide: FinPilot AI

This guide explains how to deploy **FinPilot AI** (FastAPI Backend + Next.js Frontend) to **Render** and **Vercel** with full persistence and zero quality loss.

---

## 🛠️ Step 1: Database Setup (Important)

By default, the backend is configured to use a local **SQLite** database (`finance.db`). 

> [!WARNING]
> **Avoid SQLite in Production:** Render uses ephemeral containers, which means their file systems reset during deployments or restarts (at least once every 24 hours on the free tier). If you deploy with SQLite, your database will be wiped periodically.

### The Solution: Use a PostgreSQL Database
The backend codebase uses SQLAlchemy and includes the `psycopg2-binary` package, meaning it is **already prepared** to support PostgreSQL without any code changes.

1. **Get a PostgreSQL Instance:**
   - Create a free database on **Neon** (neon.tech), **Supabase** (supabase.com), or **Render PostgreSQL** (free for 90 days).
2. **Copy the Connection URI:**
   - It will look like: `postgresql://username:password@hostname/databasename`
3. Save this URL. You will set it as the `DATABASE_URL` environment variable on Render in the next step.

---

## 🖥️ Step 2: Deploying the Backend on Render

Render is ideal for hosting Python/FastAPI services. Since the backend has a `Dockerfile`, you can deploy it as a Docker service.

### Instructions:
1. Sign in to [Render](https://render.com/).
2. Click **New** (top right) ➔ **Web Service**.
3. Connect your GitHub repository.
4. Set the following configuration parameters:
   - **Name**: `finpilot-backend` (or any name you prefer)
   - **Region**: Select the region closest to you
   - **Branch**: `main` (or your development branch)
   - **Root Directory**: `finance-agent-backend`
   - **Runtime**: `Docker` *(Render will automatically detect the Dockerfile)*
   - **Instance Type**: `Free` (or any paid tier)
5. Click **Advanced** to add **Environment Variables**:
   - `DATABASE_URL` = `<your-postgresql-connection-uri>` (from Step 1)
   - `GROQ_API_KEY_1` = `<your-groq-api-key>`
   - `GROQ_API_KEY_2` = `<your-groq-api-key>`
   - `GROQ_API_KEY_3` = `<your-groq-api-key>`
   - `GROQ_API_KEY_4` = `<your-groq-api-key>`
   - `GMAIL_ADDRESS` = `<your-configured-email>`
   - `GMAIL_APP_PASSWORD` = `<your-app-specific-gmail-password>`
   - `CORS_ORIGINS` = `http://localhost:3000,https://<your-frontend-domain>.vercel.app` *(Replace `<your-frontend-domain>` with the Vercel URL you get in Step 3)*
6. Click **Create Web Service**. 
7. Copy the backend service URL once deployed (e.g., `https://finpilot-backend.onrender.com`).

---

## 🎨 Step 3: Deploying the Frontend on Vercel

Vercel is the creator of Next.js and provides first-class support, CDN edge caching, and optimized builds with zero quality loss.

### Instructions:
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New** ➔ **Project**.
3. Import your GitHub repository.
4. On the **Configure Project** page, set:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `finance-agent-frontend`
5. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL` = `<your-render-backend-url>` (from Step 2, e.g. `https://finpilot-backend.onrender.com`)
6. Click **Deploy**.
7. Once the deployment finishes, copy your live Vercel URL (e.g. `https://finpilot-frontend.vercel.app`).
8. Go back to your Render Backend settings and update the `CORS_ORIGINS` environment variable to include your new Vercel URL:
   `http://localhost:3000,https://finpilot-frontend.vercel.app`

---

## 🔄 Verification & Operations

Once both services are active, the app will work seamlessly:
* **Automatic Database Migrations:** On backend startup, SQLAlchemy runs `Base.metadata.create_all` which will automatically provision all database tables inside your PostgreSQL database.
* **CORS Settings:** The updated backend CORS middleware reads the frontend URL dynamically to allow cross-origin requests securely.
* **Responsive Assets & Charts:** All dashboard graphics (built using Tailwind CSS and Recharts) compile cleanly in the Next.js production build for optimal desktop and mobile presentation.
