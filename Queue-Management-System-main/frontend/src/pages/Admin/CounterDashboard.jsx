/**
 * ============================================================================
 * COUNTER DASHBOARD (Admin/Staff Interface)
 * ============================================================================
 * This dashboard is used by staff members managing a specific counter.
 * It allows them to:
 * 1. Call the next ticket in line.
 * 2. Start, Hold, or Complete service for a ticket.
 * 3. Scan physical QR codes using a webcam to process walk-in or digital tickets.
 * 4. View a real-time list of today's queue and click any ticket to manage it.
 * 5. Resume held tickets from the queue list when the counter is free.
 *
 * RULES:
 * - ONE COUNTER = ONE ACTIVE TICKET (calling/serving).
 * - Resume is disabled if the counter is currently busy.
 * - "Clear All" in Scanned Tickets only clears the scanner UI; it does NOT alter ticket state.
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import './CounterDashboard.css';
import io from 'socket.io-client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Toast from '../../components/Toast';
import { 
    User, 
    Smartphone, 
    Play, 
    CheckCircle, 
    Pause, 
    ArrowRight, 
    Users, 
    Clock,
    LayoutDashboard,
    Scan,
    XCircle,
    RotateCcw,
    Info,
    LogOut
} from 'lucide-react';

const socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

const CounterDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const [counters, setCounters] = useState([]);
    const [selectedCounter, setSelectedCounter] = useState(null);
    const [serving, setServing] = useState(null);      // Current active ticket on this counter
    const [queue, setQueue] = useState([]);
    const [stats, setStats] = useState({ served: 0, waiting: 0 });
    const [scannedTickets, setScannedTickets] = useState([]);
    const [toast, setToast] = useState(null);
    const [selectedQueueTicket, setSelectedQueueTicket] = useState(null); // Ticket selected from queue list
    const scannerRef = useRef(null);
    const scannedIdsRef = useRef(new Set());

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // 1. Fetch available counters on mount
    useEffect(() => {
        const fetchCounters = async () => {
            try {
                const res = await api.get('/admin/counters');
                const fetchedCounters = res.data;
                setCounters(fetchedCounters);
            } catch (err) {
                console.error('Error fetching counters', err);
            }
        };

        fetchCounters();
    }, []);

    // 2. Handle Real-Time Updates when a Counter is selected
    useEffect(() => {
        if (selectedCounter) {
            fetchCounterData(selectedCounter._id);

            // Join the specific room for this counter to receive targeted socket events
            socket.emit('join_counter_room', selectedCounter._id);

            // Listener: When the backend emits a queue update, re-fetch data
            const handleUpdate = () => {
                fetchCounterData(selectedCounter._id);
            };

            /**
             * counter_status_changed listener
             * Fired by the backend whenever ANY counter transitions between
             * busy (calling/serving) and idle. This keeps all open dashboards
             * (Admin AND Super Admin) in sync without a page refresh.
             */
            const handleCounterStatusChanged = ({ counterId }) => {
                if (counterId === selectedCounter._id) {
                    fetchCounterData(selectedCounter._id);
                }
            };

            socket.on('queue_updated', handleUpdate);
            socket.on('counter_status_changed', handleCounterStatusChanged);

            return () => {
                // Cleanup listeners on unmount or when changing counters
                socket.off('queue_updated', handleUpdate);
                socket.off('counter_status_changed', handleCounterStatusChanged);
            };
        }
    }, [selectedCounter]);

    /**
     * fetchCounterData
     * Fetches the queue list, the currently serving ticket, and analytics 
     * stats for the selected counter. Also refreshes selectedQueueTicket
     * from the latest queue data so that its status always reflects the DB state.
     */
    const fetchCounterData = async (counterId) => {
        try {
            // Fetch queue for this counter
            const queueRes = await api.get(`/admin/counter/${counterId}/queue`);
            // Sort descending by checkInTime so newest are at top
            const sortedQueue = queueRes.data.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
            setQueue(sortedQueue);

            // Refresh selected queue ticket state from backend data
            setSelectedQueueTicket(prev => {
                if (!prev) return null;
                const updated = sortedQueue.find(t => t._id === prev._id);
                return updated || null;
            });

            // Fetch current serving ticket
            const counterRes = await api.get('/admin/counters');
            const currentCounter = counterRes.data.find(c => c._id === counterId);
            
            if (currentCounter && currentCounter.currentTicket) {
                const ticketRes = await api.get(`/admin/ticket/${currentCounter.currentTicket}`);
                setServing(ticketRes.data);
            } else {
                setServing(null);
            }

            // Fetch stats (served count, waiting count)
            const statsRes = await api.get(`/admin/analytics?counterId=${counterId}`);
            setStats({
                served: statsRes.data.completedTickets,
                waiting: statsRes.data.activeTickets
            });
        } catch (err) {
            console.error('Error fetching counter data', err);
        }
    };

    const handleCounterChange = (e) => {
        const counter = counters.find(c => c._id === e.target.value);
        setSelectedCounter(counter);
        setSelectedQueueTicket(null); // Reset selection when counter changes
    };

    // ------------------------------------------------------------------------
    // QUEUE ACTIONS
    // ------------------------------------------------------------------------

    // Calls the next oldest waiting ticket from the queue
    const handleCallNext = async () => {
        if (!selectedCounter) return;
        try {
            const res = await api.put(`/admin/counter/${selectedCounter._id}/call-next`);
            setServing(res.data);
            setSelectedQueueTicket(null);
            showToast(`Called ticket ${res.data.ticketNumber}`, 'success');
            fetchCounterData(selectedCounter._id);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    // Marks the called/on-hold ticket as 'Serving'
    const handleStartService = async (ticketId) => {
        const tid = ticketId || serving?._id;
        if (!selectedCounter || !tid) return;
        try {
            const res = await api.put(`/admin/counter/${selectedCounter._id}/start?ticketId=${tid}`, { ticketId: tid });
            setServing(res.data);
            setSelectedQueueTicket(null);
            fetchCounterData(selectedCounter._id);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    // Marks the ticket as 'Completed', removing it from the active queue
    const handleComplete = async () => {
        if (!selectedCounter || !serving) return;
        try {
            await api.put(`/admin/counter/${selectedCounter._id}/complete`);
            setServing(null);
            setSelectedQueueTicket(null);
            fetchCounterData(selectedCounter._id);
        } catch (err) {
            showToast('Error completing service', 'error');
        }
    };

    const handleHold = async () => {
        if (!serving) return;
        try {
            const res = await api.put(`/admin/counter/${selectedCounter._id}/hold`);
            const heldTicket = res.data;
            
            // Clear from current service view
            setServing(null);
            setSelectedQueueTicket(null);
            
            fetchCounterData(selectedCounter._id);
            showToast(`Ticket ${heldTicket.ticketNumber} put on hold`, 'info');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedCounter) return;
        try {
            const res = await api.put(`/admin/counter/${selectedCounter._id}/toggle-status`);
            setSelectedCounter(prev => ({ ...prev, isActive: res.data.isActive }));
            setCounters(prev => prev.map(c => c._id === res.data._id ? { ...c, isActive: res.data.isActive } : c));
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    // ------------------------------------------------------------------------
    // QR SCANNER LOGIC
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (!selectedCounter) return;

        // Initialize HTML5 QR Code Scanner (Requires Camera Permission)
        const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 250, height: 250 },
        }, false);

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            // Cleanup scanner to prevent memory leaks when navigating away
            scanner.clear().catch(err => {
                console.error('Failed to clear scanner', err);
                const readerElement = document.getElementById('reader');
                if (readerElement) readerElement.innerHTML = '';
            });
        };
    }, [selectedCounter]);

    const onScanSuccess = async (decodedText) => {
        // Debounce mechanism: Ignore if we already scanned this ID recently
        if (scannedIdsRef.current.has(decodedText)) return;

        try {
            scannedIdsRef.current.add(decodedText);
            // Verify the scanned ticket against the backend
            const res = await api.get(`/admin/ticket/${decodedText}`);
            // Add valid ticket to the 'Scanned Tickets' sidebar list
            setScannedTickets(prev => [res.data, ...prev]);
        } catch (err) {
            console.error('Scanned invalid QR code or error fetching ticket', err);
            scannedIdsRef.current.delete(decodedText);
        }
    };

    const handleScannedStartService = async (ticketId) => {
        if (!selectedCounter || !ticketId) return showToast('Select counter and scan ticket first', 'warning');
        try {
            const res = await api.put(`/admin/counter/${selectedCounter._id}/start?ticketId=${ticketId}`, { ticketId });
            setServing(res.data);
            fetchCounterData(selectedCounter._id);
            // Remove the ticket from the scanned list once started
            setScannedTickets(prev => prev.filter(t => String(t._id) !== String(ticketId)));
            scannedIdsRef.current.delete(ticketId);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    const handleScannedCancel = async (ticketId) => {
        if (!selectedCounter || !ticketId) return showToast('Select counter and scan ticket first', 'warning');
        try {
            await api.put(`/admin/counter/${selectedCounter._id}/cancel`, { ticketId });
            fetchCounterData(selectedCounter._id);
            // Remove the ticket from the scanned list once cancelled
            setScannedTickets(prev => prev.filter(t => String(t._id) !== String(ticketId)));
            scannedIdsRef.current.delete(ticketId);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error', 'error');
        }
    };

    const onScanFailure = (error) => {
        // Silently ignore scanner errors
    };

    // ------------------------------------------------------------------------
    // SELECTED QUEUE TICKET PANEL - Render logic
    // ------------------------------------------------------------------------
    /**
     * Determine whether a ticket selected from the queue is the currently
     * active ticket or a different one, so we know which actions to show.
     */
    const isBusy = !!serving; // Counter currently has an active ticket
    const isSelectedTheServing = serving && selectedQueueTicket?._id === serving._id;

    const renderTicketActions = () => {
        if (!selectedQueueTicket) return null;
        const st = selectedQueueTicket.status;

        if (st === 'waiting') {
            return (
                <div className="cd-actions cd-selected-actions">
                    <button
                        className="cd-btn cd-btn-next"
                        onClick={() => handleStartService(selectedQueueTicket._id)}
                        disabled={isBusy && !isSelectedTheServing}
                        title={isBusy && !isSelectedTheServing ? 'Complete or hold the current active ticket first.' : ''}
                    >
                        <Play size={18} /> Accept & Serve
                    </button>
                </div>
            );
        }

        if (st === 'calling') {
            return (
                <div className="cd-actions cd-selected-actions">
                    <button
                        className="cd-btn cd-btn-next"
                        onClick={() => handleStartService(selectedQueueTicket._id)}
                    >
                        <Play size={18} /> Accept / Start
                    </button>
                    <button className="cd-btn cd-btn-hold" onClick={handleHold} disabled={!isSelectedTheServing}>
                        <Pause size={18} /> On Hold
                    </button>
                </div>
            );
        }

        if (st === 'serving') {
            return (
                <div className="cd-actions cd-selected-actions">
                    <button className="cd-btn cd-btn-complete" onClick={handleComplete}>
                        <CheckCircle size={18} /> Complete
                    </button>
                    <button className="cd-btn cd-btn-hold" onClick={handleHold}>
                        <Pause size={18} /> On Hold
                    </button>
                </div>
            );
        }

        if (st === 'on-hold') {
            const canResume = !isBusy;
            return (
                <div className="cd-actions cd-selected-actions">
                    <button
                        className="cd-btn cd-btn-next"
                        onClick={() => handleStartService(selectedQueueTicket._id)}
                        disabled={!canResume}
                        title={!canResume ? `Counter is busy with ${serving?.ticketNumber}. Complete or hold it first.` : ''}
                    >
                        <RotateCcw size={18} /> Resume
                    </button>
                    {!canResume && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                            padding: '8px 12px', background: '#fef3c7', border: '1px solid #f59e0b',
                            borderRadius: '8px', fontSize: '0.8rem', color: '#92400e'
                        }}>
                            <Info size={14} />
                            Counter busy with <strong>{serving?.ticketNumber}</strong>. Complete or hold it first.
                        </div>
                    )}
                </div>
            );
        }

        if (st === 'completed' || st === 'cancelled') {
            return (
                <div style={{ padding: '12px', color: 'var(--cd-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                    This ticket is {st}. No actions available.
                </div>
            );
        }

        return null;
    };

    // The "focus" ticket — either the one selected from the queue list, or the active serving one
    const focusTicket = selectedQueueTicket || serving;

    return (
        <div className="cd-container">
            <header className="cd-header">
                <div className="cd-welcome">
                    <h1>Hello, {user?.name || 'Staff Member'}</h1>
                    <p>Manage your counter and serve customers efficiently.</p>
                </div>
                <div className="cd-header-controls">
                    {selectedCounter && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem', color: 'var(--cd-text-muted)', maxWidth: '250px' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <strong>Services:</strong> {selectedCounter.servicesHandled?.map(s => s.name).join(', ') || 'None'}
                            </span>
                        </div>
                    )}
                    
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: '#f1f5f9', 
                        padding: '8px 16px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--cd-border)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--cd-text-main)', whiteSpace: 'nowrap' }}>Counter:</span>
                        <select 
                            className="cd-counter-select" 
                            onChange={handleCounterChange} 
                            value={selectedCounter?._id || ''}
                            style={{ 
                                margin: 0, 
                                padding: '6px 12px', 
                                width: 'auto', 
                                border: '1px solid #cbd5e1', 
                                background: 'white', 
                                borderRadius: '6px',
                                color: 'var(--cd-text-main)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="" disabled>Select Counter</option>
                            {counters.map(c => (
                                <option key={c._id} value={c._id}>Counter {c.number}</option>
                            ))}
                        </select>

                        {selectedCounter && (
                            <button 
                                onClick={handleToggleStatus}
                                style={{
                                    marginLeft: '4px',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    color: 'white',
                                    background: selectedCounter.isActive ? 'var(--cd-success)' : 'var(--cd-danger)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {selectedCounter.isActive ? 'Online' : 'Offline'}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: '1px solid #fecaca',
                            background: '#fff5f5',
                            color: '#ef4444',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff5f5';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.borderColor = '#fecaca';
                        }}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <div className="cd-grid">
                <div className="cd-main-section">

                    {/* Active Ticket Hero */}
                    <div className="cd-card" style={{ background: 'linear-gradient(135deg, #ffffff, #f1f5f9)' }}>
                        <div className="cd-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={20} color="var(--primary)" />
                                {selectedQueueTicket
                                    ? `Ticket: ${selectedQueueTicket.ticketNumber}`
                                    : 'Current Service'
                                }
                            </div>
                            {selectedQueueTicket && (
                                <button
                                    onClick={() => setSelectedQueueTicket(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cd-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <XCircle size={16} /> Deselect
                                </button>
                            )}
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cd-text-muted)', textTransform: 'uppercase' }}>
                                {focusTicket
                                    ? (selectedQueueTicket && !isSelectedTheServing ? `Selected — ${focusTicket.status.toUpperCase()}` : 'Now Serving')
                                    : 'Ready for Next'
                                }
                            </span>
                            <h2 style={{ fontSize: '4rem', margin: '0.5rem 0', color: 'var(--cd-primary)' }}>
                                {focusTicket ? focusTicket.ticketNumber : '---'}
                            </h2>
                            <p style={{ color: 'var(--cd-text-muted)' }}>
                                {focusTicket ? `User: ${focusTicket.user?.name || 'Walk-in'} | Service: ${focusTicket.service?.name || '—'}` : 'No active ticket'}
                            </p>
                        </div>

                        {/* Dynamic action buttons */}
                        {selectedQueueTicket ? (
                            renderTicketActions()
                        ) : (
                            <div className="cd-actions">
                                {/* 
                                  * FIXED: disabled={!!serving}
                                  * Disables whenever ANY active ticket exists on this counter.
                                  */}
                                <button className="cd-btn cd-btn-next" onClick={handleCallNext} disabled={!!serving}>
                                    <ArrowRight size={24} />
                                    Call Next
                                </button>

                                <button className="cd-btn cd-btn-next" onClick={() => handleStartService()} disabled={!serving || serving.status !== 'calling'} style={{ background: 'var(--cd-success)' }}>
                                    <Play size={24} />
                                    Accept
                                </button>

                                <button className="cd-btn cd-btn-complete" onClick={handleComplete} disabled={!serving || serving.status !== 'serving'}>
                                    <CheckCircle size={24} />
                                    Complete
                                </button>
                                <button className="cd-btn cd-btn-hold" onClick={handleHold} disabled={!serving}>
                                    <Pause size={24} />
                                    On Hold
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Today's Queue */}
                    <div className="cd-card">
                        <div className="cd-card-title">
                            <Users size={20} color="var(--primary)" />
                            Today's Queue List
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--cd-text-muted)', fontWeight: 400 }}>
                                Click any row to manage that ticket
                            </span>
                        </div>
                        <div className="cd-table-container">
                            <table className="cd-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>User</th>
                                        <th>Service</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.length > 0 ? queue.map((t) => (
                                        <tr
                                            key={t._id}
                                            className={[
                                                serving?._id === t._id ? 'cd-row-serving' : '',
                                                selectedQueueTicket?._id === t._id ? 'cd-row-selected' : '',
                                                ['waiting', 'on-hold', 'calling', 'serving'].includes(t.status) ? 'cd-row-clickable' : ''
                                            ].join(' ')}
                                            onClick={() => {
                                                if (selectedQueueTicket?._id === t._id) {
                                                    setSelectedQueueTicket(null); // Deselect if clicking the same row
                                                } else {
                                                    setSelectedQueueTicket(t);
                                                }
                                            }}
                                            title="Click to manage this ticket"
                                        >
                                            <td><strong>{t.ticketNumber}</strong></td>
                                            <td>{t.user?.name || 'Anonymous'}</td>
                                            <td>{t.service?.name}</td>
                                            <td>
                                                <span className={`cd-status-pill status-${t.status}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                                No tickets for today.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <aside className="cd-sidebar">
                    {/* Scanner Section */}
                    <div className="cd-card">
                        <div className="cd-card-title">
                            <Scan size={20} color="var(--primary)" />
                            QR Code Scanner
                        </div>
                        <div className="cd-scanner-box">
                            <div id="reader"></div>
                        </div>
                        {scannedTickets.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Scanned Tickets ({scannedTickets.length})</span>
                                    {/* 
                                      * IMPORTANT: "Clear All" ONLY removes tickets from the local scanner UI/history.
                                      * It does NOT modify ticket state in the database. Tickets remain fully accessible
                                      * from "Today's Queue List" and can still be managed there.
                                      */}
                                    <button className="cd-counter-badge" style={{ border: 'none', cursor: 'pointer', padding: '2px 8px' }} onClick={() => {
                                        setScannedTickets([]);
                                        scannedIdsRef.current.clear();
                                    }}>
                                        Clear UI
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                                    {scannedTickets.map(ticket => (
                                        <div key={ticket._id} className="cd-scanned-info" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <strong>Ticket: {ticket.ticketNumber}</strong>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        Service: {ticket.service?.name} | Status: {ticket.status}
                                                    </div>
                                                </div>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => {
                                                    setScannedTickets(prev => prev.filter(t => t._id !== ticket._id));
                                                    scannedIdsRef.current.delete(ticket._id);
                                                }}>
                                                    ✕
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {['waiting', 'on-hold', 'calling'].includes(ticket.status) && (
                                                    <button 
                                                        onClick={() => handleScannedStartService(ticket._id)}
                                                        disabled={isBusy && serving?._id !== ticket._id}
                                                        style={{ flex: 1, padding: '6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', opacity: isBusy && serving?._id !== ticket._id ? 0.5 : 1 }}
                                                        title={isBusy && serving?._id !== ticket._id ? 'Complete the current active ticket first' : ''}
                                                    >
                                                        <Play size={14} /> Accept
                                                    </button>
                                                )}
                                                {['serving', 'waiting', 'calling', 'on-hold'].includes(ticket.status) && (
                                                    <button 
                                                        onClick={() => handleScannedCancel(ticket._id)}
                                                        style={{ flex: 1, padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <XCircle size={14} /> Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="cd-card">
                        <div className="cd-card-title">
                            Simple Stats
                        </div>
                        <div className="cd-stats-grid">
                            <div className="cd-stat-card">
                                <span>Total Served Today</span>
                                <h3>{stats.served}</h3>
                            </div>
                            <div className="cd-stat-card" style={{ borderTop: '1px solid var(--border)' }}>
                                <span>Currently Waiting</span>
                                <h3>{stats.waiting}</h3>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CounterDashboard;
