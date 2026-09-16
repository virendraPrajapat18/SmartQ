/**
 * ============================================================================
 * SERVICE MANAGEMENT PAGE (Super Admin)
 * ============================================================================
 * Allows Super Admins to configure the types of services offered by the 
 * organization (e.g., General Consultation, Billing).
 * Handles CRUD operations for services and sets their respective ticket prefixes.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import './ServiceManagement.css';
import './AdminDashboard.css';
import Sidebar from '../../components/Sidebar';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const defaultHours = {
        monFri: '8:30 AM - 4:30 PM',
        sat: '9:00 AM - 1:00 PM',
        sun: 'Closed'
    };
    const [form, setForm] = useState({ 
        name: '', 
        description: '', 
        averageServiceTime: 15, 
        prefix: '',
        serviceHours: { ...defaultHours }
    });
    const [editingService, setEditingService] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/admin/services');
            setServices(res.data);
        } catch (err) {
            console.error('Failed to fetch services', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const openCreateModal = () => {
        setEditingService(null);
        setForm({
            name: '',
            description: '',
            averageServiceTime: 15,
            prefix: '',
            serviceHours: { ...defaultHours }
        });
        setShowModal(true);
    };

    const handleEditClick = (service) => {
        setEditingService(service);
        setForm({
            name: service.name || '',
            description: service.description || '',
            averageServiceTime: service.averageServiceTime || 15,
            prefix: service.prefix || '',
            serviceHours: {
                monFri: service.serviceHours?.monFri || defaultHours.monFri,
                sat: service.serviceHours?.sat || defaultHours.sat,
                sun: service.serviceHours?.sun || defaultHours.sun
            }
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingService) {
                await api.put(`/admin/services/${editingService._id}`, form);
                showToast('Service updated successfully', 'success');
            } else {
                await api.post('/admin/services', form);
                showToast('Service created successfully', 'success');
            }
            setShowModal(false);
            setEditingService(null);
            fetchServices();
        } catch (err) {
            showToast(err.response?.data?.message || (editingService ? 'Failed to update service' : 'Failed to create service'), 'error');
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await api.put(`/admin/services/${id}`, { isActive: !currentStatus });
            fetchServices();
            showToast('Service status updated', 'success');
        } catch (err) {
            showToast('Failed to update service status', 'error');
        }
    };

    const handleDeleteClick = (e, service) => {
        e.stopPropagation();
        setServiceToDelete(service);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/services/${serviceToDelete._id}`);
            fetchServices();
            showToast('Service deleted', 'success');
            setShowDeleteConfirm(false);
            setServiceToDelete(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete service', 'error');
        }
    };

    const stats = {
        total: services.length,
        active: services.filter(s => s.isActive).length,
        totalWaiting: services.reduce((sum, s) => sum + (s.waitingCount || 0), 0)
    };

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">
                <div className="sm-container">
                    <div className="sm-header">
                        <div className="sm-header-left">
                            <h1>Service Management</h1>
                            <p>Configure and monitor all department services.</p>
                        </div>
                        <button className="sm-btn-add" onClick={(e) => { e.stopPropagation(); openCreateModal(); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Service
                        </button>
                    </div>

                    <div className="sm-stats">
                        <div className="sm-stat-card">
                            <div className="sm-stat-icon total">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                            </div>
                            <div className="sm-stat-info">
                                <span>Total Services</span>
                                <h3>{stats.total}</h3>
                            </div>
                        </div>
                        <div className="sm-stat-card">
                            <div className="sm-stat-icon active">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <path d="m9 12 2 2 4-4"></path>
                                </svg>
                            </div>
                            <div className="sm-stat-info">
                                <span>Active Services</span>
                                <h3>{stats.active}</h3>
                            </div>
                        </div>
                        <div className="sm-stat-card">
                            <div className="sm-stat-icon waiting">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <div className="sm-stat-info">
                                <span>Currently Waiting</span>
                                <h3>{stats.totalWaiting}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="sm-grid">
                        {loading ? (
                            <div className="sm-empty"><p>Loading services...</p></div>
                        ) : services.length === 0 ? (
                            <div className="sm-empty">
                                <h3>No services configured</h3>
                                <p>Click "Add Service" to create your first service.</p>
                            </div>
                        ) : (
                            services.map(service => (
                                <div key={service._id} className="sm-card">
                                    <div className="sm-card-top">
                                        <div className="sm-card-title">
                                            <div className="sm-prefix">{service.prefix}</div>
                                            <div>
                                                <h3>{service.name}</h3>
                                                <span>~{service.averageServiceTime} min avg</span>
                                            </div>
                                        </div>
                                        <span className={`sm-status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                                            {service.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="sm-card-body">
                                        <div className="sm-card-stats">
                                            <div className="sm-mini-stat">
                                                <span>Today</span>
                                                <strong>{service.todayTickets || 0}</strong>
                                            </div>
                                            <div className="sm-mini-stat">
                                                <span>Waiting</span>
                                                <strong>{service.waitingCount || 0}</strong>
                                            </div>
                                            <div className="sm-mini-stat">
                                                <span>Counters</span>
                                                <strong>{service.countersCount || 0}</strong>
                                            </div>
                                        </div>
                                        {service.description && (
                                            <p className="sm-card-desc">{service.description}</p>
                                        )}
                                        <div className="sm-hours-preview">
                                            <div className="sm-hours-preview-header">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <span>Hours:</span>
                                            </div>
                                            <span className="sm-hours-text">
                                                Mon–Fri: <strong>{service.serviceHours?.monFri || '8:30 AM - 4:30 PM'}</strong> &bull; Sat: <strong>{service.serviceHours?.sat || '9:00 AM - 1:00 PM'}</strong> &bull; Sun: <strong style={{ color: (service.serviceHours?.sun || 'Closed').toLowerCase() === 'closed' ? '#ef4444' : '#10b981' }}>{service.serviceHours?.sun || 'Closed'}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sm-card-footer">
                                        <button
                                            className="sm-btn-edit"
                                            onClick={() => handleEditClick(service)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="sm-btn-toggle"
                                            onClick={() => handleToggle(service._id, service.isActive)}
                                        >
                                            {service.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            className="sm-btn-delete"
                                            onClick={(e) => handleDeleteClick(e, service)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="sm-modal-overlay" onClick={() => { setShowModal(false); setEditingService(null); }}>
                    <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="sm-form-group">
                                <label>Service Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. General Consultation"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="sm-form-row">
                                <div className="sm-form-group">
                                    <label>Prefix Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. VR"
                                        value={form.prefix}
                                        onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                                        required
                                        maxLength={4}
                                    />
                                </div>
                                <div className="sm-form-group">
                                    <label>Avg. Service Time (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.averageServiceTime}
                                        onChange={(e) => setForm({ ...form, averageServiceTime: parseInt(e.target.value) || 15 })}
                                    />
                                </div>
                            </div>
                            <div className="sm-form-group">
                                <label>Description (optional)</label>
                                <textarea
                                    placeholder="Brief description of this service..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            {/* Service Hours Section */}
                            <div className="sm-hours-box">
                                <div className="sm-hours-box-header">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span>Service Operational Hours</span>
                                </div>
                                <div className="sm-form-group" style={{ marginBottom: '12px' }}>
                                    <label>Monday – Friday Hours</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 8:30 AM - 4:30 PM"
                                        value={form.serviceHours?.monFri || ''}
                                        onChange={(e) => setForm({
                                            ...form,
                                            serviceHours: { ...form.serviceHours, monFri: e.target.value }
                                        })}
                                        required
                                    />
                                </div>
                                <div className="sm-form-row">
                                    <div className="sm-form-group">
                                        <label>Saturday Hours</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 9:00 AM - 1:00 PM"
                                            value={form.serviceHours?.sat || ''}
                                            onChange={(e) => setForm({
                                                ...form,
                                                serviceHours: { ...form.serviceHours, sat: e.target.value }
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="sm-form-group">
                                        <label>Sunday Hours</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Closed"
                                            value={form.serviceHours?.sun || ''}
                                            onChange={(e) => setForm({
                                                ...form,
                                                serviceHours: { ...form.serviceHours, sun: e.target.value }
                                            })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="sm-modal-actions">
                                <button type="button" className="sm-btn-cancel" onClick={() => { setShowModal(false); setEditingService(null); }}>Cancel</button>
                                <button type="submit" className="sm-btn-save">{editingService ? 'Update Service' : 'Create Service'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="premium-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2>Delete Service?</h2>
                        <p>Are you sure you want to delete <strong>{serviceToDelete?.name}</strong>? This will remove it from all counters and cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="btn-confirm-delete" onClick={confirmDelete}>Yes, Delete Service</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ServiceManagement;
