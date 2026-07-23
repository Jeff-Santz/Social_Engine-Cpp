# Social Engine (C++ Core) - Beta v1.4.0

> **High-Performance Social Network Backend written in C++**

**Social Engine** is a robust, high-performance RESTful API developed in modern C++ (C++17/20), utilizing the Crow microframework and SQLite. This project serves as the central engine for a complete social network, handling authentication, complex relationship graphs, community management, and media distribution.

## Project Status

* **Backend (C++):** STABLE (v1.4.0) - Implements RBAC, Privacy Logic, and Content Hierarchies.
* **Frontend (Vue.js):** REFACTORED - No longer a single `index.html` file. Now a modular Vue 3 SPA (Vite build) with Vue Router, Pinia stores, and `vue-i18n`, fully integrated with the API.

## Version 1.4.0 Changelog

The latest release introduces significant logic improvements:

* **Hybrid Authentication:** Login endpoint now accepts a generic `identifier` field, automatically resolving to either Username or Email.
* **Privacy Hardening:** SQL logic updated to strictly enforce private profile rules. Posts from locked accounts are now invisible to non-friends in the global feed.
* **Community Workflows:** Implemented "Direct Join" vs. "Request to Join" logic based on community privacy settings. Added Admin approval endpoints.
* **Media Handling:** Full Base64 support for User Avatars, Cover Photos, and Post Media.
* **Frontend Rewrite:** The original single-file `index.html` component was split into a proper Vue 3 project structure (`views/`, `components/`, `stores/`, `composables/`), with routing and state management handled by Vue Router and Pinia instead of a monolithic root component.
* **i18n Sync Fix:** Translation keys used across the frontend (`t('KEY')`) were audited against the backend's `Translation.cpp` dictionary and corrected — most had drifted out of sync and were falling back to the raw `[KEY]` placeholder shown by `Translation::get()`.

## Engine Features

### Backend — Core Architecture & Security

* **HTTP Server:** Powered by Crow (Asynchronous C++ Microframework).
* **Authentication:** JWT (JSON Web Tokens) system with Bearer Auth.
* **Hybrid Login:** Smart resolution of credentials (Email/Username).
* **Database:** Integrated SQLite with enforced Foreign Keys and ON DELETE CASCADE for data integrity.
* **Localization (i18n):** Native internationalization system (PT-BR/EN-US) embedded in the binary (`Translation.cpp`), consumed as the single source of truth for every translation key rendered by the frontend.

### Frontend — Architecture

* **Framework:** Vue 3 (Composition API, `<script setup>`), built with Vite.
* **Routing:** Vue Router with named routes (`feed`, `communities`, `friends`, `notifications`, `profile`, `admin`).
* **State Management:** Pinia stores, one per domain — `auth`, `posts`, `communities`, `friends`, `notifications`, `admin`, `profile`, `reports`.
* **i18n:** `vue-i18n`, with keys pulled from the backend's translation dictionary rather than hardcoded strings, so PT-BR/EN-US stay consistent between server and client.
* **Composables:** `useApi` (Bearer-authenticated fetch wrapper) and `useToast` (feedback notifications) shared across stores and views.
* **Session Persistence:** Token and user data persisted in `localStorage`, restored on load and used to resume notification polling.

### User Management & Social Graph

* **Profiles:** Support for Bio, Birth Date, and Base64 Media (Avatar/Cover).
* **Privacy Logic:**
    * **Public:** Visible to all users.
    * **Private:** Content visible only to accepted friends.
* **Friendship System:** Bi-directional relationships with status states (Pending, Accepted, Blocked).
* **Search:** SQL `LIKE` queries for user discovery.

### Communities (Groups)

* **Access Control:**
    * **Public Groups:** Immediate entry upon join.
    * **Private Groups:** Users must request entry; Admins must approve via the API.
* **Role Management:** Hierarchical system (Master, Admin, Member). Masters can promote/demote members.
* **Content Isolation:** Community posts appear in the global feed with distinct tagging but belong to the community context.

### Moderation & Reports

* **Reporting:** Users can report posts, comments, or profiles from any view via a shared report modal.
* **Categories:** Reports are classified as `spam`, `hate`, or `fake`, matching the backend's translation keys for report categories.
* **Admin Panel:** A dedicated moderation view lists open reports and lets an admin resolve them (approve/reject).
* **Security Model:** Admin access is enforced server-side (only the root admin account can call the moderation endpoints); the frontend just hides the Admin tab for everyone else — it doesn't gate anything on its own.

### Content & Interaction

* **Algorithmic Feed:** Chronological timeline aggregating:
    1. Self posts.
    2. Friend posts (respecting privacy).
    3. Community posts.
    4. Public content.
* **Media Support:** Handling of large Base64 payloads for images.
* **Comments:** Recursive/Nested comment structure (Threaded view).
* **Notifications:** Database-backed system for interactions (Likes, Comments, Approvals).
* **Input Validation:** Server-side character limits (300 for posts, 200 for comments).

## How to Build & Run

### Prerequisites

* C++ Compiler (GCC, MinGW, or MSVC) supporting C++17 standard.
* CMake (3.10 or higher).
* Dependencies: Crow, SQLite3 (included or linked).

### Build Instructions

```bash
mkdir build
cd build
cmake ..
cmake --build . --config Release
```

### Running the Frontend

The frontend now lives in `frontend/` as a standalone Vite project (no longer a single `index.html` you just open in a browser):

```bash
cd frontend
npm install
npm run dev
```

The dev server expects the C++ backend to be running and reachable (see `useApi`'s `API_BASE` for the configured API URL).

Developed by Jeff Industries - 2026

## A Note on AI Usage

This project is a **proof of concept whose main goal is the backend**, not the frontend.

* **Backend (C++):** Every architectural decision — data model, endpoints, privacy rules, role hierarchy, i18n system, etc. — was designed and structured by me. AI was used to generate the "boring", repetitive parts of the code, but all of it was fully reviewed and directed by me end-to-end.
* **Frontend (Vue.js):** Written entirely by AI. It exists to exercise and demonstrate the backend API, not as the focus of this project.

# Demo

[![Watch the video](https://img.youtube.com/vi/LBEs05LCzN0/0.jpg)](https://www.youtube.com/watch?v=LBEs05LCzN0)
