# Project Overview: Nexus Talent - Architectural Recruitment Intelligence

## 1. Executive Summary
**Nexus Talent** is a high-end, full-stack recruitment and talent management platform specifically engineered for the architectural and design industry. It bridges the gap between top-tier architectural talent and world-renowned firms (e.g., Foster + Partners, Zaha Hadid Architects) through a data-driven, automated, and highly visual interface.

The platform is designed to replace fragmented spreadsheets and manual tracking with a unified "Recruitment Command Center" that provides real-time situational awareness and streamlined candidate processing.

---

## 2. Core Value Proposition
*   **Efficiency**: Reduces time-to-hire by up to 30% through automated workflows and centralized scheduling.
*   **Intelligence**: Provides executives with real-time market trends, revenue pulses, and skill demand analytics.
*   **Brand Authority**: A premium public-facing portal that reflects the design excellence of the architectural industry.
*   **Scalability**: Built on a cloud-native architecture ready for global deployment.

---

## 3. Key Platform Features

### A. The Public Portal (Candidate Experience)
*   **High-Impact Landing Page**: Modern, responsive design that showcases firm authority and success metrics.
*   **Roles Catalog**: A searchable, filterable list of open mandates with detailed expertise requirements.
*   **Seamless Application**: Integrated application flow with resume upload and portfolio linking.
*   **Newsletter Integration**: Captures passive talent through an automated subscription system.

### B. The Admin Command Center (Recruiter Experience)
*   **Talent Pool Management**: Full lifecycle tracking of candidates from "Applied" to "Selected."
*   **Interview Scheduler**: A visual management system for technical reviews and partner interviews.
*   **Roles Management**: Real-time control over job postings, client requirements, and headcount tracking.
*   **Automated Communication**: Integrated newsletter broadcasting system via Resend API.

### C. Executive Intelligence (Owner/Director Experience)
*   **Intelligence Dashboard**: Real-time monitoring of open roles, active candidates, and selection goals.
*   **Market Analytics**: Tracking of high-demand skills (e.g., BIM, Revit, Sustainability) to inform business strategy.
*   **Revenue Pulse**: Monitoring of current revenue against quarterly targets with growth projections.
*   **Live Activity Feed**: A "heartbeat" monitor of all platform events as they happen.

---

## 4. Technical Architecture & Security
The platform is built using a modern, industry-standard tech stack designed for performance and reliability:

*   **Frontend**: React 18 with TypeScript, Vite, and Tailwind CSS.
*   **Backend**: Node.js with Express, providing a robust API layer.
*   **Database**: 
    *   **Production**: Integrated with **Amazon RDS (MySQL)** for enterprise-grade data persistence and scalability.
    *   **Development/Fallback**: Local AlaSQL persistence for rapid development and testing.
*   **Infrastructure**: Container-ready architecture (Docker) suitable for deployment on AWS App Runner, Google Cloud Run, or EC2.
*   **Integrations**: 
    *   **Resend API**: For reliable email delivery and newsletters.
    *   **Multer**: For secure file handling and resume storage.

---

## 5. Current Project Status
The project is currently **Production-Ready**. 
*   All core modules (Public, Admin, Intelligence) are fully functional.
*   The backend API is integrated and tested.
*   MySQL RDS support is implemented and ready for cloud connection.
*   The UI is polished with high-quality animations and responsive design.

---

## 6. Future Roadmap
1.  **AI Matching**: Implementing Gemini-powered candidate-to-role matching scores.
2.  **Client Portal**: A dedicated login for architectural firms to view their specific talent pipelines.
3.  **Mobile App**: Native iOS/Android companion app for recruiters on the move.
4.  **Advanced Analytics**: Predictive modeling for future hiring needs based on market trends.

---
**Prepared by:** Nexus Talent Engineering Team
**Date:** April 2026
