import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import WebcamCapture from '../components/WebcamCapture'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const MIN_IMAGES = 3
const MAX_IMAGES = 5

function Register() {
    const navigate = useNavigate()
    const webcamRef = useRef(null)

    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')

    // Capture state
    const [capturedImages, setCapturedImages] = useState([])
    const [step, setStep] = useState(1)

    // Status state
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const handleCapture = useCallback((imageSrc) => {
        if (capturedImages.length < MAX_IMAGES) {
            setCapturedImages(prev => [...prev, imageSrc])
            const remaining = MAX_IMAGES - capturedImages.length - 1
            setMessage({
                type: 'info',
                text: remaining > 0
                    ? `Image ${capturedImages.length + 1}/${MAX_IMAGES} captured! ${remaining} more for better accuracy.`
                    : 'All images captured! Ready to register.'
            })
        }
    }, [capturedImages.length])

    const removeImage = (index) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleFormSubmit = (e) => {
        e.preventDefault()
        if (!name.trim() || !email.trim()) {
            setMessage({ type: 'error', text: 'Please fill in all fields' })
            return
        }
        setStep(2)
        setMessage({ type: 'info', text: 'Position your face in the oval and capture multiple angles' })
    }

    const handleRegister = async () => {
        if (capturedImages.length < MIN_IMAGES) {
            setMessage({ type: 'error', text: `Please capture at least ${MIN_IMAGES} images` })
            return
        }

        setIsLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const response = await axios.post(`${API_URL}/register`, {
                name: name.trim(),
                email: email.trim(),
                face_images: capturedImages
            })

            if (response.data.success) {
                localStorage.setItem('token', response.data.access_token)
                localStorage.setItem('user', JSON.stringify(response.data.user))

                setMessage({
                    type: 'success',
                    text: `Welcome ${response.data.user.name}! Redirecting to dashboard...`
                })

                setTimeout(() => {
                    navigate('/welcome')
                }, 1500)
            } else {
                setMessage({ type: 'error', text: response.data.message })
            }
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'Registration failed'
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page register-page">
            <div className="auth-container">
                {/* Left Panel - Branding */}
                <div className="auth-branding">
                    <div className="brand-content">
                        <div className="brand-icon">🔐</div>
                        <h1>Join SecureAuth</h1>
                        <p>Create your account with advanced facial recognition technology</p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <span className="feature-icon">🛡️</span>
                                <span>Military-grade encryption</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">⚡</span>
                                <span>Lightning-fast verification</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🔒</span>
                                <span>Privacy-first approach</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-header">
                            <h2>Create Account</h2>
                            <p>Register with your face for secure access</p>
                        </div>

                        {/* Progress Steps */}
                        <div className="registration-steps">
                            <div className={`reg-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <div className="step-number">{step > 1 ? '✓' : '1'}</div>
                                <span>Details</span>
                            </div>
                            <div className="step-line"></div>
                            <div className={`reg-step ${step >= 2 ? 'active' : ''}`}>
                                <div className="step-number">2</div>
                                <span>Face Scan</span>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`auth-message ${message.type}`}>
                                <span className="message-icon">
                                    {message.type === 'success' && '✓'}
                                    {message.type === 'error' && '✕'}
                                    {message.type === 'info' && 'ℹ'}
                                </span>
                                {message.text}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleFormSubmit} className="auth-form">
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon">👤</span>
                                        <input
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Email Address</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon">✉️</span>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="auth-btn primary">
                                    Continue to Face Scan
                                    <span className="btn-arrow">→</span>
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="face-capture-section">
                                <WebcamCapture
                                    ref={webcamRef}
                                    onCapture={handleCapture}
                                    status={`${capturedImages.length}/${MAX_IMAGES} captured`}
                                />

                                <div className="capture-progress">
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(capturedImages.length / MAX_IMAGES) * 100}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">
                                        {capturedImages.length < MIN_IMAGES
                                            ? `Need ${MIN_IMAGES - capturedImages.length} more`
                                            : 'Ready to register!'}
                                    </span>
                                </div>

                                {capturedImages.length > 0 && (
                                    <div className="captured-grid">
                                        {capturedImages.map((img, index) => (
                                            <div key={index} className="captured-thumb">
                                                <img src={img} alt={`Capture ${index + 1}`} />
                                                <button
                                                    className="thumb-remove"
                                                    onClick={() => removeImage(index)}
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="capture-actions">
                                    <button
                                        className="auth-btn secondary"
                                        onClick={() => setStep(1)}
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        className="auth-btn primary"
                                        onClick={() => webcamRef.current?.capture()}
                                        disabled={capturedImages.length >= MAX_IMAGES}
                                    >
                                        📷 Capture ({capturedImages.length}/{MAX_IMAGES})
                                    </button>
                                    <button
                                        className="auth-btn success"
                                        onClick={handleRegister}
                                        disabled={capturedImages.length < MIN_IMAGES || isLoading}
                                    >
                                        {isLoading ? <span className="spinner-small" /> : 'Register ✓'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="auth-footer">
                            <p>Already have an account? <Link to="/">Sign in here</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register
