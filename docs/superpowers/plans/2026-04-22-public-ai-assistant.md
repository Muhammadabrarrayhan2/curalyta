# Public AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `Tanya AI` feature on the landing page that works without login, backed by Gemini free tier, while leaving existing clinical AI flows intact.

**Architecture:** Extend the existing public backend module with a dedicated AI chat endpoint and separate Gemini configuration. Add a landing-page section and public chat UI that uses the new endpoint with in-memory conversation state only.

**Tech Stack:** React, TypeScript, Express, Axios, Zod, Gemini REST API

---

### Task 1: Add backend support for public Gemini chat

**Files:**
- Modify: `backend/src/config/index.ts`
- Modify: `backend/src/modules/public/public.module.ts`

- [ ] **Step 1: Add Gemini config**
- [ ] **Step 2: Add request validation schema for public chat**
- [ ] **Step 3: Implement a small Gemini REST helper inside the public module**
- [ ] **Step 4: Add `POST /public/ai-chat` with graceful 503 fallback when key is missing**

### Task 2: Add public landing-page AI UI

**Files:**
- Modify: `frontend/src/components/ui/Icon.tsx`
- Modify: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Add any missing icon needed by the new public AI section**
- [ ] **Step 2: Add `Tanya AI` to public navigation**
- [ ] **Step 3: Add a public AI section with intro, prompt chips, and chat panel**
- [ ] **Step 4: Wire the section to call `/api/public/ai-chat` without auth**

### Task 3: Verify stability and public usability

**Files:**
- Modify: none

- [ ] **Step 1: Rebuild backend/frontend images**
- [ ] **Step 2: Verify health endpoint stays green**
- [ ] **Step 3: Verify public AI endpoint returns graceful config error without key or a model reply with key**
- [ ] **Step 4: Verify landing page still loads and auth flows still work**
