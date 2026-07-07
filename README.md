<div align="center">

# 🧭 FinPilot AI

### Personal Finance Advisor — Powered by Groq · Llama 3.3 · Next.js · FastAPI

<img src="docs/images/finpilot_banner.gif" alt="FinPilot AI Banner" width="100%" style="border-radius: 12px; margin: 15px 0;" />

![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=6366F1&center=true&width=600&lines=AI-Powered+Personal+Finance+Dashboard;Real-Time+Market+Insights+%F0%9F%93%88;Smart+Budget+%26+Goal+Tracking+%F0%9F%8E%AF;Context-Aware+Wealth+Advisor+%F0%9F%A4%96)

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](#)
[![Groq AI](https://img.shields.io/badge/Groq_Llama_3.3-F15A24?style=for-the-badge&logo=meta&logoColor=white)](#)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#)

<p align="center">
  <b>FinPilot AI</b> is a production-ready, full-stack personal finance web application that helps you track income, expenses, budgets, and savings goals, while providing AI-powered financial advice tailored to your life stage, risk profile, and real transaction data.
</p>

[🚀 Getting Started](#-getting-started) · [📸 Screenshots Showcase](#-screenshots-showcase) · [🛠 Tech Stack](#-tech-stack) · [📡 API Reference](#-api-reference) · [🧠 AI Context Engine](#-ai-context-engine) · [🗺 Roadmap](#-roadmap)

</div>

---

## 🌟 Key Features

| Module | What it does |
|:---|:---|
| 🔐 **Auth System** | JWT-based secure signup/login, password reset using Gmail OTP. |
| 👤 **Life Stage Engine** | Automatically detects your financial profile (Student to Retired) on registration. |
| 💵 **Income Tracker** | Log salary, freelance, business, or other income types with month/year filtering. |
| 📉 **Expense Manager** | Categorized expense logger with donut charts & dynamic AI spend prediction banner. |
| 📊 **Budget Planner** | Set monthly category limits, check live progress bars, and receive warning alerts. |
| 🎯 **Savings Goals** | Set goals with target amounts/deadlines, track progress, and top-up on the fly. |
| 📈 **Market Insights** | Real-time commodity (Gold/Silver/Platinum) & NIFTY 50 rates with RSI buy/sell alerts. |
| 🤖 **AI Advisor Chat** | Contextual Llama 3.3-70b chat session loaded with your live financial metrics. |
| 📐 **Wealth Analytics** | Cash flow trends, category breakdown, health score audits, and smart notifications. |
| 🧮 **SIP Calculator** | Compound mutual fund return projections with interactive sliders. |

---

## 🏗 System Architecture

FinPilot AI separates user-facing dashboard logic from core processing engines via a decoupled client-server architecture:

<p align="center">
  <img src="docs/images/finpilot_architecture.gif" alt="FinPilot AI System Architecture" width="100%" style="border-radius: 8px; border: 1px solid #1e1e2f; margin-bottom: 20px;" />
</p>

```mermaid
graph TD
    User([User's Browser]) -->|HTTP / Axios| NextJS_Frontend[Next.js Frontend Dashboard]
    NextJS_Frontend -->|REST API on Port 8001| FastAPI_Backend[FastAPI Backend Server]
    FastAPI_Backend -->|SQLAlchemy ORM| SQLite_DB[(SQLite Database)]
    FastAPI_Backend -->|Live Fetch| Yahoo_Market_APIs[Yahoo Finance API]
    FastAPI_Backend -->|Groq API Client| Groq_AI[Groq Llama 3.3 LLM]
```

---

## 📸 Screenshots Showcase

> [!NOTE]
> Below are real application screenshots showing the current state of the FinPilot AI web dashboard.

<details>
<summary><b>🏠 Landing Page</b></summary>
<br>
<p>Clean landing page with smooth background grids and clear access routes to registration, login, and interactive sandbox demo modes.</p>
<img src="docs/images/landing_page.png" alt="Landing Page" width="100%" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
</details>

<details>
<summary><b>📊 Main Dashboard</b></summary>
<br>
<p>An aggregate overview of your financial health indicators, including Health Score calculations, monthly cash flows, expense breakdown donut charts, budget caps, savings targets, and smart notifications.</p>
<img src="docs/images/dashboard_page.png" alt="Main Dashboard" width="100%" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
</details>

<details>
<summary><b>🎯 Savings Goals</b></summary>
<br>
<p>Establish, top up, and monitor progress metrics for your savings targets (e.g. purchasing electronics, emergency reserves) with detailed progress percentages and timelines.</p>
<img src="docs/images/goals_page.png" alt="Savings Goals" width="100%" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
</details>

<details>
<summary><b>📈 Market Insights Dashboard</b></summary>
<br>
<p>Track Nifty 50 and commodity metals (Gold/Silver/Platinum) in real-time. Displays technical Wilder RSI indicator buy/sell opportunities alongside base-100 performance trend charts.</p>
<h4>Commodity Projections & Signals</h4>
<img src="docs/images/market_page.png" alt="Market Insights Dashboard" width="100%" style="border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;" />
<h4>Live Localhost Workspace View</h4>
<img src="docs/images/market_page_url.png" alt="Market Insights Workspace" width="100%" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
</details>

<details>
<summary><b>🧮 SIP Calculator</b></summary>
<br>
<p>Simulate monthly mutual fund investment compound returns with adjustable sliders for investment caps, expected yield percentages, and maturity years.</p>
<img src="docs/images/calculator_page.png" alt="SIP Calculator" width="100%" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
</details>

---

## 🛠 Tech Stack

<p align="center">
  <img src="docs/images/finpilot_tech.gif" alt="FinPilot Tech Stack" width="100%" style="border-radius: 8px; border: 1px solid #1e1e2f; margin-bottom: 20px;" />
</p>

### Frontend Client
* **Next.js 16** — App Router, SSR, Server Components
* **React 19** — Interactive client-side component trees
* **Tailwind CSS v4** — High-performance utility-first styling
* **shadcn/ui (Nova Theme)** — Premium custom visual styling elements
* **Recharts 3.x** — Interactive charts and financial plots
* **Axios 1.x & sonner** — Request pipelines with JWT interception & custom toast alerts

### Backend Server & Database
* **FastAPI 0.115** — High-performance Python ASGI backend
* **SQLAlchemy 2.x** — Relational database ORM session manager
* **SQLite** — Local file-based data engine
* **Pydantic v2** — Strong serialization and validation schemas
* **Jose & Passlib (Bcrypt)** — Secure hashing & JWT operations
* **yfinance & ta** — Financial market tickers and technical indicator calculations
* **slowapi** — Request rate limiter policies
* **Gmail SMTP** — Automated OTP password reset verification

---

## ⚡ Getting Started

<p align="center">
  <img src="docs/images/finpilot_setup.gif" alt="FinPilot Setup Guide" width="100%" style="border-radius: 8px; border: 1px solid #1e1e2f; margin-bottom: 20px;" />
</p>

### 📋 Prerequisites
- **Python 3.10+**
- **Node.js 20+**
- A **[Groq API Key](https://console.groq.com/)**
- A Gmail account with an **[App Password](https://support.google.com/accounts/answer/185833)** activated

---

<p align="center">
  <img src="docs/images/finpilot_setup_pipeline.gif" alt="FinPilot Installation Pipeline" width="100%" style="border-radius: 8px; border: 1px solid #1e1e2f; margin-bottom: 20px;" />
</p>

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/finpilot-ai.git
cd finpilot-ai
```

---

### Step 2: Backend Setup
1. Navigate into the backend directory and set up a virtual environment:
   ```bash
   cd finance-agent-backend
   python -m venv .venv
   ```
2. Activate the virtual environment:
   * **Windows Powershell**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **Linux/macOS**:
     ```bash
     source .venv/bin/activate
     ```
3. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` configuration file inside `finance-agent-backend/`:
   ```env
   GROQ_API_KEY_1=your_groq_key_here
   DATABASE_URL=sqlite:///./data/finance.db
   GMAIL_ADDRESS=your@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
   > 💡 **Swagger Docs**: Access the interactive API workspace at [http://localhost:8001/docs](http://localhost:8001/docs)

---

### Step 3: Frontend Setup
1. Open a new terminal window and navigate into the frontend directory:
   ```bash
   cd finance-agent-frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
   > 🚀 **App Host**: Access the web dashboard in your browser at [http://localhost:3000](http://localhost:3000)

---

## 📡 API Reference

Full Swagger documentation is accessible at `http://localhost:8001/docs`. Below is a breakdown of the primary endpoints:

### 🔐 Authentication Operations
* `POST /auth/register` — Create a new user profile
* `POST /auth/login` — Authenticate details and obtain JWT token
* `POST /auth/forgot-password` — Generate & email a temporary OTP
* `POST /auth/reset-password` — Change password using validated OTP

### 💰 Financial Transaction Records (Require 🔒 JWT)
* `GET /income/` & `POST /income/` — Log, view, or remove incoming cash flows
* `GET /expenses/` & `POST /expenses/` — Manage outgoing categorized transactions
* `GET /budget/` & `POST /budget/` — Update and retrieve spending threshold parameters
* `GET /goals/` & `POST /goals/` — Manage savings milestones
* `POST /goals/{id}/add-savings` — Add a savings top-up to a specific goal

### 📊 AI Analytics & Market Data (Require 🔒 JWT)
* `GET /market/{asset_types}` — Retrieve real-time commodity data (Nifty 50, Gold, Silver, Platinum)
* `POST /ai/chat` — Send messages to the Llama 3.3-70b advisor client
* `GET /analytics/dashboard` — Fetch calculated financial indicators & Health Scores
* `GET /analytics/predictions` — Query the AI-powered expense forecast models

---

## 🧠 AI Context Engine

When chatting with the **FinPilot AI** assistant, the server compiles a unified profile representation to enrich the LLM's system instruction:

```
+-------------------------------------------------------------+
| User Demographics: Age, Occupation, Life Stage, Risk Level   |
+-------------------------------------------------------------+
| Account Balances: Monthly Income, Savings Rate, Net Asset   |
+-------------------------------------------------------------+
| Budgets: Category caps, current usage ratios                |
+-------------------------------------------------------------+
| Active Savings Goals: Deadlines, target vs current amounts |
+-------------------------------------------------------------+
                              |
                              v
             [ Groq Llama-3.3-70b-versatile ]
                              |
                              v
    Tailored, actionable financial recommendations
```

This guarantees that answers are hyper-customized, avoiding generic financial advice.

---

## 🛡 Security Practices
* **Bcrypt Hashing**: Multi-pass password hashing via Passlib.
* **JWT Guard Rails**: Protected endpoints require standard HS256 tokens with a 24-hour expiry limit.
* **Rate Limiting**: Defends API boundaries from brute force requests using Slowapi.
* **OTP Expiration**: Email OTP codes valid for exactly 10 minutes.

---

## 🗺 Roadmap
- [ ] **Plaid Bank Integration**: Auto-import transaction histories directly.
- [ ] **Tax Forecast Module**: Real-time tax liability forecasting and optimization tools.
- [ ] **Multi-Currency Framework**: Dynamic exchange rates based on global FX rates.
- [ ] **Push Notification Channels**: Mobile-push alerts for budget overrides.
- [ ] **AI-driven Goal Planner**: Conversational plans to hit long-term goals (e.g. "Plan my budget for a house").
- [ ] **Docker Compose Orchestration**: Boot full stack with a single command.
- [ ] **Interactive Dark Theme**: Ready styling handles in CSS variables.

---

## 🤝 Contributing
Contributions make the open-source community amazing!
1. Fork this Repository.
2. Create a Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📨 Contact & Support
For any questions, feedback, or support regarding FinPilot AI, feel free to reach out:
* **Email**: [dharmrajv532@gmail.com](mailto:dharmrajv532@gmail.com)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ using <b>FastAPI + Next.js + Groq AI</b>
  <br>
  <i>"Your money, understood. Your future, planned."</i>
</div>
