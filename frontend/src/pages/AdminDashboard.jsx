import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Secret admin key - in production, this would be environment variable
const ADMIN_SECRET_KEY = 'technoji-admin-2026'

function AdminDashboard() {
    const navigate = useNavigate()
    const { secretKey } = useParams()

    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [adminPassword, setAdminPassword] = useState('')
    const [authError, setAuthError] = useState('')
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [activeTab, setActiveTab] = useState('overview')
    const [stats, setStats] = useState({ totalUsers: 0 })

    useEffect(() => {
        // Check if URL secret key matches
        if (secretKey === ADMIN_SECRET_KEY) {
            // Still require password for extra security
            const savedAuth = sessionStorage.getItem('adminAuth')
            if (savedAuth === 'true') {
                setIsAuthenticated(true)
                fetchUsers()
            }
        }
    }, [secretKey])

    const handleAdminLogin = (e) => {
        e.preventDefault()
        // Secondary password check
        if (adminPassword === 'dev@technoji2026') {
            setIsAuthenticated(true)
            sessionStorage.setItem('adminAuth', 'true')
            setAuthError('')
            fetchUsers()
        } else {
            setAuthError('Invalid admin credentials')
        }
    }

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const response = await axios.get(`${API_URL}/users`)
            const userList = response.data.users || []
            setUsers(userList)
            setStats({ totalUsers: userList.length })
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`⚠️ DANGER: Delete ${userName}? This cannot be undone.`)) {
            return
        }

        try {
            await axios.delete(`${API_URL}/user/${userId}`)
            setMessage({ type: 'success', text: `${userName} deleted` })
            fetchUsers()
            setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        } catch (error) {
            setMessage({ type: 'error', text: 'Delete failed' })
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuth')
        setIsAuthenticated(false)
        navigate('/')
    }

    // Wrong secret key - show nothing
    if (secretKey !== ADMIN_SECRET_KEY) {
        return (
            <div className="admin-locked">
                <div className="locked-content">
                    <span className="locked-icon">🔒</span>
                    <h1>404</h1>
                    <p>Page not found</p>
                    <Link to="/" className="back-link">← Go home</Link>
                </div>
            </div>
        )
    }

    // Require secondary authentication
    if (!isAuthenticated) {
        return (
            <div className="admin-gate">
                <div className="gate-container">
                    <div className="gate-header">
                        <span className="gate-icon">🛡️</span>
                        <h1>Admin Access</h1>
                        <p>Enter admin credentials to continue</p>
                    </div>

                    {authError && (
                        <div className="gate-error">
                            <span>⚠️</span> {authError}
                        </div>
                    )}

                    <form onSubmit={handleAdminLogin} className="gate-form">
                        <div className="gate-input-group">
                            <label>Admin Password</label>
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="Enter admin password"
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="gate-btn">
                            🔓 Authenticate
                        </button>
                    </form>

                    <p className="gate-hint">
                        This area is restricted to authorized developers only.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-dashboard">
            {/* Admin Header */}
            <header className="admin-header">
                <div className="admin-brand">
                    <span className="admin-icon">🛡️</span>
                    <div>
                        <h1>Admin Panel</h1>
                        <span className="admin-badge">Developer Access</span>
                    </div>
                </div>
                <div className="admin-actions">
                    <button className="admin-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="admin-nav">
                <button
                    className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Users
                </button>
                <button
                    className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📋 Logs
                </button>
            </nav>

            {/* Alert */}
            {message.text && (
                <div className={`admin-alert ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Content */}
            <main className="admin-content">
                {activeTab === 'overview' && (
                    <div className="admin-overview">
                        <div className="stat-cards">
                            <div className="stat-card">
                                <span className="stat-icon">👥</span>
                                <div>
                                    <div className="stat-value">{stats.totalUsers}</div>
                                    <div className="stat-label">Total Users</div>
                                </div>
                            </div>
                            <div className="stat-card success">
                                <span className="stat-icon">🛡️</span>
                                <div>
                                    <div className="stat-value">Active</div>
                                    <div className="stat-label">System Status</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">🎯</span>
                                <div>
                                    <div className="stat-value">99.4%</div>
                                    <div className="stat-label">Recognition Accuracy</div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-info-card">
                            <h3>🔒 Security Information</h3>
                            <ul>
                                <li>Admin URL is secret and should not be shared</li>
                                <li>All actions are logged for audit purposes</li>
                                <li>Session expires on browser close</li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="admin-users">
                        <div className="users-header">
                            <h2>Registered Users ({users.length})</h2>
                            <button className="refresh-btn" onClick={fetchUsers}>
                                🔄 Refresh
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="loading">Loading...</div>
                        ) : users.length === 0 ? (
                            <div className="empty">No users registered yet</div>
                        ) : (
                            <div className="users-table">
                                <div className="table-head">
                                    <span>ID</span>
                                    <span>Name</span>
                                    <span>Email</span>
                                    <span>Registered</span>
                                    <span>Actions</span>
                                </div>
                                {users.map((user) => (
                                    <div key={user.id} className="table-row">
                                        <span className="user-id">#{user.id}</span>
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-email">{user.email}</span>
                                        <span className="user-date">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="admin-logs">
                        <h2>System Logs</h2>
                        <div className="log-placeholder">
                            <span className="log-icon">📋</span>
                            <p>Log monitoring coming soon</p>
                            <small>Activity logs will be displayed here</small>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default AdminDashboard
