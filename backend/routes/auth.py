"""Authentication routes for face recognition system."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os

from database import get_db
from models import User, FaceEmbedding
from face_service import face_service

# Router
router = APIRouter(prefix="/api", tags=["authentication"])

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# Pydantic Models
class RegisterRequest(BaseModel):
    """Request model for user registration."""
    name: str
    email: EmailStr
    face_images: List[str]  # Base64 encoded images


class AuthenticateRequest(BaseModel):
    """Request model for face authentication."""
    face_image: str  # Base64 encoded image


class UserResponse(BaseModel):
    """Response model for user data."""
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Response model for authentication."""
    success: bool
    message: str
    user: Optional[UserResponse] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    user_id: int
    email: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("email")
        if user_id is None or email is None:
            return None
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        return None


@router.post("/register", response_model=AuthResponse)
async def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user with face images.
    
    Requires 3-5 face images for accurate recognition.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Validate number of images
    if len(request.face_images) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 face images are required for registration"
        )
    
    if len(request.face_images) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 face images allowed"
        )
    
    # Process face images and generate embeddings
    embeddings = []
    for i, base64_image in enumerate(request.face_images):
        try:
            # Decode image
            image = face_service.decode_base64_image(base64_image)
            
            # Validate face quality
            is_valid, message = face_service.validate_face_quality(image)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image {i+1}: {message}"
                )
            
            # Generate embedding
            embedding = face_service.generate_embedding(image)
            if embedding is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image {i+1}: Could not generate face embedding"
                )
            
            embeddings.append(embedding)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image {i+1}: Error processing image - {str(e)}"
            )
    
    # Create user
    user = User(name=request.name, email=request.email)
    db.add(user)
    db.flush()  # Get user ID before committing
    
    # Store embeddings
    for embedding in embeddings:
        face_emb = FaceEmbedding(
            user_id=user.id,
            embedding=face_service.embedding_to_bytes(embedding)
        )
        db.add(face_emb)
    
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )
    
    return AuthResponse(
        success=True,
        message=f"User registered successfully with {len(embeddings)} face images",
        user=UserResponse.model_validate(user),
        access_token=access_token
    )


@router.post("/authenticate", response_model=AuthResponse)
async def authenticate_user(request: AuthenticateRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via face recognition.
    
    Compares the provided face against all registered faces.
    """
    try:
        # Decode image
        image = face_service.decode_base64_image(request.face_image)
        
        # Generate embedding for query face
        query_embedding = face_service.generate_embedding(image)
        if query_embedding is None:
            return AuthResponse(
                success=False,
                message="No face detected in the image"
            )
        
        # Load all stored embeddings
        all_embeddings = db.query(FaceEmbedding).all()
        
        if not all_embeddings:
            return AuthResponse(
                success=False,
                message="No registered users found"
            )
        
        # Convert to format for matching
        stored_embeddings = [
            (emb.id, emb.user_id, face_service.bytes_to_embedding(emb.embedding))
            for emb in all_embeddings
        ]
        
        # Find best match
        match = face_service.find_match(query_embedding, stored_embeddings)
        
        if match is None:
            return AuthResponse(
                success=False,
                message="Face not recognized. Please register first."
            )
        
        emb_id, user_id, similarity = match
        
        # Get user details
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return AuthResponse(
                success=False,
                message="User not found in database"
            )
        
        # Create access token
        access_token = create_access_token(
            data={"user_id": user.id, "email": user.email}
        )
        
        return AuthResponse(
            success=True,
            message=f"Authentication successful (confidence: {similarity:.2%})",
            user=UserResponse.model_validate(user),
            access_token=access_token
        )
        
    except Exception as e:
        return AuthResponse(
            success=False,
            message=f"Authentication error: {str(e)}"
        )


@router.get("/verify")
async def verify_user_token(token: str, db: Session = Depends(get_db)):
    """Verify JWT token and return user info."""
    token_data = verify_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "valid": True,
        "user": UserResponse.model_validate(user)
    }


@router.delete("/user/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user and their face embeddings."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)  # Cascades to embeddings
    db.commit()
    
    return {"success": True, "message": f"User {user.name} deleted successfully"}


@router.get("/users")
async def list_users(db: Session = Depends(get_db)):
    """List all registered users."""
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [UserResponse.model_validate(user) for user in users]
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "face-recognition-api"}
