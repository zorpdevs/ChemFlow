import React, { useState, useEffect } from 'react';
import { FlaskConical, Eye, EyeOff, Loader2, User, Mail, Lock, Chrome, LayoutDashboard, UserCircle } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import Upload from './components/Upload';
import SummaryCards from './components/SummaryCards';
import Charts from './components/Charts';
import DataTable from './components/DataTable';
import Profile from './components/Profile';
import { getSummary, setAuthToken, generatePDF } from './services/api';
import './App.css';
import logo from './assets/logo.svg';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Failed to get ID token", e);
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      } else {
        setAuthToken(null);
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        console.error(err);
        setError("Invalid email or password.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(userCredential.user, {
            displayName: fullName
          });
        }
        setSuccessMsg('Registration successful!');
    } catch (err) {
        console.error(err);
        let msg = err.message;
        if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Please sign in instead.';
        if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
        setError(msg);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google Login Error:", err);
      let errorMessage = "Google sign in failed.";
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in cancelled by user.";
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = "Sign-in popup blocked. Please allow popups for this site.";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = "Google Sign-In is not enabled in Firebase Console.";
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = "Domain not authorized. Add this domain in Firebase Console.";
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
      } else if (err.message) {
        errorMessage = `Google sign in failed: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error(err);
      let msg = "Failed to send reset email.";
      if (err.code === 'auth/user-not-found') msg = "No user found with this email.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError('Invalid credentials or session expired. Please login again.');
          setIsAuthenticated(false);
      } else if (err.response && err.response.status === 404) {
          setSummary(null);
      } else {
          setError('Failed to fetch data. Server might be down or file not uploaded yet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await generatePDF();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'equipment_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF generation failed', err);
      alert('Failed to generate PDF');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          {showForgotPassword ? (
            <>
              <div className="login-header">
                <div className="icon-wrapper">
                  <FlaskConical size={40} className="brand-icon" />
                </div>
                <h2 className="form-title">Reset Password</h2>
                <p className="form-subtitle">Enter your email to receive a reset link</p>
              </div>
              
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Email"
                        required 
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary full-width btn-animated" disabled={loading}>
                    {loading ? (
                      <span className="loading-content">
                        <Loader2 className="spinner" size={18} /> Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                </button>
                
                <div className="text-center footer-links" style={{marginTop: '20px'}}>
                    <button 
                      type="button"
                      className="btn-link" 
                      onClick={() => {
                          setShowForgotPassword(false);
                          setError('');
                          setSuccessMsg('');
                      }}
                    >
                       Back to Sign In
                    </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="login-header">
                <div className="icon-wrapper">
                  <FlaskConical size={40} className="brand-icon" />
                </div>
                {isLoginMode ? (
                    <>
                        <h2 className="form-title">Welcome back</h2>
                        <p className="form-subtitle">Sign in to your account</p>
                    </>
                ) : (
                    <>
                        <h2 className="form-title">Create account</h2>
                        <p className="form-subtitle">Start analyzing chemical data for free</p>
                    </>
                )}
              </div>
              
              <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
                {!isLoginMode && (
                    <div className="form-group">
                      <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <input 
                            type="text" 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                            placeholder="Full name"
                            required 
                        />
                      </div>
                    </div>
                )}
    
                <div className="form-group">
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Email"
                        required 
                    />
                  </div>
                </div>
    
                <div className="form-group">
                  <div className="password-wrapper input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Password"
                      required 
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {isLoginMode && (
                    <div className="forgot-password-link" style={{textAlign: 'right', marginBottom: '15px'}}>
                        <button 
                          type="button"
                          className="btn-link" 
                          style={{fontSize: '0.85rem'}}
                          onClick={() => {
                              setShowForgotPassword(true);
                              setError('');
                              setSuccessMsg('');
                          }}
                        >
                          Forgot Password?
                        </button>
                    </div>
                )}
                
                <button type="submit" className="btn-primary full-width btn-animated" disabled={loading}>
                    {loading ? (
                      <span className="loading-content">
                        <Loader2 className="spinner" size={18} /> Processing...
                      </span>
                    ) : (
                      isLoginMode ? 'Sign In' : 'Create Account'
                    )}
                </button>
                
                <div className="or-divider">OR</div>
    
                <button type="button" onClick={handleGoogleLogin} className="btn-google">
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google G" 
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <span style={{ flexGrow: 1, textAlign: 'center' }}>Sign in with Google</span>
                </button>
              </form>
              
              <div className="text-center footer-links">
                  {isLoginMode ? (
                      <span className="footer-text">
                          Don't have an account? 
                          <button 
                            className="btn-link" 
                            onClick={() => {
                                setIsLoginMode(false);
                                setError('');
                                setSuccessMsg('');
                            }}
                          >
                             Sign up
                          </button>
                      </span>
                  ) : (
                      <span className="footer-text">
                          Already have an account? 
                          <button 
                            className="btn-link" 
                            onClick={() => {
                                setIsLoginMode(true);
                                setError('');
                                setSuccessMsg('');
                            }}
                          >
                             Sign in
                          </button>
                      </span>
                  )}
              </div>
            </>
          )}

          {error && (
            <div className="message-banner error-banner">
              <p>{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="message-banner success-banner">
              <p>{successMsg}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container" onClick={() => setCurrentView('dashboard')} style={{cursor: 'pointer'}}>
            <img src={logo} className="app-logo" alt="logo" />
            <h1 className="app-title">ChemFlow</h1>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           <nav style={{ display: 'flex', gap: '5px' }}>
             <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`btn-secondary ${currentView === 'dashboard' ? 'active' : ''}`}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    borderColor: currentView === 'dashboard' ? 'var(--primary-color)' : 'transparent',
                    color: currentView === 'dashboard' ? 'white' : 'var(--text-muted)'
                }}
             >
                <LayoutDashboard size={16} />
                Dashboard
             </button>
             <button 
                onClick={() => setCurrentView('profile')} 
                className={`btn-secondary ${currentView === 'profile' ? 'active' : ''}`}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    borderColor: currentView === 'profile' ? 'var(--primary-color)' : 'transparent',
                    color: currentView === 'profile' ? 'white' : 'var(--text-muted)'
                }}
             >
                <UserCircle size={16} />
                Profile
             </button>
           </nav>

           <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 5px' }}></div>

           {summary && currentView === 'dashboard' && (
              <>
                <button onClick={() => setSummary(null)} className="btn-secondary" style={{ marginRight: '10px' }}>
                  Upload New File
                </button>
                <button onClick={handleDownloadPDF} className="btn-secondary">
                  Download PDF
                </button>
              </>
           )}
           <button onClick={() => signOut(auth)} className="btn-secondary">Logout</button>
        </div>
      </header>
      
      <main className="app-content">
        {currentView === 'profile' ? (
            <Profile />
        ) : (
            !summary ? (
                <Upload onUploadSuccess={(data) => setSummary(data)} />
            ) : (
                <div className="dashboard">
                    <SummaryCards summary={summary} />
                    <Charts summary={summary} />
                    <DataTable data={summary.equipment_list} />
                </div>
            )
        )}
      </main>
    </div>
  );
}

export default App;
