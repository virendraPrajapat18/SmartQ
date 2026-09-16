import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import api from '../utils/api';
import { io } from 'socket.io-client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/users/notifications');
            setNotifications(res.data);
            const unread = res.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();

            const newSocket = io(import.meta.env.VITE_SOCKET_URL || undefined);
            setSocket(newSocket);

            newSocket.emit('join_user_room', user._id);

            newSocket.on('new_notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            return () => {
                newSocket.disconnect();
            };
        } else {
            setUnreadCount(0);
            setNotifications([]);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user, fetchNotifications]);

    const markAsRead = useCallback(async (id) => {
        try {
            await api.put(`/users/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.put('/users/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    }, []);

    const deleteNotification = useCallback(async (id) => {
        try {
            await api.delete(`/users/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => {
                const wasUnread = notifications.find(n => n._id === id && !n.isRead);
                return wasUnread ? Math.max(0, prev - 1) : prev;
            });
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    }, [notifications]);

    const clearAllNotifications = useCallback(async () => {
        try {
            await api.delete('/users/notifications');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to clear notifications', err);
        }
    }, []);

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
    }), [notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
