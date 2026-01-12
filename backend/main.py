"""
Face Recognition Authentication API

FastAPI application for face recognition-based user authentication.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db
from routes.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 Starting Face Recognition API...")
    init_db()
    print("✓ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Face Recognition API...")


# Create FastAPI app
app = FastAPI(
    title="Face Recognition Authentication API",
    description="Real-time face recognition for user authentication",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Allow all origins for ngrok/external testing
# In production, you might want to restrict this to os.getenv("FRONTEND_URL")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/production simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Face Recognition Authentication API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
