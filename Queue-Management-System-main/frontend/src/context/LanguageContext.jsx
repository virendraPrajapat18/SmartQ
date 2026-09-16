/**
 * ============================================================================
 * LANGUAGE CONTEXT (Global State)
 * ============================================================================
 * Provides global state management for the application's language preference
 * (Sinhala, Tamil, English). Persists the user's choice in localStorage to 
 * ensure consistency across page reloads.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const savedLang = localStorage.getItem('app_lang');
        return savedLang || 'en';
    });

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('app_lang', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
