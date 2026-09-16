import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import './AdminDashboard.css';
import './AdminFeedbacks.css';
import Sidebar from '../../components/Sidebar';

const AdminFeedbacks = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/feedbacks');
            setFeedbacks(res.data);
        } catch (err) {
            console.error('Error fetching feedbacks', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();

        // Mark all feedbacks as read when admin opens this page
        const markAsRead = async () => {
            try {
                await api.put('/admin/feedbacks/mark-read');
            } catch (err) {
                console.error('Failed to mark feedbacks as read');
            }
        };
        markAsRead();
    }, []);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleReply = async (feedbackId) => {
        if (!replyText.trim()) return;
        try {
            const res = await api.put(`/admin/feedback/${feedbackId}/reply`, { reply: replyText });
            setFeedbacks(feedbacks.map(fb => fb._id === feedbackId ? { ...fb, reply: res.data.reply } : fb));
            showToast('Reply sent successfully', 'success');
            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error('Error replying to feedback', err);
            showToast('Failed to send reply', 'error');
        }
    };

    const handleClearAll = async () => {
        try {
            await api.delete('/admin/feedbacks');
            showToast('All feedbacks cleared', 'success');
            setFeedbacks([]);
            setShowClearConfirm(false);
        } catch (err) {
            showToast('Failed to clear feedbacks', 'error');
        }
    };

    return (
        <div className="admin-container">
            <Sidebar />

            <main className="admin-main">
                <div className="admin-content admin-feedbacks-container">
                    <header className="feedbacks-header-row">
                        <div className="feedbacks-header-left">
                            <h1>Customer Feedbacks</h1>
                            <p>Anonymous reviews and service ratings from citizens.</p>
                        </div>
                        <button className="btn-clear-feedbacks" onClick={() => setShowClearConfirm(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            Clear All History
                        </button>
                    </header>

                    <div className="feedbacks-table-card">
                        <table className="feedbacks-table">
                            <thead>
                                <tr>
                                    <th>Submission Date</th>
                                    <th>Source</th>
                                    <th>Rating</th>
                                    <th>Customer Experience</th>
                                    <th>Officer Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="table-loading">
                                            <div className="spinner"></div>
                                            Loading feedbacks...
                                        </td>
                                    </tr>
                                ) : feedbacks.length > 0 ? (
                                    feedbacks.map(fb => (
                                        <tr key={fb._id}>
                                            <td className="date-cell">{formatDate(fb.createdAt)}</td>
                                            <td>
                                                <div className="anonymous-user">
                                                    <div className="anon-avatar">?</div>
                                                    <span>Verified Customer</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`rating-chip rating-${fb.rating}`}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                    </svg>
                                                    {fb.rating}.0
                                                </div>
                                            </td>
                                            <td className="comment-cell">
                                                <div className="comment-bubble">
                                                    {fb.comments || "No comments provided"}
                                                </div>
                                            </td>
                                            <td className="reply-cell">
                                                {fb.reply ? (
                                                    <div className="admin-reply-box">
                                                        <div className="reply-tag">RESPONSE</div>
                                                        {fb.reply}
                                                    </div>
                                                ) : replyingTo === fb._id ? (
                                                    <div className="reply-form-active">
                                                        <textarea 
                                                            value={replyText} 
                                                            onChange={(e) => setReplyText(e.target.value)} 
                                                            placeholder="Compose professional response..."
                                                        />
                                                        <div className="reply-btn-row">
                                                            <button className="btn-send-reply" onClick={() => handleReply(fb._id)}>Send</button>
                                                            <button className="btn-cancel-reply" onClick={() => {setReplyingTo(null); setReplyText('');}}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="btn-reply-action" onClick={() => setReplyingTo(fb._id)}>
                                                        Reply to Feedback
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="table-empty-state">
                                            <div className="empty-icon">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1">
                                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                                </svg>
                                            </div>
                                            <h3>Inbox Zero</h3>
                                            <p>No feedback has been submitted by customers yet.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showClearConfirm && (
                    <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                        <div className="premium-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="confirm-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h2>Wipe Feedback History?</h2>
                            <p>This will permanently delete all customer feedback and your responses. This action is irreversible.</p>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                                <button className="btn-confirm-delete" onClick={handleClearAll}>Yes, Clear All</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminFeedbacks;
