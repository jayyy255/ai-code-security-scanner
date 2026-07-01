import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { UserProvider, useAuth } from './components/UserContext';

// ProtectedRoute helper component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content-layout">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<ProtectedRoute><AnalyzePage /></ProtectedRoute>} />
            <Route path="/results/:analysisId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
