/**
 * ============================================================================
 * REPORTS & ANALYTICS PAGE (Super Admin)
 * ============================================================================
 * A detailed analytical view for the Super Admin.
 * Displays wait times, completion rates, service performance distributions, 
 * and handles UI logic for exporting data into standard formats (PDF, Excel).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Reports.css';
import './AdminDashboard.css';
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
import { Bar, Doughnut } from 'react-chartjs-2';
import Sidebar from '../../components/Sidebar';

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

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('daily_summary');
    const [exportFormat, setExportFormat] = useState('PDF');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, servicesRes] = await Promise.all([
                    api.get('/admin/analytics'),
                    api.get('/admin/services')
                ]);
                setStats(analyticsRes.data);
                setServices(servicesRes.data);

                // Try to fetch feedbacks
                try {
                    const fbRes = await api.get('/admin/users');
                    // We don't have a feedback endpoint yet, so we'll use recent tickets
                } catch (e) {}
            } catch (err) {
                console.error('Failed to fetch report data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleGenerate = () => {
        alert(`Generating ${reportType.replace(/_/g, ' ')} report as ${exportFormat}... This feature will be available soon.`);
    };

    // Weekly bar chart data
    const barData = {
        labels: stats?.serviceLabels || [],
        datasets: [{
            label: 'This Week',
            data: stats?.serviceDistributionWeekly || [],
            backgroundColor: '#4f46e5',
            borderRadius: 8
        }, {
            label: 'Today',
            data: stats?.serviceDistributionToday || [],
            backgroundColor: '#00cc66',
            borderRadius: 8
        }]
    };

    const barOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
        }
    };

    // Service performance doughnut
    const doughnutData = {
        labels: stats?.serviceLabels || [],
        datasets: [{
            data: stats?.serviceDistributionWeekly || [],
            backgroundColor: ['#4f46e5', '#0066cc', '#00cc66', '#ff9933', '#8b5cf6', '#ec4899', '#06b6d4']
        }]
    };

    const completionRate = stats ? (stats.completedTickets && stats.totalTickets 
        ? ((stats.completedTickets / stats.totalTickets) * 100).toFixed(1) 
        : 0) : 0;

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">
                <div className="rep-container">
                    <div className="rep-header">
                        <div className="rep-header-left">
                            <h1>Reports & Analytics</h1>
                            <p>Comprehensive insights into department performance and citizen services.</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="rep-summary-cards">
                        <div className="rep-summary-card">
                            <span>Total Tickets Today</span>
                            <h2>{stats?.totalTickets || 0}</h2>
                            <span className="rep-sub">All services combined</span>
                        </div>
                        <div className="rep-summary-card">
                            <span>Completion Rate</span>
                            <h2>{completionRate}%</h2>
                            <span className="rep-sub">Completed vs total</span>
                        </div>
                        <div className="rep-summary-card">
                            <span>Avg. Wait Time</span>
                            <h2>{stats?.averageWaitTime || 0}m</h2>
                            <span className="rep-sub">Across all counters</span>
                        </div>
                        <div className="rep-summary-card">
                            <span>Satisfaction</span>
                            <h2>{stats?.averageSatisfaction || 0}/5</h2>
                            <span className="rep-sub">Customer feedback</span>
                        </div>
                    </div>

                    {/* Charts + Config */}
                    <div className="rep-layout">
                        <div className="rep-card">
                            <h3>Service Comparison — Weekly vs Today</h3>
                            <div className="rep-chart-area">
                                {stats ? (
                                    <Bar data={barData} options={barOptions} />
                                ) : (
                                    <div className="rep-empty"><p>Loading chart data...</p></div>
                                )}
                            </div>
                        </div>
                        <div className="rep-card rep-config">
                            <h3>Generate Report</h3>
                            <div className="rep-group">
                                <label>Report Type</label>
                                <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                    <option value="daily_summary">Daily Summary</option>
                                    <option value="wait_times">Wait Time Analysis</option>
                                    <option value="service_perf">Service Performance</option>
                                    <option value="citizen_feedback">Customer Feedback</option>
                                </select>
                            </div>
                            <div className="rep-group">
                                <label>Date Range</label>
                                <div className="rep-date-row">
                                    <input type="date" />
                                    <input type="date" />
                                </div>
                            </div>
                            <div className="rep-group">
                                <label>Export Format</label>
                                <div className="format-options">
                                    {['PDF', 'Excel', 'CSV'].map(fmt => (
                                        <button
                                            key={fmt}
                                            className={`format-btn ${exportFormat === fmt ? 'active' : ''}`}
                                            onClick={() => setExportFormat(fmt)}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="btn-generate" onClick={handleGenerate}>
                                Generate Report
                            </button>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="rep-bottom-grid">
                        <div className="rep-card">
                            <h3>Service Performance</h3>
                            {services.length > 0 ? (
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table className="rep-service-table">
                                        <thead>
                                            <tr>
                                                <th>Service</th>
                                                <th>Prefix</th>
                                                <th>Today</th>
                                                <th>Waiting</th>
                                                <th>Counters</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {services.map(s => (
                                                <tr key={s._id}>
                                                    <td><strong>{s.name}</strong></td>
                                                    <td>{s.prefix}</td>
                                                    <td>{s.todayTickets || 0}</td>
                                                    <td>{s.waitingCount || 0}</td>
                                                    <td>{s.countersCount || 0}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '3px 10px',
                                                            borderRadius: '100px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            background: s.isActive ? '#e6ffef' : '#f1f5f9',
                                                            color: s.isActive ? '#00cc66' : '#94a3b8'
                                                        }}>
                                                            {s.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rep-empty"><p>No services data available.</p></div>
                            )}
                        </div>
                        <div className="rep-card">
                            <h3>Service Share (This Week)</h3>
                            <div className="rep-chart-area">
                                {stats ? (
                                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } } } }} />
                                ) : (
                                    <div className="rep-empty"><p>Loading chart...</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Reports;
