import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import WebcamCapture from '../components/WebcamCapture'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function Login() {
    const navigate = useNavigate()
    const webcamRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [isScanning, setIsScanning] = useState(false)
    const [authenticatedUser, setAuthenticatedUser] = useState(null)

    const scanIntervalRef = useRef(null)

    const authenticate = useCallback(async (imageSrc) => {
        if (isLoading) return

        setIsLoading(true)

        try {
            const response = await axios.post(`${API_URL}/authenticate`, {
                face_image: imageSrc
            })

            if (response.data.success) {
                setIsScanning(false)
                if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current)
                }

                localStorage.setItem('token', response.data.access_token)
                localStorage.setItem('user', JSON.stringify(response.data.user))

                setAuthenticatedUser(response.data.user)
                setMessage({
                    type: 'success',
                    text: response.data.message
                })

                setTimeout(() => {
                    navigate('/welcome')
                }, 1500)
            } else {
                setMessage({ type: 'error', text: response.data.message })
            }
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Authentication failed'
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, navigate])

    const startScanning = useCallback(() => {
        setIsScanning(true)
        setMessage({ type: 'info', text: 'Scanning... Please look at the camera' })

        scanIntervalRef.current = setInterval(() => {
            if (webcamRef.current && !isLoading) {
                const imageSrc = webcamRef.current.getScreenshot()
                if (imageSrc) {
                    authenticate(imageSrc)
                }
            }
        }, 2000)
    }, [authenticate, isLoading])

    const stopScanning = useCallback(() => {
        setIsScanning(false)
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
        }
        setMessage({ type: '', text: '' })
    }, [])

    useEffect(() => {
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current)
            }
        }
    }, [])

    const handleSingleCapture = useCallback(() => {
        if (webcamRef.current && !isLoading) {
            const imageSrc = webcamRef.current.getScreenshot()
            if (imageSrc) {
                setMessage({ type: 'info', text: 'Verifying your identity...' })
                authenticate(imageSrc)
            }
        }
    }, [authenticate, isLoading])

    return (
        <div className="auth-page login-page">
            <div className="auth-container">
                {/* Left Panel - Branding */}
                <div className="auth-branding login-branding">
                    <div className="brand-content">
                        <div className="brand-icon">🔐</div>
                        <h1>SecureAuth</h1>
                        <p>Your face is your password. Fast, secure, and effortless authentication.</p>
                        <div className="security-badge">
                            <span className="badge-icon">🛡️</span>
                            <span>256-bit AES Encryption</span>
                        </div>
                    </div>
                    <div className="brand-decoration">
                        <div className="decoration-circle c1"></div>
                        <div className="decoration-circle c2"></div>
                        <div className="decoration-circle c3"></div>
                    </div>
                </div>

                {/* Right Panel - Login */}
                <div className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-header">
                            <h2>Welcome Back</h2>
                            <p>Verify your identity to continue</p>
                        </div>

                        {message.text && (
                            <div className={`auth-message ${message.type}`}>
                                <span className="message-icon">
                                    {message.type === 'success' && '✓'}
                                    {message.type === 'error' && '✕'}
                                    {message.type === 'info' && '🔍'}
                                </span>
                                {message.text}
                            </div>
                        )}

                        {authenticatedUser ? (
                            <div className="auth-success-card">
                                <div className="success-avatar">
                                    {authenticatedUser.name.charAt(0).toUpperCase()}
                                </div>
                                <h3>Identity Verified</h3>
                                <p className="success-name">{authenticatedUser.name}</p>
                                <p className="success-email">{authenticatedUser.email}</p>
                                <div className="success-loader">
                                    <div className="loader-bar"></div>
                                </div>
                                <p className="redirect-text">Redirecting to dashboard...</p>
                            </div>
                        ) : (
                            <>
                                <div className="login-webcam-container">
                                    <WebcamCapture
                                        ref={webcamRef}
                                        showGuide={true}
                                        status={isScanning ? '🔴 Scanning...' : 'Position your face'}
                                    />
                                </div>

                                <div className="login-actions">
                                    {!isScanning ? (
                                        <>
                                            <button
                                                className="auth-btn primary full-width"
                                                onClick={handleSingleCapture}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <span className="spinner-small" />
                                                ) : (
                                                    <>📷 Verify Identity</>
                                                )}
                                            </button>
                                            <button
                                                className="auth-btn secondary full-width"
                                                onClick={startScanning}
                                                disabled={isLoading}
                                            >
                                                🔄 Enable Auto-Scan
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="auth-btn danger full-width"
                                            onClick={stopScanning}
                                        >
                                            ⏹ Stop Scanning
                                        </button>
                                    )}
                                </div>

                                <div className="login-help">
                                    <p>Having trouble?</p>
                                    <ul>
                                        <li>Ensure good lighting on your face</li>
                                        <li>Remove glasses or obstructions</li>
                                        <li>Look directly at the camera</li>
                                    </ul>
                                </div>
                            </>
                        )}

                        <div className="auth-footer">
                            <p>Don't have an account? <Link to="/register">Register here</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
