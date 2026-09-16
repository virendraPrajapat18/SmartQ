/**
 * ============================================================================
 * USER MANAGEMENT PAGE (Super Admin)
 * ============================================================================
 * Allows Super Admins to view all registered users (Customers, Admins).
 * Provides functionality to search, filter by role, change user roles,
 * and permanently delete users from the system.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import './UserManagement.css';
import './AdminDashboard.css';
import Sidebar from '../../components/Sidebar';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            fetchUsers();
            showToast('Role updated successfully', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update role', 'error');
        }
    };

    const handleDeleteClick = (e, user) => {
        e.stopPropagation();
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/users/${userToDelete._id}`);
            fetchUsers();
            showToast('User deleted successfully', 'success');
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user', 'error');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.phone?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
        customers: users.filter(u => u.role === 'customer').length
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">
                <div className="um-container">
                    <div className="um-header">
                        <div className="um-header-left">
                            <h1>User Management</h1>
                            <p>View and manage all registered users across the system.</p>
                        </div>
                    </div>

                    <div className="um-stats">
                        <div className="um-stat-card">
                            <div className="um-stat-icon total">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className="um-stat-info">
                                <span>Total Users</span>
                                <h3>{stats.total}</h3>
                            </div>
                        </div>
                        <div className="um-stat-card">
                            <div className="um-stat-icon admins">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <div className="um-stat-info">
                                <span>Staff & Admins</span>
                                <h3>{stats.admins}</h3>
                            </div>
                        </div>
                        <div className="um-stat-card">
                            <div className="um-stat-icon customers">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div className="um-stat-info">
                                <span>Customers</span>
                                <h3>{stats.customers}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="um-toolbar">
                        <div className="um-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="um-filter-group">
                            {['all', 'customer', 'admin', 'super_admin'].map(role => (
                                <button
                                    key={role}
                                    className={`um-filter-btn ${roleFilter === role ? 'active' : ''}`}
                                    onClick={() => setRoleFilter(role)}
                                >
                                    {role === 'all' ? 'All' : role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="um-table-card">
                        {loading ? (
                            <div className="um-empty"><p>Loading users...</p></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="um-empty">
                                <h3>No users found</h3>
                                <p>Try adjusting your search or filter criteria.</p>
                            </div>
                        ) : (
                            <div className="um-table-wrap">
                                <table className="um-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                        <th>Change Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="um-user-cell">
                                                    <div className="um-avatar">{getInitials(user.name)}</div>
                                                    <div className="um-user-details">
                                                        <strong>{user.name}</strong>
                                                        <span>{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.nic}</td>
                                            <td>
                                                <span className={`um-role-badge ${user.role}`}>
                                                    {user.role === 'super_admin' ? 'Super Admin' : user.role}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <select
                                                    className="um-role-select"
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className="um-actions">
                                                    <button
                                                        className="um-btn-delete"
                                                        onClick={(e) => handleDeleteClick(e, user)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="premium-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2>Delete User?</h2>
                        <p>Are you sure you want to delete <strong>{userToDelete?.name}</strong>? All their queue history and profile data will be permanently removed.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="btn-confirm-delete" onClick={confirmDelete}>Yes, Delete User</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default UserManagement;
