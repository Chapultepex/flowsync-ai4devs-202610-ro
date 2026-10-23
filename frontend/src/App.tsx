import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/lib/auth'
import { LoginPage } from '@/pages/login-page'
import { ProfilePage } from '@/pages/profile-page'
import { SignupPage } from '@/pages/signup-page'

function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/profile" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={token ? <Navigate to="/profile" replace /> : <SignupPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={token ? '/profile' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
