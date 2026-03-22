# 🇵🇭 UgnayPH — Connecting Filipinos to Solutions

> **InterCICSkwela Hackathon 2026 — All 6 SDG Challenges**  
> One platform. Six solutions. For every Filipino.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://ugnay-ph-hackahon.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/luigibalingit14/UgnayPh-Hackahon-)

---

## 🧩 What is UgnayPH?

**UgnayPH** (from the Filipino word *ugnay* meaning *connection*) is a unified digital platform that addresses all **6 challenges** of the InterCICSkwela Hackathon 2026. It connects every Filipino to AI-powered public services — from detecting fake news to finding jobs, reporting road issues, and accessing healthcare — all in one glassmorphism-designed, mobile-first web application.

---

## 🎯 Challenges Addressed

| # | Challenge | Module | Description |
|---|-----------|--------|-------------|
| 1 | Digital Literacy | **VibeCheck PH** | AI-powered fake news, scam & disinformation detector using text and image scanning |
| 2 | Smart Mobility | **Mobility PH** | Real-time road issue reporting and AI-powered route advice system |
| 3 | Transparent Governance | **Governance PH** | Public complaint filing, government service request tracker |
| 4 | Employment & Economy | **Jobs PH** | AI job matching, live job listings, and resume-ready job application portal |
| 5 | Healthcare Access | **Health PH** | Symptom checker, telemedicine appointment booking, and nearest clinic finder |
| 6 | Sustainable Agriculture | **Agri PH** | Crop disease detection, weather-based farming guidance, and market price insights |

---

## ✨ Key Features

- 🤖 **AI-Powered Analysis** — Uses Google Gemini 1.5 Flash for multimodal image scanning and Groq Llama for ultra-fast text analysis
- 💬 **Bayanihan Bot** — A global floating AI chatbot trained specifically on Philippine social issues, emergency hotlines, and all 6 UgnayPH modules
- 📊 **Personal Dashboard** — A citizen hub showing all your activity across every module in one view
- 🔐 **Secure Authentication** — Supabase-powered Google OAuth login, no password needed
- 🌐 **Progressive Web App** — Fully responsive, works on any device, with mobile-first design
- ⚡ **Glassmorphism UI** — Modern design with GSAP-powered animations, dark mode, and vibrant color palette

---

## 🛠️ Technologies Used

### Frontend
- **Next.js 15** (App Router, Server Actions)
- **TypeScript** — Strongly typed throughout
- **Tailwind CSS** — Custom design system with glassmorphism effects
- **GSAP** — Advanced animation library for smooth UI transitions
- **Lucide React** — Professional icon library (emoji-free UI)

### Backend & Database
- **Supabase** — PostgreSQL database, Row Level Security (RLS), and real-time subscriptions
- **Next.js API Routes** — Secure server-side endpoints for all AI integrations

### AI & APIs
- **Google Gemini 1.5 Flash** — Multimodal vision AI for image scanning in VibeCheck
- **Groq (Llama 3.1 8B Instant)** — Ultra-fast text analysis for VibeCheck and the Bayanihan Chatbot
- **Supabase Auth** — Google OAuth for secure user authentication

### Deployment
- **Vercel** — Primary deployment platform (Singapore region)
- **Netlify** — Secondary deployment mirror
- **GitHub** — Source code versioning and CI/CD trigger

---

## 🤖 AI Disclosure

> *In compliance with Rule 3 of the Hackathon Guidelines:*

This project uses the following AI-powered tools and services:

| Tool | Purpose |
|------|---------|
| **Google Gemini 1.5 Flash** | Image content analysis in VibeCheck (fake news detection from screenshots) |
| **Groq Cloud (Llama 3.1 8B Instant)** | Real-time text analysis and the Bayanihan emergency chatbot |
| **GitHub Copilot / AI Coding Assistants** | Code generation assistance during development |
| **Supabase AI** | Database schema suggestions |

All AI outputs are used as decision-support tools. Users retain full agency over their actions based on AI recommendations.

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/luigibalingit14/UgnayPh-Hackahon-.git
cd UgnayPh-Hackahon-

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in your API keys (see below)

# 4. Run the development server
npm run dev
```

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_google_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Database Schema

The platform uses **Supabase (PostgreSQL)** with the following core tables:

- `profiles` — User account data linked to Supabase Auth
- `vibecheck_results` — Stored AI analysis history per user
- `mobility_reports` — Road and traffic issue submissions
- `governance_reports` — Government service complaints
- `job_applications` — Jobs module application tracking
- `health_bookings` — Telemedicine appointments
- `agri_reports` — Crop and farming reports

All tables use **Row Level Security (RLS)** to ensure each user can only access their own data.

---

## 👥 Team

<div align="center">
  <img src="public/UMak-Logo-Registered-Favicon.png" width="120" alt="UMAK Logo" />
  <br/>
  <h3>University of Makati</h3>
</div>

- **Team Leader:** Yun-tzu Cosing (Project Manager) - 1st year BSCS
- **Member:** Luigi Balingit (Developer) - 1st year BSIT
- **Member:** John Andre Bermundo (UI/UX Developer) - 1st year BSCS

---

## 📋 Hackathon Compliance Checklist

- ✅ Functional prototype demonstrated
- ✅ All 6 SDG challenges addressed
- ✅ AI tools fully disclosed
- ✅ Public GitHub repository
- ✅ Technologies clearly stated (Next.js, TypeScript, Tailwind, Supabase, Groq, Gemini, GSAP)
- ✅ Real-world applicable and deployable
- ✅ Mobile-responsive design

---

## 📄 License

This project was developed for the **InterCICSkwela Hackathon 2026**. All rights reserved by the UgnayPH team.
