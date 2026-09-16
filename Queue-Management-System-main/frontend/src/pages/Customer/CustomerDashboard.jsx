/**
 * ============================================================================
 * CUSTOMER DASHBOARD
 * ============================================================================
 * The primary interface for a customer after they have joined a queue.
 * Displays their active ticket, live wait time, queue position, and assigned 
 * counter. Listens to Socket.io events for real-time updates.
 */

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';
import QRCode from 'react-qr-code';
import { io } from 'socket.io-client';
import Toast from '../../components/Toast';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [ticketData, setTicketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [toast, setToast] = useState(null);
    const { language } = useLanguage();

    const showToast = React.useCallback((message, type = 'info') => {
        setToast({ message, type });
    }, []);

    const t = translations[language] || translations.en;
    const navigate = useNavigate();

    // Initialize Socket connection and fetch current queue status
    useEffect(() => {
        let socket;

        const connectSocketAndFetch = async () => {
            try {
                // 1. Fetch current ticket status from the backend API
                const res = await api.get('/queue/status');
                setTicketData(res.data);

                // 2. Setup Socket.io if the user has an active ticket
                if (res.data.ticket) {
                    // 3. Connect to the WebSocket server
                    socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

                    // Join service room to get general queue length updates for this service
                    if (res.data.ticket.service?._id) {
                        socket.emit('join_queue_room', res.data.ticket.service._id);
                    }

                    // Join counter-specific room for targeted position/calling updates
                    if (res.data.ticket.counter?._id) {
                        socket.emit('join_counter_room', res.data.ticket.counter._id);
                    }

                    // 4. Listen for 'queue_updated' events broadcast by the backend
                    // Whenever an admin calls the next ticket, this event is fired.
                    socket.on('queue_updated', async () => {
                        try {
                            // Re-fetch the status to get the latest accurate data
                            const reload = await api.get('/queue/status');
                            setTicketData(reload.data);
                        } catch (e) {
                            setTicketData(null); // Clear ticket if they are no longer in the queue
                        }
                    });
                }
            } catch (err) {
                // No active ticket found
            } finally {
                setLoading(false);
            }
        };

        connectSocketAndFetch();

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

/**
 * handleRemoveQueue
 * Allows the user to abandon/cancel their queue ticket manually.
 */
const handleRemoveQueue = React.useCallback(async () => {
    if (!ticketData?.ticket?._id) return;
    try {
        await api.delete(`/queue/remove/${ticketData.ticket._id}`);
        setTicketData(null); // Clear local state to show the "No Active Queue" view
        setConfirmRemove(false);
        showToast("Your queue has been removed.", "success");
    } catch (err) {
        showToast(err.response?.data?.message || "Failed to remove queue", "error");
        setConfirmRemove(false);
    }
}, [ticketData, showToast]);

return (
    <div className="dashboard-container">
        <Navbar activePage="dashboard" />

        <main className="dash-content container">
            <div className="welcome-section">
                <h1>{t.dash_welcome}, {user?.name || 'Customer'}</h1>
                <p>{t.dash_dept}</p>
            </div>

            <div className={`dash-grid ${ticketData ? 'grid-active' : ''}`}>

                <div className="dash-main-col">
                    {loading ? (
                        <div className="ticket-card">Loading status...</div>
                    ) : ticketData ? (
                        <div className="ticket-card">
                            <div className="ticket-header" style={{ alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start', flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-end' }}>
                                        <div>
                                            <span className="ticket-label">{t.dash_ticket}</span>
                                            <h2 className="ticket-number" style={{ fontSize: '4.5rem', margin: 0 }}>{ticketData.ticket.ticketNumber}</h2>
                                        </div>
                                        <div style={{ paddingBottom: '8px' }}>
                                            <span className="ticket-label">Assigned Counter</span>
                                            <div style={{
                                                background: ticketData.counterNumber
                                                    ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                                                    : '#e2e8f0',
                                                color: ticketData.counterNumber ? 'white' : '#64748b',
                                                borderRadius: '12px',
                                                padding: '6px 18px',
                                                fontWeight: '800',
                                                fontSize: ticketData.counterNumber ? '1.6rem' : '1rem',
                                                letterSpacing: '-0.5px',
                                                display: 'inline-block',
                                                marginTop: '4px'
                                            }}>
                                                {ticketData.counterNumber ? `C-${ticketData.counterNumber}` : 'Assigning...'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="ticket-label">{t.dash_service}</span>
                                        <h3 style={{ margin: '4px 0 0 0', color: '#4f46e5', fontSize: '1.3rem', fontWeight: '700' }}>{ticketData.ticket.service?.name}</h3>
                                    </div>
                                    <div className="wait-tag" style={{ padding: '10px 20px', fontSize: '1rem' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {ticketData.estimatedWait > 0 ? ticketData.estimatedWait : '<1'} {t.dash_mins} {t.dash_wait}
                                    </div>
                                </div>
                                <div style={{ background: 'white', padding: '15px', border: '2px solid var(--dash-border)', borderRadius: '16px', boxShadow: 'var(--dash-shadow)' }}>
                                    <QRCode
                                        value={ticketData.ticket._id.toString()}
                                        size={140}
                                    />
                                </div>
                            </div>


                            <div className="ticket-stats">
                                <div className="stat-item">
                                    <span>Currently Serving</span>
                                    <h3>{ticketData.currentlyServing}</h3>
                                </div>
                                <div className="stat-item">
                                    <span>People Ahead</span>
                                    <h3>{ticketData.peopleAhead}</h3>
                                </div>
                            </div>

                            {/* Progress Bar Logic */}
                            <div className="progress-section">
                                {(() => {
                                    // Calculates progress percentage based on initial queue size vs current position
                                    let progress = 0;
                                    const status = ticketData.ticket.status.toLowerCase();

                                    // If called or serving, progress is 100%
                                    if (status === 'calling' || status === 'serving') {
                                        progress = 100;
                                    } else {
                                        const initial = ticketData.ticket.initialPeopleAhead || 0;
                                        const current = ticketData.peopleAhead;

                                        // Guard against division by zero
                                        if (initial === 0) {
                                            progress = current === 0 ? 100 : 50;
                                        } else {
                                            // Formula: (Initial - Current) / Initial * 100
                                            // Keeps progress between 5% and 95% while waiting
                                            progress = Math.max(5, Math.min(95, Math.round(((initial - current) / initial) * 100)));
                                        }
                                    }
                                    return (
                                        <>
                                            <div className="progress-header">
                                                <span>Queue Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="progress-bar-bg">
                                                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>


                            <div className="next-steps-section" style={{ marginTop: '10px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#4f46e5', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                    {t.dash_steps}
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <li style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                                        <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>1</span>
                                        {t.dash_step1}
                                    </li>
                                    <li style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                                        <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>2</span>
                                        {t.dash_step2}
                                    </li>
                                    <li style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                                        <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>3</span>
                                        {t.dash_step3}
                                    </li>
                                    <li style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                                        <span style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>4</span>
                                        {t.dash_step4}
                                    </li>
                                </ul>
                            </div>


                            <div className="ticket-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                    <span>{t.dash_status}: <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{ticketData.ticket.status}</span>. Please stay alert.</span>
                                </div>
                                {!confirmRemove ? (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setConfirmRemove(true);
                                        }}
                                        className="btn-dash-light"
                                        style={{
                                            borderColor: '#ef4444',
                                            color: '#ef4444',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            width: 'auto',
                                            flex: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t.dash_remove}
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>{t.auth_sure || "Are you sure?"}</span>
                                        <button
                                            onClick={() => handleRemoveQueue()}
                                            style={{ padding: '4px 10px', borderRadius: '4px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => setConfirmRemove(false)}
                                            style={{ padding: '4px 10px', borderRadius: '4px', background: '#64748b', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            No
                                        </button>
                                    </div>
                                )}


                            </div>

                        </div>
                    ) : (
                        <div className="ticket-card empty-state">
                            <h3>{t.dash_noq}</h3>
                            <p>{t.dash_noq_desc}</p>
                            <button onClick={() => navigate('/join')} className="btn-dash-primary">{t.dash_join_new}</button>
                        </div>
                    )}


                </div>


                <div className="dash-side-col">


                    <div className="side-card tip-card">
                        <div className="side-card-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21h6" />
                                <path d="M7 11c0-1.66.67-3.16 1.76-4.24l.58-.58a2 2 0 0 1 2.83 0l.58.58A6 6 0 1 1 7 11z" />
                            </svg>
                            {t.dash_tip}
                        </div>
                        <p>
                            {t.dash_tip_desc}
                        </p>
                    </div>

                    {ticketData && (
                        <div className="side-card hours-card">
                            <div className="side-card-header">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {t.side_hours}
                            </div>
                            <div className="hours-list">
                                <div className="hours-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{t.side_mon_fri}</span>
                                    <strong style={{ fontSize: '0.9rem', color: '#333' }}>
                                        {ticketData.ticket?.service?.serviceHours?.monFri || '8:30 AM - 4:30 PM'}
                                    </strong>
                                </div>
                                <div className="hours-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{t.side_sat}</span>
                                    <strong style={{ fontSize: '0.9rem', color: '#333' }}>
                                        {ticketData.ticket?.service?.serviceHours?.sat || '9:00 AM - 1:00 PM'}
                                    </strong>
                                </div>
                                <div className="hours-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{t.side_sun}</span>
                                    <span style={{ 
                                        fontSize: '0.9rem', 
                                        color: (ticketData.ticket?.service?.serviceHours?.sun || 'Closed').toLowerCase() === 'closed' ? '#ef4444' : '#10b981', 
                                        fontWeight: 700 
                                    }}>
                                        {ticketData.ticket?.service?.serviceHours?.sun || t.side_closed}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}



                    <div className="dash-actions">
                        <button onClick={() => navigate('/feedback')} className="btn-dash-primary" style={{ border: 'none', cursor: 'pointer', width: '100%' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {t.dash_submit_fb}
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <footer className="dash-footer">
            <p>{t.copyright}</p>
        </footer>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
);
};

export default CustomerDashboard;
