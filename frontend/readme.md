# KNCL Transfer Portal Frontend

## Overview

Authentication is handled by Supabase Auth.

The frontend communicates with the FastAPI backend through secured JWT requests.

Users never interact directly with the database.

---

## Technologies

- React
- React Router
- Axios
- Tailwind CSS
- JavaScript
- Vite

---

## Folder Structure

src/
│
├── assets/
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── context/
├── utils/
├── routes/
└── App.jsx

---

## Responsibilities

The frontend team is responsible for:

- User Authentication UI
- Landing Page
- Player Dashboard
- Club Dashboard
- League Dashboard
- Registration Forms
- Transfer Request Pages
- Notifications
- Analytics Dashboard
- Responsive Design

---

## API Communication

All API requests should be placed inside:

```
src/services/
```

Example:

```
authService.js
playerService.js
transferService.js
clubService.js
```

---

## Pages to Build

### Public

- Home
- Login
- Register
- Forgot Password

### Player

- Dashboard
- Profile
- Register to Club
- Submit Transfer
- Transfer History

### Club Admin

- Dashboard
- Players
- Transfers
- Approvals

### League Admin

- Dashboard
- Clubs
- Players
- Reports

### Federation Admin

- Manage Users
- Manage Clubs
- League Settings
- Analytics

---

## Installation

```bash
npm install
npm run dev
```

---

## Coding Standards

- Functional Components only
- Use React Hooks
- Use Axios for API calls
- Keep components reusable
- Keep pages separate from components
- Use meaningful file names

---

## Git Workflow

Create feature branches.

Example:

```
frontend/login
frontend/dashboard
frontend/player-profile
```

Never push directly to main.

---

## Team Members

Frontend Lead

- Edwin

Frontend Developer

- Hashim