import React, { useState, useEffect } from 'react';
import { updatePassword, updateProfile, linkWithPopup, unlink, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { User, Mail, Lock, Eye, EyeOff, Loader2, Save, Link as LinkIcon, Unlink, Chrome, AlertCircle } from 'lucide-react';

function Profile() {
  const [user, setUser] = useState(auth.currentUser);
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    setUser(auth.currentUser);
    setFullName(auth.currentUser?.displayName || '');
    // Check if user is linked with Google
    if (auth.currentUser) {
        const isLinked = auth.currentUser.providerData.some(
            (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
        );
        setGoogleLinked(isLinked);
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (fullName !== user.displayName) {
        await updateProfile(user, { displayName: fullName });
      }

      if (newPassword) {
         // Enforce strict password policy
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
          throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
        }
        if (newPassword !== confirmPassword) {
            throw new Error("Passwords do not match.");
        }
        await updatePassword(user, newPassword);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Profile update error:", error);
      let msg = error.message;
      if (error.code === 'auth/requires-recent-login') {
        msg = 'For security, please logout and login again to change your password.';
      }
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
        const provider = new GoogleAuthProvider();
        await linkWithPopup(auth.currentUser, provider);
        setGoogleLinked(true);
        setMessage({ type: 'success', text: 'Google account linked successfully!' });
    } catch (error) {
        console.error("Link Error:", error);
        let msg = error.message;
        if (error.code === 'auth/credential-already-in-use') {
            msg = 'This Google account is already used by another user.';
        }
        setMessage({ type: 'error', text: msg });
    } finally {
        setLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    // Prevent unlinking if it's the only provider and no password set (would lock user out)
    // But typically users have email/password or google. 
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
        await unlink(auth.currentUser, GoogleAuthProvider.PROVIDER_ID);
        setGoogleLinked(false);
        setMessage({ type: 'success', text: 'Google account disconnected.' });
    } catch (error) {
        console.error("Unlink Error:", error);
        setMessage({ type: 'error', text: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="card profile-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
         {user?.photoURL ? (
             <img 
               src={user.photoURL} 
               alt="Profile" 
               style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
             />
         ) : (
             <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
                 <User size={32} color="var(--secondary-color)" />
             </div>
         )}
         <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>My Profile</h2>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Manage your account settings</p>
         </div>
      </div>

      <form onSubmit={handleUpdateProfile}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Enter your name"
            />
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div style={{ marginTop: '30px', marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkIcon size={18} /> Connected Accounts
            </h3>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: 'var(--input-bg)', 
                padding: '12px 16px', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="Google" 
                        style={{ width: '20px', height: '20px' }} 
                    />
                    <span style={{ fontWeight: 500 }}>Google</span>
                    {googleLinked && <span style={{ fontSize: '0.8rem', background: 'rgba(35, 134, 54, 0.2)', color: '#3fb950', padding: '2px 8px', borderRadius: '10px' }}>Connected</span>}
                </div>
                
                {googleLinked ? (
                    <button 
                        type="button"
                        onClick={handleUnlinkGoogle}
                        className="btn-secondary"
                        disabled={loading}
                        style={{ fontSize: '0.9rem', color: '#ff7b72', borderColor: 'rgba(218, 54, 51, 0.3)' }}
                    >
                        Disconnect
                    </button>
                ) : (
                    <button 
                        type="button"
                        onClick={handleLinkGoogle}
                        className="btn-secondary"
                        disabled={loading}
                        style={{ fontSize: '0.9rem' }}
                    >
                        Connect
                    </button>
                )}
            </div>
        </div>

        <div style={{ marginTop: '30px', marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Change Password</h3>
            
            <div className="form-group">
            <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                type={showPassword ? "text" : "password"} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="New Password (min 8 chars, A-Z, 0-9, special)"
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

            <div className="form-group">
            <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm New Password"
                />
            </div>
            </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
            Save Changes
        </button>

        {message.text && (
            <div className={`message-banner ${message.type === 'error' ? 'error-banner' : 'success-banner'}`}>
            <p>{message.text}</p>
            </div>
        )}
      </form>
    </div>
  );
}

export default Profile;
