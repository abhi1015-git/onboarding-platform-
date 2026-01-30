import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Plus, Clock, Video, Users, ExternalLink,
    MoreVertical, CheckCircle, Search, Filter, ArrowRight, FileText, Loader2, X, MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const HROrientations = () => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        type: 'Virtual',
        location: 'Zoom'
    });
    const [editingSession, setEditingSession] = useState(null);
    const [stats, setStats] = useState([
        { label: 'Total Scheduled', value: '0', icon: Calendar, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Upcoming Today', value: '0', icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Completed', value: '0', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
        { label: 'Total Attendees', value: '0', icon: Users, color: '#8b5cf6', bg: '#f3e8ff' }
    ]);

    useEffect(() => {
        fetchOrientations();
    }, []);

    const fetchOrientations = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orientations')
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                if (error.code === '42P01') {
                    console.warn('Orientations table not found, using mock data.');
                    setSessions([
                        { id: 1, title: 'Company Culture & Values', date: '2024-02-15', time: '10:00 AM', type: 'Virtual', location: 'Zoom', attendees: 5 },
                        { id: 2, title: 'IT & Security Workshop', date: '2024-02-16', time: '02:00 PM', type: 'Virtual', location: 'Teams', attendees: 3 },
                        { id: 3, title: 'Benefits & Payroll Overview', date: '2024-02-18', time: '11:30 AM', type: 'In-Person', location: 'Meeting Room A', attendees: 8 }
                    ]);
                } else throw error;
            } else if (data) {
                setSessions(data);
                const upcoming = data.filter(s => new Date(s.date) >= new Date()).length;
                setStats([
                    { label: 'Total Scheduled', value: data.length.toString(), icon: Calendar, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Upcoming', value: upcoming.toString(), icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
                    { label: 'Completed', value: '0', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Total Attendees', value: (data.length * 4).toString(), icon: Users, color: '#8b5cf6', bg: '#f3e8ff' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching orientations:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        setIsScheduling(true);
        try {
            if (editingSession) {
                const { error } = await supabase
                    .from('orientations')
                    .update(formData)
                    .eq('id', editingSession.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('orientations')
                    .insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            setEditingSession(null);
            setFormData({ title: '', date: new Date().toISOString().split('T')[0], time: '10:00 AM', type: 'Virtual', location: 'Zoom' });
            fetchOrientations();
        } catch (error) {
            console.error('Error saving orientation:', error.message);
            alert('Failed to save session: ' + error.message);
        } finally {
            setIsScheduling(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this session?')) return;
        try {
            const { error } = await supabase
                .from('orientations')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchOrientations();
        } catch (error) {
            alert('Error deleting session: ' + error.message);
        }
    };

    const openEditModal = (session) => {
        setEditingSession(session);
        setFormData({
            title: session.title,
            date: session.date,
            time: session.time,
            type: session.type,
            location: session.location
        });
        setIsModalOpen(true);
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return {
            day: d.getDate(),
            month: d.toLocaleString('default', { month: 'short' }).toUpperCase()
        };
    };

    return (
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Orientations</h1>
                    <p className="page-subtitle" style={{ fontSize: '1.125rem', color: '#64748b', marginTop: '0.5rem' }}>Coordinate and manage newcomer welcome sessions.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.875rem 1.75rem', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                        border: 'none', fontWeight: 700
                    }}
                >
                    <Plus size={20} /> Schedule Session
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="stat-card glass"
                        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        </div>
                        <div style={{ padding: '0.875rem', borderRadius: '14px', background: stat.bg, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
                <div>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.625rem', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
                                <Calendar size={22} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Upcoming Sessions</h3>
                            <span style={{ background: '#3b82f6', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '99px' }}>{sessions.length}</span>
                        </div>

                        {isLoading ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto' }} /></div>
                        ) : sessions.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <Calendar size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: '#64748b', fontWeight: 500 }}>No sessions scheduled yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {sessions.map((session, index) => {
                                    const dateObj = formatDate(session.date);
                                    return (
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', padding: '1.5rem',
                                                borderRadius: '20px', border: '1px solid #f1f5f9', background: '#f8fafc',
                                                gap: '2rem', transition: 'all 0.2s'
                                            }}
                                            className="hover-card"
                                        >
                                            <div style={{
                                                width: '70px', height: '70px', borderRadius: '18px',
                                                background: 'white', border: '1px solid #e2e8f0',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{dateObj.day}</div>
                                                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginTop: '4px' }}>{dateObj.month}</div>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#1e293b', marginBottom: '0.5rem' }}>{session.title}</div>
                                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Clock size={16} color="#3b82f6" /> {session.time}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {session.type?.toLowerCase() === 'virtual' ? <Video size={16} color="#10b981" /> : <Users size={16} color="#f59e0b" />}
                                                        {session.location || 'Virtual Session'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => openEditModal(session)}
                                                    className="btn-secondary"
                                                    style={{ padding: '0.625rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700 }}
                                                >
                                                    Manage
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(session.id)}
                                                    style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', cursor: 'pointer' }}
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar">
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem' }}>Weekly Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{sessions.length}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>Planned</div>
                            </div>
                            <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>{sessions.length > 0 ? (sessions.length * 0.8).toFixed(0) : 0}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>Confirmed</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px', background: '#eff6ff', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: '#1e40af' }}>
                            <FileText size={20} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Coordinator Tips</h3>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9375rem', color: '#1e40af', fontWeight: 600 }}>
                            <li style={{ display: 'flex', gap: '0.75rem' }}><CheckCircle size={16} /> Send invites 3 days prior</li>
                            <li style={{ display: 'flex', gap: '0.75rem' }}><CheckCircle size={16} /> Attach agenda to calendar</li>
                            <li style={{ display: 'flex', gap: '0.75rem' }}><CheckCircle size={16} /> Record virtual sessions</li>
                            <li style={{ display: 'flex', gap: '0.75rem' }}><CheckCircle size={16} /> Send follow-up survey</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        padding: '2rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{
                                background: 'white', borderRadius: '28px', width: '100%', maxWidth: '500px',
                                padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Schedule Session</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Create a new orientation event for candidates.</p>

                            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Session Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="e.g. Product Demo & Strategy"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="form-input"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Time</label>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            placeholder="10:00 AM"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Type</label>
                                        <select
                                            className="form-input"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}
                                        >
                                            <option value="Virtual">Virtual</option>
                                            <option value="In-Person">In-Person</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Location/Link</label>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            placeholder="Zoom / Room A"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isScheduling}
                                        className="btn-primary"
                                        style={{
                                            flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        {isScheduling ? <Loader2 className="animate-spin" size={20} /> : 'Create Session'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HROrientations;
