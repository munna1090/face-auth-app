"""Core face recognition service using face-recognition library."""
import numpy as np
import face_recognition
import cv2
import base64
from typing import Optional, Tuple, List
import io
from PIL import Image


# Configuration
DISTANCE_THRESHOLD = 0.5  # Lower = stricter matching (0.4-0.6 is typical)


class FaceService:
    """Service for face detection, embedding generation, and matching."""
    
    def __init__(self):
        """Initialize the face service."""
        print("✓ Face recognition service initialized")
    
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        """Decode base64 image to numpy array."""
        # Remove data URL prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to PIL Image then to numpy (RGB format)
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        return np.array(image)
    
    def detect_face(self, image: np.ndarray) -> Tuple[bool, Optional[np.ndarray], Optional[dict]]:
        """
        Detect face in image and return face region.
        
        Returns:
            Tuple of (success, face_image, face_info)
        """
        try:
            # Detect face locations
            face_locations = face_recognition.face_locations(image)
            
            if face_locations and len(face_locations) > 0:
                top, right, bottom, left = face_locations[0]
                face_img = image[top:bottom, left:right]
                facial_area = {"x": left, "y": top, "w": right-left, "h": bottom-top}
                return True, face_img, facial_area
            return False, None, None
            
        except Exception as e:
            print(f"Face detection error: {e}")
            return False, None, None
    
    def generate_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Generate face embedding from image.
        
        Args:
            image: RGB image as numpy array
            
        Returns:
            128-dimensional embedding vector or None if no face detected
        """
        try:
            # Generate face encodings
            encodings = face_recognition.face_encodings(image)
            
            if encodings and len(encodings) > 0:
                return np.array(encodings[0], dtype=np.float32)
            return None
            
        except Exception as e:
            print(f"Embedding generation error: {e}")
            return None
    
    def embedding_to_bytes(self, embedding: np.ndarray) -> bytes:
        """Convert numpy embedding to bytes for storage."""
        return embedding.tobytes()
    
    def bytes_to_embedding(self, data: bytes) -> np.ndarray:
        """Convert bytes back to numpy embedding."""
        return np.frombuffer(data, dtype=np.float32)
    
    def calculate_distance(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate Euclidean distance between two embeddings.
        
        Returns:
            Distance (lower is more similar, 0 = identical)
        """
        return float(np.linalg.norm(embedding1 - embedding2))
    
    def calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate similarity score between two embeddings.
        
        Returns:
            Similarity score (0 to 1, higher is more similar)
        """
        distance = self.calculate_distance(embedding1, embedding2)
        # Convert distance to similarity (inverse relationship)
        # Typical face_recognition distances are 0.0 to ~1.0
        similarity = max(0, 1.0 - distance)
        return similarity
    
    def find_match(
        self, 
        query_embedding: np.ndarray, 
        stored_embeddings: List[Tuple[int, int, np.ndarray]]
    ) -> Optional[Tuple[int, int, float]]:
        """
        Find best matching face from stored embeddings.
        
        Args:
            query_embedding: Query face embedding
            stored_embeddings: List of (embedding_id, user_id, embedding) tuples
            
        Returns:
            Tuple of (embedding_id, user_id, similarity) or None if no match
        """
        best_match = None
        best_distance = float('inf')
        
        for emb_id, user_id, stored_emb in stored_embeddings:
            distance = self.calculate_distance(query_embedding, stored_emb)
            
            if distance < best_distance:
                best_distance = distance
                best_match = (emb_id, user_id, distance)
        
        # Check if best match is within threshold
        if best_match and best_distance <= DISTANCE_THRESHOLD:
            emb_id, user_id, distance = best_match
            similarity = max(0, 1.0 - distance)
            return (emb_id, user_id, similarity)
        
        return None
    
    def validate_face_quality(self, image: np.ndarray) -> Tuple[bool, str]:
        """
        Validate face image quality for registration.
        
        Returns:
            Tuple of (is_valid, message)
        """
        try:
            # Check if face can be detected
            face_locations = face_recognition.face_locations(image)
            
            if not face_locations or len(face_locations) == 0:
                return False, "No face detected in the image"
            
            # Check face size (should be reasonably large)
            top, right, bottom, left = face_locations[0]
            face_width = right - left
            face_height = bottom - top
            
            if face_width < 50 or face_height < 50:
                return False, "Face is too small. Please move closer to the camera"
            
            # Check that we can generate an encoding
            encodings = face_recognition.face_encodings(image)
            if not encodings or len(encodings) == 0:
                return False, "Could not process face features"
            
            return True, "Face detected successfully"
            
        except Exception as e:
            return False, f"Face validation error: {str(e)}"


# Singleton instance
face_service = FaceService()
