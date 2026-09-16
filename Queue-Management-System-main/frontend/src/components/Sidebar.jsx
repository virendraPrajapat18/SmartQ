/**
 * ============================================================================
 * ADMIN SIDEBAR COMPONENT
 * ============================================================================
 * The primary navigation menu for the Super Admin and Admin dashboard layouts.
 * Includes a polling mechanism to fetch unread feedback counts and displays 
 * a notification badge dynamically. Memoized to prevent unnecessary re-renders.
 */

import React, { useState, useEffect, useContext, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, LogOut, Menu, X } from 'lucide-react';
import api from '../utils/api';

const Sidebar = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleLogout = () => {
        setIsDrawerOpen(false);
        logout();
        navigate('/login');
    };

    const handleNav = (path) => {
        setIsDrawerOpen(false);
        navigate(path);
    };

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/admin/feedbacks/unread-count');
                if (res.data && typeof res.data.count === 'number') {
                    setUnreadCount(res.data.count);
                }
            } catch (err) {
                console.error('Failed to fetch unread feedback count', err);
            }
        };

        fetchUnreadCount();

        // Poll every 30 seconds for new feedbacks
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    // Close drawer when route changes or ESC is pressed
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    return (
        <>
            {/* Mobile Top Navigation Bar (< 1024px) */}
            <div className="admin-mobile-header">
                <button 
                    className="admin-mobile-menu-btn" 
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open Admin Menu"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className="admin-mobile-logo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>Admin Central</span>
                </div>
                {unreadCount > 0 && (
                    <span className="nav-badge" onClick={() => handleNav('/admin/feedbacks')} style={{ cursor: 'pointer' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>

            {/* Mobile Backdrop Overlay */}
            {isDrawerOpen && (
                <div className="admin-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
            )}

            {/* Sidebar Drawer */}
            <aside className={`admin-sidebar ${isDrawerOpen ? 'drawer-open' : ''}`}>
                <div className="admin-logo">
                    <div className="logo-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span>Admin Central</span>
                    </div>
                    <button 
                        className="admin-drawer-close-btn" 
                        onClick={() => setIsDrawerOpen(false)}
                        aria-label="Close Admin Menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="admin-nav">
                    <div className="nav-group">Main Console</div>
                    <div className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => handleNav('/admin')}>
                        <span>Dashboard</span>
                    </div>
                    <div className={`nav-item ${location.pathname === '/admin/control' ? 'active' : ''}`} onClick={() => handleNav('/admin/control')}>
                        <span>Queue Control</span>
                    </div>
                    <div className={`nav-item ${location.pathname === '/admin/counters' ? 'active' : ''}`} onClick={() => handleNav('/admin/counters')}>
                        <span>Counters</span>
                    </div>

                    <div className="nav-group">Management</div>
                    <div className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`} onClick={() => handleNav('/admin/users')}>
                        <span>Users</span>
                    </div>
                    <div className={`nav-item ${location.pathname === '/admin/services' ? 'active' : ''}`} onClick={() => handleNav('/admin/services')}>
                        <span>Services</span>
                    </div>
                    <div className={`nav-item ${location.pathname === '/admin/reports' ? 'active' : ''}`} onClick={() => handleNav('/admin/reports')}>
                        <span>Reports</span>
                    </div>
                    <div className={`nav-item ${location.pathname === '/admin/feedbacks' ? 'active' : ''}`} onClick={() => handleNav('/admin/feedbacks')}>
                        <span>Feedbacks</span>
                        {unreadCount > 0 && (
                            <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </div>
                </nav>

                <div className="admin-user-bottom">
                    <div className="admin-user-profile">
                        <div className="admin-avatar">
                            <User size={20} color="#ffffff" strokeWidth={2.2} />
                        </div>
                        <div className="user-info">
                            <strong>{user?.name || 'Super Admin'}</strong>
                            <span>{user?.role === 'super_admin' ? 'Super Admin' : (user?.role === 'admin' ? 'Admin' : 'System Staff')}</span>
                        </div>
                    </div>
                    <button 
                        className="admin-logout-btn" 
                        onClick={handleLogout} 
                        title="Logout from Admin Panel" 
                        aria-label="Logout"
                    >
                        <LogOut size={16} color="#ffffff" strokeWidth={2.5} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
});

export default Sidebar;
