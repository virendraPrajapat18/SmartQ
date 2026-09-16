import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';
import './Profile.css';

const Profile = () => {
    const { user, setUser, logout } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(user || {});
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: ''
    });
    const [saving, setSaving] = useState(false);
    const { language } = useLanguage();
    const t = translations[language] || translations.en;
    const navigate = useNavigate();

    // Fetch fresh profile from backend on mount to get latest fields (e.g. phone)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                const freshUser = { ...user, ...res.data };
                setProfileData(freshUser);
                setUser(freshUser);
                sessionStorage.setItem('user', JSON.stringify({ ...freshUser, token: user?.token }));
                // Sync editable fields too
                setFormData(prev => ({
                    ...prev,
                    name: res.data.name || prev.name,
                    email: res.data.email || prev.email,
                }));
            } catch (err) {
                // If fetch fails, fall back to cached user data silently
            }
        };
        fetchProfile();
    }, []); // eslint-disable-line

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/auth/profile', formData);
            // Update user in context, local state, and sessionStorage
            const updatedUser = { ...profileData, name: res.data.name, email: res.data.email, phone: res.data.phone };
            setProfileData(updatedUser);
            setUser(updatedUser);
            sessionStorage.setItem('user', JSON.stringify({ ...updatedUser, token: user?.token }));
            // Clear password fields after success
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            alert('Profile updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-container">
            <Navbar activePage="profile" />

            <main className="profile-content container">
                <div className="profile-header-banner">
                    <div className="profile-avatar-large">
                        {profileData?.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="profile-header-info" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>{t.prof_title}</h2>
                            <p>{t.prof_desc}</p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="btn-logout-profile"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                border: '1px solid rgba(255, 255, 255, 0.2)', 
                                color: 'white', 
                                padding: '10px 20px', 
                                borderRadius: '10px', 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                backdropFilter: 'blur(5px)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {t.nav_logout}
                        </button>
                    </div>
                </div>

                <div className="profile-grid">
                    <form onSubmit={handleUpdate}>
                        <div className="profile-card">
                            <h3 className="section-title">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                {t.prof_personal}
                            </h3>

                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label>{t.prof_name}</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        className="profile-input" 
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t.prof_email}</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className="profile-input" 
                                        placeholder="Email Address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number (Read Only)</label>
                                    <input 
                                        type="tel" 
                                        value={profileData?.phone || ''} 
                                        className="profile-input" 
                                        disabled 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="profile-card" style={{ marginTop: '24px' }}>
                            <h3 className="section-title">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                {t.prof_sec}
                            </h3>

                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input 
                                        type="password" 
                                        name="currentPassword" 
                                        value={formData.currentPassword} 
                                        onChange={handleChange} 
                                        className="profile-input" 
                                        placeholder="Enter current password" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t.prof_new_pass}</label>
                                    <input 
                                        type="password" 
                                        name="newPassword" 
                                        value={formData.newPassword} 
                                        onChange={handleChange} 
                                        className="profile-input" 
                                        placeholder="••••••••" 
                                    />
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button type="submit" className="btn-save-profile" disabled={saving}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                    {saving ? 'Saving...' : t.prof_save}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );

};

export default Profile;
