/**
 * ============================================================================
 * NAVBAR COMPONENT
 * ============================================================================
 * The global navigation bar for the customer-facing side of the application.
 * Adapts its links based on user authentication status. Also displays the
 * real-time notification badge if unread notifications exist.
 */

import React, { useContext, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { Menu, X } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import './Navbar.css';

const Navbar = memo(({ activePage }) => {
    const { user, logout } = useContext(AuthContext);
    const { unreadCount } = useContext(NotificationContext);
    const { language } = useLanguage();
    const t = translations[language] || translations.en;
    const navigate = useNavigate();
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        logout();
        navigate('/login');
    };

    const handleNav = (path) => {
        setIsMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <header className="jq-header">
            <div className="container">
                <div className="jq-header-inner">
                    <div className="jq-logo-section" onClick={() => handleNav(user ? '/dashboard' : '/')} style={{ cursor: 'pointer' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="3" />
                            <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                            <line x1="6" y1="11" x2="18" y2="11" />
                            <line x1="6" y1="15" x2="14" y2="15" />
                        </svg>
                        <div className="jq-logo-text">
                            <h3>{t.nav_dept}</h3>
                            <span>{t.nav_gov}</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    {user ? (
                        <>
                            <nav className="jq-nav jq-nav-desktop">
                                <span onClick={() => handleNav('/dashboard')} className={activePage === 'dashboard' ? 'active' : ''}>{t.nav_dash}</span>
                                <span onClick={() => handleNav('/join')} className={activePage === 'join' ? 'active' : ''}>{t.nav_join}</span>
                                <span onClick={() => handleNav('/history')} className={activePage === 'history' ? 'active' : ''}>{t.nav_hist}</span>
                            </nav>
                            <div className="jq-header-actions">
                                <div className="jq-icon-btn" onClick={(e) => { e.stopPropagation(); setIsNotifOpen(true); }} style={{ cursor: 'pointer', position: 'relative' }} title="Notifications" aria-label="Notifications">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">{unreadCount}</span>
                                    )}
                                </div>
                                <div className="jq-icon-btn" onClick={() => handleNav('/profile')} style={{ cursor: 'pointer' }} title="Profile" aria-label="Profile">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="7" r="4" />
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    </svg>
                                </div>
                                <button 
                                    className="jq-hamburger-btn" 
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                    aria-label="Toggle Navigation Menu"
                                >
                                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <nav className="jq-nav jq-nav-desktop">
                                <span onClick={() => handleNav('/')} className={activePage === 'home' ? 'active' : ''}>{t.nav_home}</span>
                                <span onClick={() => handleNav('/login')} className={activePage === 'login' ? 'active' : ''}>{t.nav_login}</span>
                                <span onClick={() => handleNav('/register')} className={activePage === 'register' ? 'active' : ''}>{t.nav_reg}</span>
                            </nav>
                            <div className="jq-header-actions">
                                <button className="btn-dash-light btn-member-login" onClick={() => handleNav('/login')}>{t.nav_mem}</button>
                                <button 
                                    className="jq-hamburger-btn" 
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                    aria-label="Toggle Navigation Menu"
                                >
                                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Drawer Navigation */}
                {isMobileMenuOpen && (
                    <div className="jq-mobile-drawer">
                        <div className="jq-mobile-nav-list">
                            {user ? (
                                <>
                                    <div className={`jq-mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => handleNav('/dashboard')}>
                                        {t.nav_dash}
                                    </div>
                                    <div className={`jq-mobile-nav-item ${activePage === 'join' ? 'active' : ''}`} onClick={() => handleNav('/join')}>
                                        {t.nav_join}
                                    </div>
                                    <div className={`jq-mobile-nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => handleNav('/history')}>
                                        {t.nav_hist}
                                    </div>
                                    <div className={`jq-mobile-nav-item ${activePage === 'profile' ? 'active' : ''}`} onClick={() => handleNav('/profile')}>
                                        Profile Details
                                    </div>
                                    <div className="jq-mobile-nav-item jq-mobile-logout" onClick={handleLogout}>
                                        Logout
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`jq-mobile-nav-item ${activePage === 'home' ? 'active' : ''}`} onClick={() => handleNav('/')}>
                                        {t.nav_home}
                                    </div>
                                    <div className={`jq-mobile-nav-item ${activePage === 'login' ? 'active' : ''}`} onClick={() => handleNav('/login')}>
                                        {t.nav_login}
                                    </div>
                                    <div className={`jq-mobile-nav-item ${activePage === 'register' ? 'active' : ''}`} onClick={() => handleNav('/register')}>
                                        {t.nav_reg}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {isNotifOpen && <NotificationPanel onClose={() => setIsNotifOpen(false)} />}
        </header>
    );
});

export default Navbar;
