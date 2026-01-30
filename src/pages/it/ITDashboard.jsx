import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Laptop, Clock, AlertCircle, CheckCircle, Search, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ITDashboard = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: 'Total Requests', value: '0', subtitle: '0 pending', icon: Laptop, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Pending', value: '0', subtitle: 'Need action', icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
        { label: 'In Progress', value: '0', subtitle: 'Being worked on', icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
        { label: 'Completed', value: '0', subtitle: 'All done', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' }
    ]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            // Fetch IT requests with candidate information
            const { data, error } = await supabase
                .from('it_requests')
                .select(`
                    *,
                    candidates (
                        id,
                        full_name,
                        email,
                        position,
                        department,
                        progress,
                        it_status
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const processed = data.map(req => ({
                    id: req.id,
                    candidateId: req.candidate_id,
                    name: req.candidates?.full_name || 'Unknown',
                    role: `${req.candidates?.position || 'N/A'} • ${req.candidates?.department || 'N/A'}`,
                    progress: req.candidates?.progress || 0,
                    status: req.status === 'completed' ? 'Completed' :
                        req.status === 'in_progress' ? 'In Progress' : 'Pending',
                    avatarColor: '#3b82f6',
                    requestType: req.request_type,
                    priority: req.priority
                }));

                setRequests(processed);

                // Calculate stats
                const total = processed.length;
                const pending = processed.filter(r => r.status === 'Pending').length;
                const inProgress = processed.filter(r => r.status === 'In Progress').length;
                const completed = processed.filter(r => r.status === 'Completed').length;

                setStats(prev => [
                    { ...prev[0], value: total.toString(), subtitle: `${pending} pending` },
                    { ...prev[1], value: pending.toString() },
                    { ...prev[2], value: inProgress.toString() },
                    { ...prev[3], value: completed.toString() }
                ]);
            }
        } catch (error) {
            console.error('Error fetching IT requests:', error.message);
            alert('Error loading IT requests: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCredentials = async (requestId) => {
        // Navigate directly to the request detail page
        navigate(`/it/requests/${requestId}`);
    };

    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.role?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>IT Portal</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>Manage onboarding IT requests and setup</p>
                </div>
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
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ padding: '0.625rem', borderRadius: '10px', background: stat.bg, color: stat.color, width: 'fit-content', marginBottom: '1.25rem' }}>
                            <stat.icon size={20} />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b' }}>{stat.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{stat.subtitle}</div>
                    </motion.div>
                ))}
            </div>

            <div className="section-card glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.375rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        {['All', 'Pending', 'In Progress', 'Completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                style={{
                                    padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
                                    background: filter === tab ? '#3b82f6' : 'transparent',
                                    color: filter === tab ? 'white' : '#64748b',
                                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', width: '300px', fontSize: '0.875rem', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>IT Requests ({filteredRequests.length})</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#3b82f6' }} />
                            <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No requests found.
                        </div>
                    ) : (
                        filteredRequests.map((req, index) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    display: 'flex', alignItems: 'center', padding: '1.25rem',
                                    background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', gap: '1.5rem'
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: req.avatarColor, color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '1rem'
                                }}>
                                    {req.name?.charAt(0).toUpperCase()}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>{req.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{req.role}</div>
                                </div>

                                <div style={{ width: '180px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>Progress</span>
                                        <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700 }}>{req.progress}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${req.progress}%`, background: req.progress === 100 ? '#10b981' : '#f59e0b', borderRadius: '3px' }}></div>
                                    </div>
                                </div>

                                <div style={{ width: '150px', textAlign: 'right' }}>
                                    {req.status === 'Completed' ? (
                                        <span style={{ padding: '0.375rem 0.875rem', borderRadius: '99px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Completed
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', padding: '0.375rem 0.875rem', borderRadius: '99px' }}>Pending</span>
                                            <button
                                                onClick={() => handleCreateCredentials(req.id)}
                                                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Create Credentials
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ITDashboard;
