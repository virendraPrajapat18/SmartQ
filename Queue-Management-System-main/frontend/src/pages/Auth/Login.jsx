import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';
import Toast from '../../components/Toast';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, user: currentUser } = useContext(AuthContext);
    const { language } = useLanguage();
    const t = translations[language] || translations.en;
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    React.useEffect(() => {
        if (currentUser) {
            if (currentUser.role === 'super_admin') {
                navigate('/admin');
            } else if (currentUser.role === 'admin') {
                navigate('/admin/counter-dashboard');
            } else {
                navigate('/dashboard');
            }
        }
        
        // Force clear fields after a tiny delay to override browser autofill
        const timer = setTimeout(() => {
            setEmail('');
            setPassword('');
        }, 100);
        
        return () => clearTimeout(timer);
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            if (user.role === 'super_admin') {
                navigate('/admin');
            } else if (user.role === 'admin') {
                navigate('/admin/counter-dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            setToast({ message: t.auth_invalid, type: 'error' });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="3" />
                            <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                            <line x1="6" y1="11" x2="18" y2="11" />
                            <line x1="6" y1="15" x2="14" y2="15" />
                        </svg>
                    </div>
                    <h2>{t.auth_welcome}</h2>
                    <p>{t.auth_login_desc}</p>
                </div>
                
                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="form-group">
                        <label>{t.auth_email}</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                name="email"
                                className="auth-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.auth_email_ph}
                                autoComplete="email"
                                required
                            />
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t.auth_pass}</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="auth-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-auth-primary">
                        {t.auth_login}
                    </button>
                </form>

                <div className="auth-footer">
                    {t.auth_no_acc} <Link to="/register">{t.auth_reg_here}</Link>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Login;
