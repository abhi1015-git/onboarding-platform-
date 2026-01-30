import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Users, Clock, CheckCircle, Search, Plus,
    ChevronRight, FileText, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const HRDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: 'Total Candidates', value: '0', growth: '+0%', icon: Users, color: '#3b82f6', bg: '#eff6ff', filter: 'all' },
        { label: 'Active Onboarding', value: '0', growth: '+0%', icon: Clock, color: '#f59e0b', bg: '#fef3c7', filter: 'active' },
        { label: 'Completed', value: '0', growth: '+0%', icon: CheckCircle, color: '#10b981', bg: '#d1fae5', filter: 'Completed' },
        { label: 'Pending Docs', value: '0', growth: '+0%', icon: FileText, color: '#ef4444', bg: '#fee2e2', filter: 'Documents Pending' }
    ]);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setCandidates(data);
                // Simple stat calculation
                const total = data.length;
                const active = data.filter(c => c.status !== 'Completed').length;
                const completed = data.filter(c => c.status === 'Completed').length;
                const pending = data.filter(c => c.status === 'Documents Pending' || c.status === 'Pending').length;

                setStats(prev => [
                    { ...prev[0], value: total.toString() },
                    { ...prev[1], value: active.toString() },
                    { ...prev[2], value: completed.toString() },
                    { ...prev[3], value: pending.toString() }
                ]);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(cand =>
        (cand.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cand.position || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>HR Dashboard</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>Overview of all candidate onboarding activities.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/hr/candidates/add" className="btn-primary" style={{ borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Add Candidate
                    </Link>
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
                        onClick={() => navigate(`/hr/candidates?filter=${stat.filter}`)}
                        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                        whileHover={{ y: -5, scale: 1.02 }}
                    >
                        <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: '0.5rem' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.75rem', color: stat.growth.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                {stat.growth} <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs last month</span>
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: stat.bg, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="section-card glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>Recent Candidates</h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search name, role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', width: '300px', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <th style={{ padding: '0 1rem' }}>Candidate</th>
                                <th style={{ padding: '0 1rem' }}>Position</th>
                                <th style={{ padding: '0 1rem' }}>Progress</th>
                                <th style={{ padding: '0 1rem' }}>Status</th>
                                <th style={{ padding: '0 1rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#3b82f6' }} />
                                        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Loading candidates...</p>
                                    </td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        No candidates found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCandidates.map((cand, index) => (
                                    <motion.tr
                                        key={cand.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
                                    >
                                        <td style={{ padding: '1.25rem 1rem', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.8125rem' }}>
                                                    {cand.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>{cand.full_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{new Date(cand.joining_date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569' }}>{cand.position}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{cand.department}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', width: '200px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b' }}>{cand.progress || 0}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${cand.progress || 0}%`, background: cand.progress === 100 ? '#10b981' : '#3b82f6', borderRadius: '3px' }}></div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <span style={{
                                                padding: '0.375rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                                                background: cand.status === 'Completed' ? '#d1fae5' : '#eff6ff',
                                                color: cand.status === 'Completed' ? '#065f46' : '#3b82f6'
                                            }}>
                                                {cand.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                                            <Link to={`/hr/candidates/${cand.id}`} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                                                <ChevronRight size={18} />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
