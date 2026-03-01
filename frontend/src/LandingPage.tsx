import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Left Side: Value Proposition */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', borderRight: '1px solid #222', background: 'radial-gradient(circle at top left, #1a1a1a, #0a0a0a)' }}>
        <h1 style={{ margin: 0, background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '4rem', letterSpacing: '-2px', marginBottom: '1rem' }}>
          TARS Copilot
        </h1>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '400', color: '#ccc', marginBottom: '2rem', lineHeight: '1.4' }}>
          Zero-Latency Meeting Intelligence.<br/>
          <span style={{ color: '#4caf50', fontWeight: 'bold' }}>100% Local Privacy.</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#888' }}>
          <p>✓ NPU Hardware-Accelerated Extraction</p>
          <p>✓ Zero Cloud API Costs</p>
          <p>✓ Enterprise-Grade Security</p>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#121212', padding: '3rem', borderRadius: '16px', border: '1px solid #222', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          
          {error && <div style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(255, 68, 68, 0.3)' }}>{error}</div>}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Your Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{ padding: '16px', backgroundColor: '#080808', color: 'white', border: '1px solid #333', borderRadius: '8px', fontSize: '1rem' }} 
              />
            )}
            <input 
              type="email" 
              placeholder="Enterprise Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ padding: '16px', backgroundColor: '#080808', color: 'white', border: '1px solid #333', borderRadius: '8px', fontSize: '1rem' }} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ padding: '16px', backgroundColor: '#080808', color: 'white', border: '1px solid #333', borderRadius: '8px', fontSize: '1rem' }} 
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ marginTop: '1rem', padding: '16px', background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {loading ? 'Authenticating...' : isLogin ? 'Secure Login' : 'Initialize Workspace'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              style={{ color: '#00d2ff', cursor: 'pointer', fontWeight: 'bold' }}>
              {isLogin ? 'Sign up' : 'Log in'}
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}