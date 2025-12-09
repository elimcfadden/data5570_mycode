# Gym Tracker

A mobile workout tracking application for logging gym sessions and viewing fitness analytics.

## Overview

Gym Tracker helps you log your workouts, track progress over time, and analyze your training by muscle group. The app consists of three main screens:

### 1. Home Screen (Calendar)
- Monthly calendar view displaying all days in a 7-column grid
- Navigate between months (1–12) and years (2025–2026)
- Days with recorded workouts are visually highlighted
- Displays total weight lifted for the selected month

### 2. Day Screen (Workout Logging)
- Accessed by tapping a date on the calendar
- Log workout entries with: Exercise, Sets, Reps, Weight
- View and edit existing workouts for that day
- Displays total weight lifted for the day (calculated as sets × reps × weight per entry)

### 3. Analytics Screen
- Aggregated training data by muscle group: chest, back, legs, shoulders, arms, core, other
- Per muscle group: total sets and total weight lifted
- Overall totals: total number of workouts, total weight lifted across all time

## Tech Stack

### Backend
- **Framework:** Django + Django REST Framework
- **Database:** SQLite
- **Location:** `backend/`

### Frontend
- **Framework:** Expo React Native (JavaScript)
- **State Management:** Redux Toolkit / RTK Query (planned)
- **Location:** `frontend/`

## Project Structure

```
gym-tracker/
├── backend/          # Django REST API
│   ├── server/       # Django project package (created via django-admin)
│   ├── manage.py
│   └── requirements.txt
├── frontend/         # Expo React Native app (to be created)
├── .gitignore
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the project root:
   ```bash
   cd gym-tracker
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\Activate
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Initialize Django project (first time only):
   ```bash
   django-admin startproject server .
   ```

5. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Setup

(To be documented when frontend is created)

## License

Private project.

