import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';
import Toast from '../../components/Toast';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'customer'
    });
    const [toast, setToast] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useContext(AuthContext);
    const { language } = useLanguage();
    const t = translations[language] || translations.en;
    const navigate = useNavigate();

    React.useEffect(() => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            password: '',
            role: 'customer'
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/dashboard');
        } catch (error) {
            setToast({ message: t.auth_reg_fail, type: 'error' });
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
                    <h2>{t.auth_reg}</h2>
                    <p>{t.auth_reg_desc}</p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="form-group">
                        <label>{t.auth_name}</label>
                        <div className="input-wrapper">
                            <input
                                name="name"
                                type="text"
                                className="auth-input"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t.auth_name_ph}
                                autoComplete="name"
                                required
                            />
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t.auth_nic}</label>
                        <div className="input-wrapper">
                            <input
                                name="phone"
                                type="tel"
                                className="auth-input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={t.auth_nic_ph}
                                autoComplete="tel"
                                required
                            />
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.95 3.55 2 2 0 0 1 3.93 1.37h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t.auth_email}</label>
                        <div className="input-wrapper">
                            <input
                                name="email"
                                type="email"
                                className="auth-input"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="auth-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
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
                        {t.auth_create}
                    </button>
                </form>

                <div className="auth-footer">
                    {t.auth_has_acc} <Link to="/login">{t.auth_login}</Link>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Register;
