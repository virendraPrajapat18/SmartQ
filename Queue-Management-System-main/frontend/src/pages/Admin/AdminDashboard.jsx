/**
 * ============================================================================
 * SUPER ADMIN DASHBOARD
 * ============================================================================
 * The main analytical dashboard for Super Admins.
 * Displays high-level system statistics (Total Tickets, Avg Wait Time), 
 * hourly traffic flow charts, service distribution, and live queue monitoring.
 * Uses Chart.js for data visualization and Socket.io for real-time updates.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AdminDashboard.css';

// Import Chart.js components for rendering analytics
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import io from 'socket.io-client';
import Sidebar from '../../components/Sidebar';

// Register Chart.js modules
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const socket = io(import.meta.env.VITE_SOCKET_URL || undefined);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [distView, setDistView] = useState('weekly');
    const navigate = useNavigate();

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/analytics');
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching analytics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Listen for real-time updates
        socket.on('queue_updated', () => {
            fetchStats();
        });

        return () => {
            socket.off('queue_updated');
        };
    }, []);

    const lineData = {
        labels: stats?.hourlyLabels || ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
        datasets: [{
            label: 'Tickets issued',
            data: stats?.hourlyTraffic || [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(0, 51, 102, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const doughnutData = {
        labels: stats?.serviceLabels || ['Registration', 'License', 'Inspection', 'Revenue'],
        datasets: [{
            data: distView === 'today' 
                ? (stats?.serviceDistributionToday || stats?.serviceDistribution || [25, 25, 25, 25])
                : (stats?.serviceDistributionWeekly || [25, 25, 25, 25]),
            backgroundColor: ['#4f46e5', '#0066cc', '#00cc66', '#ff9933', '#8b5cf6', '#ec4899', '#06b6d4'],
        }]
    };

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">

                <div className="admin-content">
                    <div className="stat-cards">
                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Total Tickets Today</span>
                                <h2>{stats?.totalTickets || 0}</h2>
                            </div>
                            <div className="stat-trend up">+12%</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Avg. Wait Time</span>
                                <h2>{stats?.averageWaitTime || 0}m</h2>
                            </div>
                            <div className="stat-trend down">-5m</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Currently Serving</span>
                                <h2>{stats?.activeQueues || 0}</h2>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Satisfaction</span>
                                <h2>{stats?.averageSatisfaction || 0}/5</h2>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card large">
                            <div className="chart-header">
                                <h3>Hourly Traffic Flow</h3>
                                <span>Real-time updates</span>
                            </div>
                            <div className="chart-body">
                                <Line data={lineData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                        <div className="chart-card small">
                            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Service Distribution</h3>
                                <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                    <button 
                                        onClick={() => setDistView('today')}
                                        style={{ padding: '4px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: distView === 'today' ? 'white' : 'transparent', color: distView === 'today' ? '#1e293b' : '#64748b', boxShadow: distView === 'today' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                                    >
                                        Today
                                    </button>
                                    <button 
                                        onClick={() => setDistView('weekly')}
                                        style={{ padding: '4px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: distView === 'weekly' ? 'white' : 'transparent', color: distView === 'weekly' ? '#1e293b' : '#64748b', boxShadow: distView === 'weekly' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                                    >
                                        Weekly
                                    </button>
                                </div>
                            </div>
                            <div className="chart-body">
                                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>

                    <div className="recent-activity">
                        <h3>Live Queue Status</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>Service</th>
                                    <th>Counter</th>
                                    <th>Status</th>
                                    <th>Wait Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentTickets?.length > 0 ? (
                                    stats.recentTickets.map(ticket => (
                                        <tr key={ticket._id}>
                                            <td>{ticket.ticketNumber}</td>
                                            <td>{ticket.service?.name}</td>
                                            <td>{ticket.counter ? `Counter ${ticket.counter.number}` : 'Unassigned'}</td>
                                            <td>
                                                <span className={`badge ${ticket.status}`}>
                                                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{ticket.estimatedWaitTime || 0}m</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No recent activity found today.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
