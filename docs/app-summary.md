# TNI AU Aircrew Platform — One-Page Summary

## What it is
TNI AU Aircrew Platform is a frontend-only single-page application (SPA) for aircrew operations, built with React, TypeScript, TailwindCSS, and Vite.
It centralizes operational readiness workflows in the browser without a backend API.

## Who it's for
Primary persona: Indonesian Air Force (TNI AU) aircrew stakeholders such as Pilot, Flight Safety Officer, Ops Officer, Medical, and Commander/Admin roles.

## What it does
- Shows a readiness dashboard and mission-profile-driven readiness score.
- Manages E-Logbook entries and sortie-related operational records.
- Supports ORM risk assessments and safety/incident reporting workflows.
- Tracks training/currency status and schedule planning.
- Handles NOTAM acknowledgment and operational awareness pages.
- Enforces role-based route/action access for multiple operational roles.
- Persists app data locally, including audit logs, and supports client-side CSV/PDF export.

## How it works (repo-evidence architecture)
- Client app: React SPA with BrowserRouter route-based pages (core pages + dynamic feature modules).
- State layer: AppProvider uses React Context + useReducer as global state manager.
- Data/persistence: initial mock data seeds state, then reads/writes full app state to browser localStorage.
- Access control: RBAC utilities gate route visibility and write actions per role.
- Derived analytics: readiness score is computed from state and exposed through context.
- Delivery/runtime: Vite dev/build pipeline, static frontend deploy, and service-worker registration for basic offline behavior.
- Integrations/back-end: Not found in repo (no API client/service integration found).

## How to run (minimal)
1. Install dependencies: `npm install`
2. Start local dev server: `npm run dev`
3. Build production assets (optional): `npm run build`
4. Preview build locally (optional): `npm run preview`
