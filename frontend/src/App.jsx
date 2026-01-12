import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import AdminDashboard from './pages/AdminDashboard'

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* User Welcome Page (after login) */}
                <Route path="/welcome" element={<Welcome />} />

                {/* Secret Admin Route - requires key in URL */}
                <Route path="/admin/:secretKey" element={<AdminDashboard />} />

                {/* Catch-all - redirect to login */}
                <Route path="*" element={<Login />} />
            </Routes>
        </Router>
    )
}

export default App
