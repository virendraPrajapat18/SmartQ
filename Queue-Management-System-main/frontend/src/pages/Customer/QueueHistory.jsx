import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';
import './QueueHistory.css';

const QueueHistory = () => {
    const { logout } = useContext(AuthContext);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const t = translations[language] || translations.en;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/queue/history');
                setHistoryData(res.data);
            } catch (err) {
                console.log('Failed to fetch history');
                // Mock data if API fails
                setHistoryData([
                    { createdAt: new Date(), ticketNumber: 'GC-102', service: { name: 'General Consultation' }, counter: { number: 4 }, status: 'completed' },
                    { createdAt: new Date(Date.now() - 86400000), ticketNumber: 'AB-055', service: { name: 'Account & Billing' }, counter: { number: 1 }, status: 'completed' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="history-container">
            <Navbar activePage="history" />

            <div className="container">
                <div className="hist-title-section">
                    <h1>{t.hist_title}</h1>
                    <p>{t.hist_desc}</p>
                </div>
            </div>

            <main className="container hist-grid">
                <div className="hist-main-area">
                    <div className="glass-card table-section">
                        <div className="card-header">
                            <h2>Recent Activity</h2>
                            <button className="btn-icon-text">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Export Data
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="hist-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Ticket</th>
                                        <th>Service</th>
                                        <th>Counter</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center">Loading...</td></tr>
                                    ) : historyData.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">No history found</td></tr>
                                    ) : historyData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td><span className="ticket-id">{item.ticketNumber}</span></td>
                                            <td>{item.service?.name || '---'}</td>
                                            <td>{item.counter?.number ? `C-${item.counter.number}` : '---'}</td>
                                            <td>
                                                <span className={`status-badge ${item.status.toLowerCase()}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>


                <aside className="hist-sidebar-area">
                    <div className="glass-card side-widget overview-widget">
                        <div className="widget-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <h3>Overview</h3>
                        <div className="overview-stats">
                            <div className="ov-item">
                                <span className="ov-label">Total Visits</span>
                                <span className="ov-value">{historyData.length}</span>
                            </div>
                            <div className="ov-item">
                                <span className="ov-label">Frequent Service</span>
                                <span className="ov-value">
                                    {historyData.length > 0 
                                        ? Object.entries(historyData.reduce((acc, item) => {
                                            const name = item.service?.name || 'Other';
                                            acc[name] = (acc[name] || 0) + 1;
                                            return acc;
                                          }, {})).sort((a, b) => b[1] - a[1])[0][0]
                                        : '---'}
                                </span>
                            </div>
                            <div className="ov-item">
                                <span className="ov-label">Last Visit</span>
                                <span className="ov-value">
                                    {historyData.length > 0 
                                        ? new Date(Math.max(...historyData.map(d => new Date(d.createdAt)))).toLocaleDateString()
                                        : '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                </aside>
            </main>


        </div>
    );
};

export default QueueHistory;
