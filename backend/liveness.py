"""Basic liveness detection using eye blink detection."""
import cv2
import numpy as np
from typing import Tuple, List
import dlib
from scipy.spatial import distance as dist


class LivenessDetector:
    """
    Basic liveness detection using eye blink detection.
    
    This is a simple anti-spoofing measure that checks for eye blinks.
    For production, consider more advanced methods like:
    - 3D depth analysis
    - Texture analysis (LBP)
    - Challenge-response (head movement)
    """
    
    # Eye landmarks indices for dlib 68-point model
    LEFT_EYE_INDICES = list(range(36, 42))
    RIGHT_EYE_INDICES = list(range(42, 48))
    
    # Eye aspect ratio threshold for blink detection
    EAR_THRESHOLD = 0.25
    CONSECUTIVE_FRAMES = 2
    
    def __init__(self):
        """Initialize liveness detector with face landmarks predictor."""
        self.detector = dlib.get_frontal_face_detector()
        try:
            # Try to load shape predictor
            self.predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
            self.predictor_loaded = True
        except Exception:
            print("⚠ Liveness detection: shape_predictor_68_face_landmarks.dat not found")
            print("  Download from: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2")
            self.predictor_loaded = False
        
        self.blink_counter = 0
        self.frame_counter = 0
    
    def _eye_aspect_ratio(self, eye_points: np.ndarray) -> float:
        """
        Calculate eye aspect ratio (EAR).
        
        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        
        When eye is open, EAR is relatively constant (~0.3).
        When eye closes, EAR drops to near 0.
        """
        # Compute euclidean distances between vertical eye landmarks
        A = dist.euclidean(eye_points[1], eye_points[5])
        B = dist.euclidean(eye_points[2], eye_points[4])
        
        # Compute euclidean distance between horizontal eye landmarks
        C = dist.euclidean(eye_points[0], eye_points[3])
        
        # Calculate eye aspect ratio
        ear = (A + B) / (2.0 * C) if C > 0 else 0
        return ear
    
    def _get_eye_points(self, shape, indices: List[int]) -> np.ndarray:
        """Extract eye landmark points from face shape."""
        return np.array([(shape.part(i).x, shape.part(i).y) for i in indices])
    
    def detect_blink(self, frame: np.ndarray) -> Tuple[bool, float]:
        """
        Detect if eyes are blinking in the frame.
        
        Args:
            frame: BGR image frame
            
        Returns:
            Tuple of (is_blinking, average_ear)
        """
        if not self.predictor_loaded:
            # If predictor not loaded, skip liveness check
            return False, 0.3
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.detector(gray, 0)
        
        if len(faces) == 0:
            return False, 0.0
        
        # Get largest face
        face = max(faces, key=lambda f: f.width() * f.height())
        
        # Get facial landmarks
        shape = self.predictor(gray, face)
        
        # Get eye points
        left_eye = self._get_eye_points(shape, self.LEFT_EYE_INDICES)
        right_eye = self._get_eye_points(shape, self.RIGHT_EYE_INDICES)
        
        # Calculate EAR for both eyes
        left_ear = self._eye_aspect_ratio(left_eye)
        right_ear = self._eye_aspect_ratio(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Check if blinking
        is_blinking = avg_ear < self.EAR_THRESHOLD
        
        return is_blinking, avg_ear
    
    def check_liveness(self, frames: List[np.ndarray]) -> Tuple[bool, str]:
        """
        Check liveness by detecting blinks across multiple frames.
        
        Args:
            frames: List of BGR image frames
            
        Returns:
            Tuple of (is_live, message)
        """
        if not self.predictor_loaded:
            # Skip liveness check if predictor not available
            return True, "Liveness check skipped (predictor not loaded)"
        
        if len(frames) < 5:
            return False, "Not enough frames for liveness check"
        
        blink_detected = False
        consecutive_closed = 0
        was_open = False
        
        for frame in frames:
            is_blinking, ear = self.detect_blink(frame)
            
            if not is_blinking and ear > 0:
                was_open = True
                consecutive_closed = 0
            elif is_blinking and was_open:
                consecutive_closed += 1
                if consecutive_closed >= self.CONSECUTIVE_FRAMES:
                    blink_detected = True
                    break
        
        if blink_detected:
            return True, "Liveness verified (blink detected)"
        else:
            return False, "Liveness check failed (no blink detected)"
    
    def simple_check(self, frame: np.ndarray) -> Tuple[bool, str]:
        """
        Simple liveness check for single frame.
        
        This checks basic image properties to detect obvious spoofing.
        """
        # Check if image is not too uniform (photo of photo detection)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Calculate Laplacian variance (blur detection)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var < 50:
            return False, "Image appears to be blurry or a photo of a screen"
        
        # Check for reasonable brightness variation
        std_dev = np.std(gray)
        if std_dev < 20:
            return False, "Image has unusually low contrast"
        
        return True, "Basic liveness check passed"


# Singleton instance
liveness_detector = LivenessDetector()
