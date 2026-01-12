import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Welcome() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')

        if (!storedUser || !token) {
            navigate('/')
            return
        }

        setUser(JSON.parse(storedUser))
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/')
    }

    if (!user) {
        return null
    }

    return (
        <div className="welcome-page">
            <div className="welcome-container">
                <div className="welcome-card">
                    <div className="welcome-avatar">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="welcome-badge">
                        <span className="badge-icon">✓</span>
                        <span>Identity Verified</span>
                    </div>

                    <h1 className="welcome-title">
                        Welcome, <span className="welcome-name">{user.name}</span>
                    </h1>

                    <p className="welcome-email">{user.email}</p>

                    <div className="welcome-status">
                        <div className="status-item">
                            <span className="status-icon">🔒</span>
                            <span>Secure Session Active</span>
                        </div>
                        <div className="status-item">
                            <span className="status-icon">🛡️</span>
                            <span>Face Authentication Verified</span>
                        </div>
                    </div>

                    <div className="welcome-actions">
                        <button className="welcome-btn logout" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    </div>

                    <p className="welcome-footer">
                        You are securely authenticated with face recognition
                    </p>
                </div>
            </div>

            {/* Background decoration */}
            <div className="welcome-bg">
                <div className="bg-circle c1"></div>
                <div className="bg-circle c2"></div>
                <div className="bg-circle c3"></div>
            </div>
        </div>
    )
}

export default Welcome
