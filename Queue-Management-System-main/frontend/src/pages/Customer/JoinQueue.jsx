/**
 * ============================================================================
 * JOIN QUEUE PAGE (Customer Facing)
 * ============================================================================
 * This component allows a customer to select a service and join the queue.
 * It displays real-time estimates (wait time, people ahead) and generates 
 * a dynamic QR code for the selected service.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';
import QRCode from 'react-qr-code';
import './JoinQueue.css';

const JoinQueue = () => {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasActiveTicket, setHasActiveTicket] = useState(false);
    const { language } = useLanguage();

    const t = translations[language] || translations.en;
    const navigate = useNavigate();

    // Fetch available services and check if the user is already in a queue
    // when the component mounts.
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // 1. Check for Active Ticket
                // Fetch status safely - if it 404s, it just means no active ticket
                try {
                    const statusRes = await api.get('/queue/status');
                    if (statusRes.data && statusRes.data.ticket) {
                        setHasActiveTicket(true);
                    } else {
                        setHasActiveTicket(false);
                    }
                } catch (statusErr) {
                    // 404 or other error means no active ticket for this check
                    setHasActiveTicket(false);
                }

                // 2. Fetch Available Services
                // Fetching services from backend to populate the dropdown
                const res = await api.get('/queue/services');
                setServices(res.data);
            } catch (err) {
                console.error("Fetch services error:", err);
                // Mock fallback
                setServices([
                    { _id: '1', name: 'General Consultation', prefix: 'GC', averageServiceTime: 15 },
                    { _id: '2', name: 'Account & Billing', prefix: 'AB', averageServiceTime: 20 },
                    { _id: '3', name: 'Express Service', prefix: 'ES', averageServiceTime: 10 }
                ]);
            } finally {
                setLoading(false);
            }
        };



        fetchServices();
    }, []);

    /**
     * handleJoin
     * Called when the user clicks the "Get Ticket" button.
     * Prevents joining if the user already has an active ticket.
     * Submits the selected service ID to the backend to create a queue entry.
     */
    const handleJoin = async () => {
        if (!selectedService) return; // Ensure a service is selected
        
        if (hasActiveTicket) {
            alert(t.jq_already); // Inform user they can't join multiple queues
            return;
        }
        
        try {
            // Post request to join the queue
            await api.post('/queue/join', { serviceId: selectedService._id });
            
            // On success, redirect to the customer dashboard to view live status
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to join queue');
        }
    };


    return (
        <div className=" jq-container">
            <Navbar activePage="join" />

            <main className="container jq-content">
                <div className="jq-intro">
                    <h1>{t.jq_title}</h1>
                    <p>{t.jq_desc}</p>
                </div>

                <div className="jq-selection-grid">
                    <div className="jq-left-col">
                        <div className="jq-card">
                            <span className="jq-label">{t.jq_select}</span>
                            <div className="jq-select-wrapper">
                                <select
                                    className="jq-select"
                                    onChange={(e) => setSelectedService(services.find(s => String(s._id) === String(e.target.value)))}
                                    value={selectedService?._id || ''}
                                >
                                    <option value="" disabled>{t.jq_select}</option>
                                    {services.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                                <svg className="jq-select-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>

                            <div className="jq-stats-row">
                                <div className="jq-stat-box">
                                    <span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                        </svg>
                                        Current Queue
                                    </span>
                                    <h3>{selectedService ? `${selectedService.waitingCount || 0} People` : '--'}</h3>
                                </div>
                                <div className="jq-stat-box">
                                    <span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        Avg. Wait
                                    </span>
                                    <h3>{selectedService ? `~${(selectedService.waitingCount + 1 || 1) * selectedService.averageServiceTime} Mins` : '--'}</h3>
                                </div>
                            </div>

                            {hasActiveTicket && (
                                <div style={{ 
                                    background: '#fff1f2', 
                                    border: '1px solid #fecaca', 
                                    padding: '15px', 
                                    borderRadius: '12px', 
                                    marginBottom: '20px',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-start'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" style={{ flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#9f1239', lineHeight: '1.4', fontWeight: 500 }}>
                                        {t.jq_already}
                                    </p>
                                </div>
                            )}

                            <button 
                                onClick={handleJoin} 
                                className="btn-confirm" 
                                disabled={!selectedService || hasActiveTicket}
                                style={hasActiveTicket ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="6" y1="5" x2="6" y2="19" />
                                </svg>
                                {t.jq_get}
                            </button>

                        </div>
                    </div>

                    <div className="jq-right-col">
                        <div className="token-preview">
                            <span className="token-status"><i></i> Preview</span>

                            <div className="token-meta">
                                <span className="jq-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Token Preview</span>
                                <h2 className="token-id">{selectedService ? `${selectedService.prefix}-###` : '----'}</h2>
                            </div>

                            <div className="qr-box">
                                <div className="qr-placeholder" style={{ background: 'white', padding: '10px' }}>
                                    {selectedService ? (
                                        <QRCode
                                            value={`SMARTQ-SERVICE-${selectedService._id}`}
                                            size={100}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        />
                                    ) : (
                                        <div style={{ padding: '20px', color: '#ccc', textAlign: 'center' }}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <rect x="7" y="7" width="3" height="3" />
                                                <rect x="14" y="7" width="3" height="3" />
                                                <rect x="7" y="14" width="3" height="3" />
                                                <rect x="14" y="14" width="3" height="3" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="qr-details">
                                    <div className="qr-item">
                                        <span>Service</span>
                                        <h4>{selectedService?.name || 'Select Service'}</h4>
                                    </div>
                                    <div className="qr-item">
                                        <span>Est. Wait</span>
                                        <h4>{selectedService ? `${(selectedService.waitingCount + 1 || 1) * selectedService.averageServiceTime} Mins` : '--'}</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="token-loc">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                SmartQ Service Center
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JoinQueue;
