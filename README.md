# AI Personal Assistant & Goal Schedule Roadmap Engine (MVP)

A mobile-first, AI-driven personal schedule & roadmap generator. Tell the system your goal and daily constraints, and it automatically builds a structured monthly/weekly roadmap, schedules task blocks from wake-up to bedtime, tracks weighted progress, and dispatches timely notifications.

---

## 🏗️ Architecture

- **Backend**: Django 5 + Django REST Framework + Gunicorn
- **Database**: PostgreSQL 16 (production) / SQLite3 (local fallback)
- **AI Integration**: Google Gemini 2.5 Flash (`google-genai` SDK)
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion
- **Containerization & Web Server**: Docker + Docker Compose + Nginx

---

## ⚡ Quick Start (Docker - Recommended for Production)

### 1. Clone & Configure Environment
Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your `GEMINI_API_KEY`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
DJANGO_SECRET_KEY=your_secure_random_key
DB_PASSWORD=your_secure_db_password
```

### 2. Launch with Docker Compose
Run the entire stack (PostgreSQL, Django backend, Nginx frontend):

```bash
docker-compose up -d --build
```

Access the application:
- **Frontend Web App**: `http://localhost`
- **Backend API**: `http://localhost:8000/api/v1/`
- **Django Admin**: `http://localhost:8000/django-admin/`

To view container logs:
```bash
docker-compose logs -f
```

To stop containers:
```bash
docker-compose down
```

---

## 🛠️ Local Development (Without Docker)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**:
   Set `GEMINI_API_KEY` in your environment or `.env` file.

5. **Run migrations & start development server**:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   Backend runs at `http://127.0.0.1:8000/`.

6. **Run Test Suite**:
   ```bash
   python manage.py test
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173/`.

---

## 📑 Core Features Completed

1. **User Onboarding**: Auth (JWT + OTP mock), age & sleep duration calculator, bedtime auto-calculation.
2. **Fixed Commitments & Everyday Activities**: Input work/school blocks and routine daily activities.
3. **AI Assessment & Roadmap Generation**: Dynamic AI assessment questions, multi-phase roadmap generation with sub-objectives.
4. **Daily Timeline & Schedule Engine**: Auto-schedules tasks from wake-up to bedtime avoiding fixed commitments. Live "NOW" indicator.
5. **Weighted Progress Tracking**: Priority-weighted goal progress math (High=3, Med=2, Low=1).
6. **Task Notifications**: Per-task notification toggles and 60-second client-side polling ticker.
7. **Admin Dashboard**: Glassmorphic custom metrics view for platform analytics.
8. **UX & Design System**: Dark glassmorphic design, mobile bottom navigation bar (`BottomNav`), skeleton loaders, and global error boundaries.

---

## 🛡️ License

Private & Proprietary. All rights reserved.
