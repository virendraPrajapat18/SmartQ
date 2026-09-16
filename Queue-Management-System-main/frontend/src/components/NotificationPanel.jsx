import React, { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = React.memo(({ onClose }) => {
    const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useContext(NotificationContext);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        
        return date.toLocaleDateString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'queue':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                );
            case 'feedback':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                );
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Clear all notifications? This cannot be undone.')) {
            await clearAllNotifications();
        }
    };

    return (
        <div className="notification-panel-overlay" onClick={onClose}>
            <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
                <div className="np-header">
                    <h3>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        Notifications
                    </h3>
                    <button className="np-close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                {notifications.length > 0 && (
                    <div className="np-actions">
                        {notifications.some(n => !n.isRead) && (
                            <button className="np-mark-read-btn" onClick={markAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                        <button className="np-clear-btn" onClick={handleClearAll}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14H6L5 6"></path>
                                <path d="M10 11v6"></path>
                                <path d="M14 11v6"></path>
                                <path d="M9 6V4h6v2"></path>
                            </svg>
                            Clear All
                        </button>
                    </div>
                )}

                <div className="np-content">
                    {notifications.length > 0 ? (
                        notifications.map(notification => (
                            <div 
                                key={notification._id} 
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => !notification.isRead && markAsRead(notification._id)}
                            >
                                <div className={`ni-icon ${notification.type}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="ni-content">
                                    <div className="ni-title">{notification.title}</div>
                                    <div className="ni-message">{notification.message}</div>
                                    <div className="ni-time">{formatTime(notification.createdAt)}</div>
                                </div>
                                {/* Per-notification delete button */}
                                <button
                                    className="ni-delete-btn"
                                    title="Delete notification"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Don't trigger markAsRead
                                        deleteNotification(notification._id);
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="np-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span>No notifications</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default NotificationPanel;
