import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, Trash2, Loader2, Info, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Notifications = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [candidateId, setCandidateId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const candidateId = localStorage.getItem('candidate_id');
            if (!candidateId) {
                // If checking notifications failed due to no ID, we might not want to hard redirect if this is a component used elsewhere, 
                // but for a page it's safer. However, since this page is behind login...
                // Let's safe guard.
                setNotifications([]);
                setIsLoading(false);
                return;
            }
            setCandidateId(candidateId);

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error.message);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error.message);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('candidate_id', candidateId);

            if (error) throw error;
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error.message);
        }
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Notifications</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>Stay updated with your onboarding progress.</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="btn-secondary"
                        style={{ borderRadius: '10px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AnimatePresence mode="popLayout">
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ padding: '5rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1.5rem', border: '1px dashed #e2e8f0' }}
                        >
                            <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <Bell size={32} color="#94a3b8" />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>All Caught Up!</h3>
                            <p style={{ color: '#64748b', fontWeight: 500 }}>You don't have any new notifications at the moment.</p>
                        </motion.div>
                    ) : (
                        notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className={`notif-card ${notif.is_read ? 'read' : 'unread'}`}
                                style={{
                                    display: 'flex', gap: '1.25rem', padding: '1.5rem',
                                    background: notif.is_read ? 'rgba(255, 255, 255, 0.6)' : 'white',
                                    border: '1px solid',
                                    borderColor: notif.is_read ? '#f1f5f9' : '#e2e8f0',
                                    borderRadius: '1.25rem',
                                    boxShadow: notif.is_read ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {!notif.is_read && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#3b82f6' }} />
                                )}

                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: notif.type === 'alert' ? '#fef2f2' : '#eff6ff',
                                    color: notif.type === 'alert' ? '#ef4444' : '#3b82f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {notif.type === 'alert' ? <AlertCircle size={22} /> : <Info size={22} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: notif.is_read ? '#64748b' : '#1e293b' }}>
                                            {notif.title}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                                            <Clock size={14} /> {new Date(notif.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.5, fontWeight: 500 }}>
                                        {notif.message}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                                    {!notif.is_read && (
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}
                                            title="Mark as read"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notif.id)}
                                        style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#ef4444', cursor: 'pointer' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Notifications;
