# UgnayPH - InterCICSkwela Hackathon 2026

UgnayPH is a comprehensive, AI-powered Bayanihan Super App designed to address the six challenge modules of the InterCICSkwela Hackathon 2026. It serves as a centralized "Digital Citizen ID" dashboard connecting Filipinos to essential services ranging from Healthcare to Smart Mobility.

## 👥 Team Members
- **Yun-tzu Cosing** - Team Leader / Project Manager
- **Luigi Balingit** - Developer
- **John Andre Bermundo** - UI/UX Developer

## 🚀 Features (The 6 Modules)
1. **Smart Mobility & Transportation:** Live traffic feeds and route optimization.
2. **Digital Literacy (VibeCheck PH):** AI-powered Fake News, Scam, and Phishing detector.
3. **Transparency & Good Governance:** Community incident AI reporting.
4. **Employment & Economic Opportunities:** Job posting and AI skill matching.
5. **Healthcare Access:** Health center booking and AI symptom checking.
6. **Sustainable Agriculture:** Direct-to-consumer market prices and AI crop advisory.

## 🤖 AI Disclosure (Compliance to Rule #3)
In full compliance with the InterCICSkwela Hackathon General Guidelines (Rules and Restrictions #3), we officially disclose the use of the following AI-powered tools and platforms during the development of UgnayPH:
- **Groq Cloud API (Llama 3.1 8B):** Powers the core generative AI features of the platform, including the Health Symptom Checker, Jobs Skill Matcher, Agri Crop Advisory, and VibeCheck Text Analysis.
- **AI Coding Assistants:** Utilized as an assistant debugger and boilerplate generator to accelerate the development of the Next.js and Supabase backend architecture.

## 🛠️ Technology Stack
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, TypeScript, GSAP (Animations)
- **Backend & Database:** Supabase (PostgreSQL, Authentication), Next.js API Routes
- **AI Integration:** Groq API Cloud
- **Design:** Glassmorphism UI with Philippine cultural themes

## 💻 Quick Start & Deployment
1. Clone the repository `git clone https://github.com/luigibalingit14/UgnayPh-Hackahon-.git`
2. Run `npm install`
3. Set your `.env.local` variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`)
4. Run the SQL schemas in Supabase (`supabase-schema.sql` and `ugnayph-schema.sql`)
5. Run `npm run dev` to start the local development server.

*This project was developed for the InterCICSkwela Hackathon 2026. View the full guidelines in `HACKATHON.md`.*
