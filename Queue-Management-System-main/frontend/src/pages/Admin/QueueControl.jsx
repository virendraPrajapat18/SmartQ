import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import './QueueControl.css';
import './AdminDashboard.css';
import io from 'socket.io-client';
import Sidebar from '../../components/Sidebar';

const socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

const QueueControl = () => {
    const { user } = useContext(AuthContext);
    const [serving, setServing] = useState(null);
    const [counters, setCounters] = useState([]);
    const [selectedCounter, setSelectedCounter] = useState(null);
    const [stats, setStats] = useState({ waiting: 0, avgWait: 0 });
    const navigate = useNavigate();

    const fetchStats = async () => {
        try {
            const params = selectedCounter ? { counterId: selectedCounter._id } : {};
            const res = await api.get('/admin/analytics', { params });
            setStats({
                waiting: res.data.activeTickets,
                avgWait: res.data.avgWaitTime
            });
        } catch (err) { }
    };

    const fetchCounters = async () => {
        try {
            const res = await api.get('/admin/counters');
            setCounters(res.data);
        } catch (err) { }
    };

    useEffect(() => {
        fetchCounters();
        fetchStats();

        const handleUpdate = () => {
            fetchCounters();
            fetchStats();
        };

        socket.on('queue_updated', handleUpdate);
        return () => socket.off('queue_updated', handleUpdate);
    }, [selectedCounter]);

    const handleCallNext = async () => {
        if (!selectedCounter) return alert('Please select a counter first');
        try {
            const res = await api.put(`/admin/counter/${selectedCounter._id}/call-next`);
            setServing(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'No more customers in queue');
        }
    };

    const handleComplete = async () => {
        if (!serving || !selectedCounter) return;
        try {
            await api.put(`/admin/counter/${selectedCounter._id}/complete`);
            setServing(null);
        } catch (err) { }
    };

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">
                <div className="qc-container">
                    <header className="qc-header">
                        <div className="qc-header-left">
                            <h2>Staff Queue Control</h2>
                            <span>Welcome, {user?.name || 'Officer'}</span>
                        </div>
                        <div className="qc-counter-picker" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>Active Counter:</span>
                            <select
                                onChange={(e) => setSelectedCounter(counters.find(c => c._id === e.target.value))}
                                value={selectedCounter?._id || ''}
                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="" disabled>Select Counter</option>
                                {counters.map(c => (
                                    <option key={c._id} value={c._id}>Counter {c.number}</option>
                                ))}
                            </select>
                        </div>
                    </header>

                    <div className="qc-grid">
                        <div className="qc-main">
                            <div className="serving-hero">
                                <span className="hero-label">NOW SERVING {selectedCounter ? `AT COUNTER ${selectedCounter.number}` : ''}</span>
                                <h1 className="hero-ticket">{serving ? serving.ticketNumber : '---'}</h1>
                                <p className="hero-service">{serving ? 'In Progress' : 'Ready for next customer'}</p>

                                <div className="hero-actions">
                                    <button className="btn-call" onClick={handleCallNext} disabled={serving || !selectedCounter}>
                                        Call Next Customer
                                    </button>
                                    {serving && (
                                        <button className="btn-complete" onClick={handleComplete}>
                                            Mark as Completed
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="quick-stats">
                                <div className="qs-item">
                                    <span>CUSTOMERS WAITING</span>
                                    <h3>{stats.waiting} People</h3>
                                </div>
                                <div className="qs-item">
                                    <span>AVG. WAIT TIME</span>
                                    <h3>{stats.avgWait} Mins</h3>
                                </div>
                            </div>
                        </div>

                        <aside className="qc-sidebar">
                            <h3>Counter Activity</h3>
                            <div className="counter-list">
                                {counters.map(c => (
                                    <div key={c._id} className={`counter-item ${selectedCounter?._id === c._id ? 'active' : ''}`}>
                                        <div className="c-info">
                                            <strong>Counter {c.number}</strong>
                                            <span>{c.isActive ? 'Online' : 'Offline'}</span>
                                        </div>
                                        <div className={`c-status ${c.isActive ? 'online' : 'offline'}`}></div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default QueueControl;

