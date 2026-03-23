# Nexus AI Agent

## Overview
An autonomous AI customer resolution platform for e-commerce. Features real-time voice and text AI support, CRM portal with analytics, and agent action tracking.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Wouter
- **Backend**: Node.js + Express, Drizzle ORM, PostgreSQL
- **AI**: OpenAI (gpt-4o-mini + gpt-audio for voice), SSE streaming

## Project Structure
- `client/src/pages/` — Main pages (customer-support, crm-portal)
- `client/src/components/` — Layout, Waveform, shadcn UI components
- `server/` — Express API, routes, storage, Drizzle DB
- `server/replit_integrations/` — Audio (voice), Chat modules
- `shared/schema.ts` — Drizzle schema (customers, tickets, agent_actions)

## Design System
- **Fonts**: Syne (display/headings), Inter (body), Fira Code (mono)
- **Theme**: Ultra-dark (#0a0a0a base) with neon cyan (#00F0FF) and electric purple (#8A2BE2) accents
- **Style**: Premium glassmorphism, aurora gradient orbs, smooth Framer Motion animations
- **CSS utilities**: `.glass`, `.glass-panel`, `.gradient-border`, `.text-gradient-primary`, `.aurora-orb`, `.card-hover`

## Key Features
- Voice mode (speak to AI, get audio + transcript response)
- Text mode (chat with streaming SSE responses)
- Quick suggestion chips for common actions
- CRM Portal: stats cards, agent actions table, pie chart, customer cards
- Agent auto-detects and logs actions (refund, password reset, escalate, CRM update)

## Notes
- Razorpay payment integration was requested but not completed (user needs to provide Key ID and Key Secret from dashboard.razorpay.com/app/keys)
- Stripe integration was dismissed by user during OAuth flow
