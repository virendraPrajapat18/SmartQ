import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import './CounterManagement.css';
import './AdminDashboard.css';
import io from 'socket.io-client';
import Sidebar from '../../components/Sidebar';

const socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

const CounterManagement = () => {
    const [counters, setCounters] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [counterToDelete, setCounterToDelete] = useState(null);
    const [editingCounter, setEditingCounter] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({
        number: '',
        servicesHandled: []
    });
    const navigate = useNavigate();

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const fetchCounters = async () => {
        try {
            const res = await api.get('/admin/counters');
            setCounters(res.data);
        } catch (err) {
            console.error('Failed to fetch counters');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/admin/services');
            setServices(res.data);
        } catch (err) {
            console.error('Failed to fetch services');
        }
    };

    useEffect(() => {
        fetchCounters();
        fetchServices();

        socket.on('queue_updated', fetchCounters);
        return () => socket.off('queue_updated');
    }, []);

    const handleOpenAdd = () => {
        setEditingCounter(null);
        setForm({ number: counters.length + 1, servicesHandled: [] });
        setShowModal(true);
    };

    const handleOpenEdit = (counter) => {
        setEditingCounter(counter);
        setForm({
            number: counter.number,
            servicesHandled: counter.servicesHandled.map(s => s._id || s)
        });
        setShowModal(true);
    };

    const handleServiceToggle = (serviceId) => {
        setForm(prev => {
            const current = prev.servicesHandled;
            if (current.includes(serviceId)) {
                return { ...prev, servicesHandled: current.filter(id => id !== serviceId) };
            } else {
                return { ...prev, servicesHandled: [...current, serviceId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCounter) {
                await api.put(`/admin/counters/${editingCounter._id}`, form);
                showToast('Counter updated successfully', 'success');
            } else {
                await api.post('/admin/counters', form);
                showToast('Counter created successfully', 'success');
            }
            setShowModal(false);
            fetchCounters();
        } catch (err) {
            showToast(err.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setCounterToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/counters/${counterToDelete}`);
            showToast('Counter deleted successfully', 'success');
            setShowDeleteConfirm(false);
            setCounterToDelete(null);
            fetchCounters();
        } catch (err) {
            showToast('Failed to delete counter', 'error');
        }
    };

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">
                <div className="cm-container">
                    <header className="cm-header">
                        <div className="cm-header-left">
                            <h1>Counter Management</h1>
                            <p>Monitor and configure service points across all departments.</p>
                        </div>
                        <button className="cm-btn-add" onClick={handleOpenAdd}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Counter
                        </button>
                    </header>

                    <div className="cm-grid">
                        {loading ? <p>Loading counters...</p> : counters.map(counter => (
                            <div key={counter._id} className="cm-card">
                                <div className="cm-card-header">
                                    <div className="cm-badge">Counter {counter.number}</div>
                                    <span className={`status-dot ${counter.isActive ? 'online' : 'offline'}`}></span>
                                </div>
                                <div className="cm-card-body">
                                    <div className="cm-info-item">
                                        <span>Status</span>
                                        <strong className={counter.isActive ? 'text-online' : 'text-offline'}>
                                            {counter.isActive ? 'Online' : 'Offline'}
                                        </strong>
                                    </div>
                                    <div className="cm-info-item">
                                        <span>Current Ticket</span>
                                        <strong>{counter.currentTicket ? 'Active' : 'None'}</strong>
                                    </div>
                                    <div className="cm-services">
                                        <span>Assigned Services</span>
                                        <div className="service-tags">
                                            {counter.servicesHandled?.length > 0 ? (
                                                counter.servicesHandled.map(s => (
                                                    <span key={s._id} className="s-tag">{s.name}</span>
                                                ))
                                            ) : (
                                                <span className="no-services">No services assigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="cm-card-actions">
                                    <button className="cm-btn-edit" onClick={() => handleOpenEdit(counter)}>Configure</button>
                                    <button className="cm-btn-delete" onClick={(e) => handleDeleteClick(e, counter._id)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showModal && (
                    <div className="cm-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                            <h2>{editingCounter ? `Edit Counter ${editingCounter.number}` : 'Add New Counter'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="cm-form-group">
                                    <label>Counter Number</label>
                                    <input 
                                        type="number" 
                                        value={form.number} 
                                        onChange={(e) => setForm({...form, number: e.target.value})}
                                        required 
                                        placeholder="e.g. 5"
                                    />
                                </div>
                                <div className="cm-form-group">
                                    <label>Assign Services</label>
                                    <div className="cm-services-selection">
                                        {services.map(service => (
                                            <div 
                                                key={service._id} 
                                                className={`cm-service-option ${form.servicesHandled.includes(service._id) ? 'selected' : ''}`}
                                                onClick={() => handleServiceToggle(service._id)}
                                            >
                                                <div className="checkbox">
                                                    {form.servicesHandled.includes(service._id) && <span>✓</span>}
                                                </div>
                                                <div className="service-info">
                                                    <strong>{service.name}</strong>
                                                    <span>{service.prefix}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="cm-modal-actions">
                                    <button type="button" className="cm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="cm-btn-save">
                                        {editingCounter ? 'Update Counter' : 'Create Counter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className="cm-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="cm-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="confirm-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2>Delete Counter?</h2>
                            <p>This action cannot be undone. All active queue data for this counter will be disconnected.</p>
                            <div className="cm-modal-actions">
                                <button className="cm-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Keep it</button>
                                <button className="cm-btn-delete-confirm" onClick={confirmDelete}>Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CounterManagement;
