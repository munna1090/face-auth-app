"""SQLAlchemy models for face recognition system."""
from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """User model storing basic user information."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to face embeddings
    embeddings = relationship("FaceEmbedding", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"


class FaceEmbedding(Base):
    """Face embedding model storing face vectors for recognition."""
    __tablename__ = "face_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    embedding = Column(LargeBinary, nullable=False)  # Stored as numpy bytes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to user
    user = relationship("User", back_populates="embeddings")
    
    def __repr__(self):
        return f"<FaceEmbedding(id={self.id}, user_id={self.user_id})>"
