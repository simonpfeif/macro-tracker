# SnackStat

A no-nonsense nutrition tracker built for people who actually care about their macros.

## About

I built SnackStat out of frustration. As a personal trainer, I've spent years recommending nutrition tracking apps to clients — and using them myself — only to be met with the same problems: intrusive ads, cluttered interfaces, paywalled basics, and UX that feels like it was designed to keep you scrolling rather than help you hit your goals.

I wanted something clean, fast, and focused. Something that lets you log meals, check your macros, and move on with your day. No social feeds, no gamification, no upsells on every screen — just a sharp tool for people who take their nutrition seriously.

This is also a learning project and portfolio piece. I'm using it to deepen my skills with React, TypeScript, and Firebase while building something I'd genuinely use every day.

## Features

- **Meal logging with drag-and-drop ordering** — Organize your daily meals however you like using intuitive reordering
- **Full macro + micronutrient tracking** — Protein, carbs, fat, calories, plus 10 micronutrients (fiber, sodium, cholesterol, iron, calcium, potassium, vitamin D, sugar, added sugar, saturated fat, trans fat)
- **Smart macro calculator** — Calculates BMR/TDEE based on your stats, with goal-based adjustments for loss, maintenance, or gain
- **Meal templates** — Save frequently eaten meals as templates, reuse them with a tap, with conflict detection for duplicates
- **Custom food database** — Create your own foods or pull from 220+ pre-loaded common foods with full nutritional data
- **Monthly calendar** — View daily log status at a glance (unlogged, started, complete)
- **Daily progress bars** — Goal-aware color coding so you can see where you stand instantly
- **Google authentication** — Sign in with Google, no account setup needed
- **Responsive design** — Works on desktop and mobile

## Tech Stack

- **React 19** with **TypeScript**
- **Vite 7** for builds and dev server
- **Firebase** — Authentication (Google), Firestore (database), Hosting
- **CSS Modules** for scoped styling
- **Radix UI** for accessible primitives
- **DND Kit** for drag-and-drop
- **Lucide** for icons
- **React Router 7** for routing

## Roadmap

SnackStat is actively evolving. Here's where it's heading:

- **Agentic recommendation engine** — AI-powered meal and macro suggestions based on your goals, preferences, and history
- **Weight tracking** — Log and visualize body weight over time
- **Premium tier** — Expanded features for power users
- **Dashboard improvements** — Richer insights and trends

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Firebase project with Authentication (Google provider) and Firestore enabled

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/macro-tracker.git
cd macro-tracker/client

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Add your Firebase config to `.env.local`:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

```bash
# Start the dev server
npm run dev
```

## Project Structure

```
client/src/
  components/        # Reusable UI components
    Header/          # App header and date navigation
    DatePickerCalendar/
    AddMealToLogModal/
    AddFoodToLogModal/
    SaveTemplateDialog/
    MealDetailModal/
    FoodDetailModal/
    MacroCalculator/
    ui/              # Base primitives (Button, Input)
  pages/             # Route-level pages
    DailyLog         # Main daily meal logging view
    Dashboard        # Overview and summary
    Calendar         # Monthly log status calendar
    Foods            # Food database management
    Goals            # Macro goal configuration
    Settings         # Account and app settings
    Login            # Authentication
  services/          # Firestore data access layer
  contexts/          # React context providers
  data/              # Static data (common foods)
  utils/             # Helpers (macro calculations, unit conversion, hashing)
  lib/               # Firebase initialization and shared utilities
  types/             # TypeScript type definitions
```
