/**
 * ============================================================================
 * LANDING PAGE — SmartQ Digital Queue Management System
 * ============================================================================
 * Public-facing homepage. No domain-specific content.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            {/* ── HEADER ── */}
            <header className="header" style={{ width: '100%' }}>
                <div className="container" style={{ width: '100%' }}>
                    <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                            <div className="logo-icon">
                                {/* Queue / flow icon */}
                                <svg className="icon-q" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="3" />
                                    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                                    <line x1="6" y1="11" x2="18" y2="11" />
                                    <line x1="6" y1="15" x2="14" y2="15" />
                                </svg>
                            </div>
                            <div className="logo-text">
                                <h2>SmartQ</h2>
                                <span>Digital Queue Management</span>
                            </div>
                        </div>
                        <div className="header-right">
                            <nav className="landing-nav">
                                <span onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Sign In</span>
                                <span onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}>Register</span>
                            </nav>
                            <button onClick={() => navigate('/login')} className="btn-outline" style={{ cursor: 'pointer', marginLeft: '12px' }}>
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── HERO ── */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <span className="tagline">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                Smart Queue Platform
                            </span>
                            <h1>Skip the waiting line,<br />not the service.</h1>
                            <p>SmartQ helps service-based organizations manage digital queues, counters, and customer flow in real time — for clinics, banks, salons, government offices, and more.</p>
                            <div className="hero-btns">
                                <button onClick={() => navigate('/login')} className="btn-primary" style={{ cursor: 'pointer' }}>Join a Queue</button>
                                <button onClick={() => navigate('/login')} className="btn-outline" style={{ cursor: 'pointer' }}>Track My Ticket</button>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="hero-visual">
                                {/* Animated queue illustration */}
                                <div className="queue-visual">
                                    <div className="qv-header">
                                        <div className="qv-dot green"></div>
                                        <span>Live Queue Dashboard</span>
                                    </div>
                                    <div className="qv-counter">
                                        <div className="qv-now">
                                            <span>Now Serving</span>
                                            <h2>SQ-047</h2>
                                            <span className="qv-service">Billing & Payments</span>
                                        </div>
                                        <div className="qv-stats">
                                            <div className="qv-stat">
                                                <span>In Queue</span>
                                                <strong>12</strong>
                                            </div>
                                            <div className="qv-stat">
                                                <span>Avg Wait</span>
                                                <strong>~8 min</strong>
                                            </div>
                                            <div className="qv-stat">
                                                <span>Counters</span>
                                                <strong>3 Active</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="qv-tickets">
                                        {[
                                            { id: 'SQ-048', svc: 'Customer Support', status: 'calling' },
                                            { id: 'SQ-049', svc: 'Registration', status: 'waiting' },
                                            { id: 'SQ-050', svc: 'General Inquiry', status: 'waiting' },
                                        ].map(t => (
                                            <div key={t.id} className={`qv-ticket-row ${t.status}`}>
                                                <span className="qv-tid">{t.id}</span>
                                                <span className="qv-tsvc">{t.svc}</span>
                                                <span className={`qv-tbadge ${t.status}`}>{t.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="wait-time-card">
                                <div className="wt-icon">
                                    <svg className="icon-bolt" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <div className="wt-info">
                                    <span>Average Wait Time</span>
                                    <h3>~12 Minutes</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── USE CASES STRIP ── */}
            <section className="use-cases-strip">
                <div className="container">
                    <p className="use-cases-label">Configurable for any service organization</p>
                    <div className="use-cases-list">
                        {['🏥 Clinics & Hospitals', '🏦 Banks', '💈 Salons & Spas', '🏛️ Government Offices', '🔧 Service Centers', '🏫 Educational Institutions'].map(uc => (
                            <span key={uc} className="use-case-pill">{uc}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="features">
                <div className="container">
                    <h2>Efficiency at Your Fingertips</h2>
                    <p className="features-intro">Follow three simple steps to get your digital ticket and reduce your waiting time at any service counter.</p>
                    <div className="features-grid">
                        <div className="feature-card">
                            <span className="f-num">01</span>
                            <div className="f-icon">
                                <svg className="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                            </div>
                            <h3>1. Create Account</h3>
                            <p>Sign up with your name and email. No paperwork — just a secure digital account ready in seconds.</p>
                        </div>
                        <div className="feature-card">
                            <span className="f-num">02</span>
                            <div className="f-icon">
                                <svg className="icon-ticket" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="6" y1="5" x2="6" y2="19" />
                                    <line x1="18" y1="5" x2="18" y2="19" />
                                </svg>
                            </div>
                            <h3>2. Get Digital Ticket</h3>
                            <p>Choose the service you need and receive a digital ticket with your queue position and estimated wait time.</p>
                        </div>
                        <div className="feature-card">
                            <span className="f-num">03</span>
                            <div className="f-icon">
                                <svg className="icon-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <h3>3. Track Your Turn</h3>
                            <p>Monitor live queue progress from anywhere. Get notified when your number is called and head to the counter.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS (flow) ── */}
            <section className="flow-section">
                <div className="container">
                    <h2>How the Queue Flow Works</h2>
                    <p className="features-intro">From joining to completion — fully digital, fully real-time.</p>
                    <div className="flow-steps">
                        {[
                            { icon: '📋', label: 'Select Service' },
                            { icon: '🎫', label: 'Get Digital Ticket' },
                            { icon: '📍', label: 'Track Queue Position' },
                            { icon: '🔔', label: 'Get Called' },
                            { icon: '🏷️', label: 'Visit Counter' },
                            { icon: '✅', label: 'Service Complete' },
                        ].map((step, i) => (
                            <React.Fragment key={step.label}>
                                <div className="flow-step">
                                    <div className="flow-icon">{step.icon}</div>
                                    <span>{step.label}</span>
                                </div>
                                {i < 5 && <div className="flow-arrow">→</div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <svg className="f-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="3" />
                                    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                                    <line x1="6" y1="11" x2="18" y2="11" />
                                    <line x1="6" y1="15" x2="14" y2="15" />
                                </svg>
                                <h4>SmartQ</h4>
                            </div>
                            <p>A configurable digital queue management system for any service-based organization. Reduce waiting times and improve customer flow — in real time.</p>
                        </div>
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <ul>
                                <li><a href="#">Features</a></li>
                                <li><a href="#">How It Works</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Get Started</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Use Cases</h4>
                            <ul>
                                <li><a href="#">Healthcare</a></li>
                                <li><a href="#">Banking</a></li>
                                <li><a href="#">Government</a></li>
                                <li><a href="#">Retail & Salons</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 SmartQ — Digital Queue Management System. All Rights Reserved.</p>
                        <div className="footer-links">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                            <a href="#">Accessibility</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
