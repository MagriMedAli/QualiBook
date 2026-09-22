# QualiBook

### AI-Powered Real Estate Lead Qualification & Meeting Booking

QualiBook is an AI-powered real estate lead management system that handles incoming WhatsApp conversations, qualifies leads automatically, schedules meetings through Google Calendar, and gives the agency a centralized admin dashboard to monitor and manage the entire pipeline.

The system combines **n8n workflow automation, Google Gemini, PostgreSQL, WhatsApp Business API, Google Calendar, and Next.js** into one end-to-end workflow.

---

## Overview

Real estate agencies receive leads through WhatsApp at all hours.

Instead of manually handling every conversation, QualiBook automates the initial qualification process:

- Understands what the lead is looking for
- Collects budget, area, intent, and timeline
- Stores qualification data in PostgreSQL
- Maintains conversation memory across messages
- Checks Google Calendar availability
- Books meetings after confirmation
- Gives agents an admin dashboard to monitor the pipeline

The goal is not to replace the real estate team, but to automate repetitive first-contact work and keep lead information organized.

---

## Architecture

![QualiBook Architecture](./docs/architecture.png)

### High-Level Flow

```text
                    ┌──────────────────────┐
                    │      WhatsApp        │
                    │    Potential Lead    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │        n8n           │
                    │ Workflow Automation  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   PostgreSQL Lookup  │
                    │   Find / Create Lead │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Google Gemini AI   │
                    │   Lead Agent         │
                    └──────┬────┬────┬─────┘
                           │    │    │
              ┌────────────┘    │    └────────────┐
              ▼                 ▼                 ▼
       Update Lead       Check Calendar      Book Meeting
       PostgreSQL        Google Calendar     Google Calendar
              │                 │                 │
              └─────────────────┴─────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   WhatsApp Response  │
                    └──────────────────────┘


             ┌───────────────────────────────────┐
             │       Next.js Admin Dashboard     │
             │                                   │
             │  Leads • Pipeline • Meetings      │
             │  Search • Filters • Statistics    │
             └─────────────────┬─────────────────┘
                               │
                               ▼
                         PostgreSQL