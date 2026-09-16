/**
 * ============================================================================
 * AUTHENTICATION CONTEXT (Global State)
 * ============================================================================
 * Manages the global authentication state for the React frontend.
 * It provides the current logged-in user details and functions for login, 
 * registration, and logout to any component in the app without prop drilling.
 */

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';

// Create the context that components will use (e.g., useContext(AuthContext))
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // State to hold the authenticated user's data (null if not logged in)
    const [user, setUser] = useState(null);
    // State to handle the initial loading phase while checking sessionStorage
    const [loading, setLoading] = useState(true);

    // Runs once when the application starts
    // Checks if the user is already logged in by looking at sessionStorage
    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    /**
     * Login Function
     * Sends credentials to the backend, stores the token/user data in 
     * sessionStorage on success, and updates the global state.
     */
    const login = useCallback(async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        sessionStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
        return res.data;
    }, []);

    /**
     * Register Function
     * Sends new user details to the backend, stores the returned token/user
     * data in sessionStorage, and updates the global state.
     */
    const register = useCallback(async (userData) => {
        const res = await api.post('/auth/register', userData);
        sessionStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
        return res.data;
    }, []);

    /**
     * Logout Function
     * Clears the user from sessionStorage and resets the global state.
     */
    const logout = useCallback(() => {
        sessionStorage.removeItem('user');
        setUser(null);
    }, []);

    // Memoize the context value to prevent unnecessary re-renders in child components
    const value = useMemo(() => ({
        user,
        setUser,
        loading,
        login,
        register,
        logout
    }), [user, setUser, loading, login, register, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
