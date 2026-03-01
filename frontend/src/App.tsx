import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener automatically detects if a user logs in or out!
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ backgroundColor: '#0a0a0a', color: '#00d2ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>Verifying Secure Session...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* If logged in, go to dashboard. Otherwise, show landing page. */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        
        {/* Protect the dashboard route so non-logged-in users can't access it */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;