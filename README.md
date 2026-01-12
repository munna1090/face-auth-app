# Face Recognition Authentication System

> **Author:** Kasani Chitti Babu  
> **License:** MIT  
> **Tech Stack:** React + FastAPI + face-recognition (dlib)

A secure face recognition authentication system with real-time webcam verification.

---

## 🎯 What This Project Does

- **Register users** with 3-5 face images from different angles
- **Authenticate users** using real-time face recognition via webcam
- **Issue JWT tokens** for secure session management
- **Secret admin panel** for developer-only user management

---

## 📁 Project Structure

```
face recog/
├── backend/                 # Python FastAPI server
│   ├── main.py             # App entry point & CORS config
│   ├── face_service.py     # Face detection & embedding logic
│   ├── routes/auth.py      # API endpoints
│   ├── models.py           # User & FaceEmbedding SQLAlchemy models
│   ├── database.py         # SQLite database config
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── App.jsx         # Router configuration
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Face login with webcam
│   │   │   ├── Register.jsx    # Multi-step registration
│   │   │   ├── Welcome.jsx     # Post-login welcome page
│   │   │   └── AdminDashboard.jsx  # Secret admin panel
│   │   ├── components/
│   │   │   └── WebcamCapture.jsx   # Reusable webcam component
│   │   └── styles/
│   │       └── index.css       # All styling (2000+ lines)
│   └── package.json
│
├── LICENSE
└── README.md
```

---

## � Quick Start

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Webcam** for face capture
- **CMake** (required for dlib installation)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start server (runs on port 8000)
py -m uvicorn main:app --reload --port 8000
```

✅ API available at: `http://localhost:8000`  
📚 API docs at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (runs on port 5173)
npm run dev
```

✅ App available at: `http://localhost:5173`

---

## 🔌 API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/register` | `{ name, email, face_images[] }` | Register with 3-5 base64 face images |
| `POST` | `/api/authenticate` | `{ face_image }` | Verify face, returns JWT token |
| `GET` | `/api/verify?token=xxx` | - | Validate JWT token |
| `GET` | `/api/users` | - | List all registered users |
| `DELETE` | `/api/user/{id}` | - | Delete user by ID |
| `GET` | `/api/health` | - | Health check |

---

## 🧭 User Flow

### Registration (`/register`)
1. Enter name and email
2. Capture 3-5 face images (different angles recommended)
3. Submit → Redirects to Welcome page

### Login (`/`)
1. Position face in webcam oval
2. Click "Verify Identity" or enable "Auto-Scan"
3. Face matched → JWT issued → Redirects to Welcome page

### Welcome (`/welcome`)
- Shows authenticated user's name
- Displays "Identity Verified" badge
- Logout button to clear session

---

## 🔐 Secret Admin Panel

> **For developers only - not exposed to regular users**

### Access Details
| Item | Value |
|------|-------|
| URL | `/admin/technoji-admin-2026` |
| Password | `dev@technoji2026` |

### Security Layers
1. Wrong URL key → Shows fake "404 Page not found"
2. Correct URL → Password gate appears
3. Session stored in sessionStorage (expires on browser close)

### Admin Features
- View all registered users
- Delete users
- System stats overview

---

## ⚙️ Configuration

### Environment Variables (Backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./face_auth.db` | Database connection |
| `SECRET_KEY` | `your-secret-key-...` | JWT signing key (⚠️ change in production!) |

### Face Recognition Settings

In `backend/face_service.py`:
```python
DISTANCE_THRESHOLD = 0.5   # Lower = stricter (0.4-0.6 typical)
```

---

## �️ Security Notes

| ⚠️ For Production |
|-------------------|
| Change `SECRET_KEY` in `routes/auth.py` |
| Change admin URL key and password in `AdminDashboard.jsx` |
| Use HTTPS (not HTTP) |
| Add rate limiting to prevent brute force |
| Consider advanced liveness detection |

---

## 🧪 Tech Stack Details

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | FastAPI | REST API framework |
| Face Recognition | face-recognition (dlib) | 128-dim face embeddings |
| Database | SQLAlchemy + SQLite | User & embedding storage |
| Auth | python-jose | JWT token generation |
| Frontend | React 18 + Vite | UI framework |
| Webcam | react-webcam | Browser camera access |
| Styling | Vanilla CSS | Custom dark theme |

---

## 📄 License

MIT License - Copyright (c) 2026 Kasani Chitti Babu
