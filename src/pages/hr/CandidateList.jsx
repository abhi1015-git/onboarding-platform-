import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Mail, UserPlus, MoreHorizontal, Download, Trash2, Loader2, MapPin, Briefcase } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const CandidateList = () => {
    const [searchParams] = useSearchParams();
    const initialFilter = searchParams.get('filter') || 'all';

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(initialFilter);
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const userPortal = localStorage.getItem('user_portal_id') || 'hr';
    const basePath = userPortal === 'hr' ? '/hr' : '/admin';

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
            setCandidates(data || []);
        } catch (error) {
            console.error('Error fetching candidates:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const styles = {
            'Pending': { bg: '#fff7ed', text: '#9a3412', border: '#ffedd5' },
            'Offer Sent': { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' },
            'Offer Accepted': { bg: '#f0fdf4', text: '#166534', border: '#dcfce7' },
            'Documents Pending': { bg: '#fef2f2', text: '#991b1b', border: '#fee2e2' },
            'Verification Pending': { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
            'IT Setup Pending': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
            'IT Provisioning': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }, // Light Blue
            'IT Completed': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }, // Green-ish (Ready for next step)
            'Completed': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
            'HR Review': { bg: '#f5f3ff', text: '#5b21b6', border: '#ede9fe' }
        };
        return styles[status] || { bg: '#f8fafc', text: '#475569', border: '#f1f5f9' };
    };

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch =
            (candidate.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (candidate.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (candidate.position || '').toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = filterStatus === 'all' || candidate.status === filterStatus;

        if (filterStatus === 'active') {
            matchesFilter = candidate.status !== 'Completed';
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Candidates</h1>
                    <p className="page-subtitle" style={{ fontSize: '1.125rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Manage and track your onboarding pipeline of {candidates.length} candidates.
                    </p>
                </div>
                <button
                    onClick={() => navigate(`${basePath}/candidates/add`)}
                    className="btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1.5rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <UserPlus size={20} /> Add New Candidate
                </button>
            </div>

            {/* Toolbar */}
            <div className="glass" style={{
                padding: '1.25rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email or position..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1rem 0.875rem 3rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Filter size={20} color="#64748b" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '0.875rem 2.5rem 0.875rem 1.25rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '0.9375rem',
                            appearance: 'none',
                            background: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            color: '#475569',
                            fontWeight: 500
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Onboarding</option>
                        <option value="Pending">Pending</option>
                        <option value="Offer Accepted">Offer Accepted</option>
                        <option value="Documents Pending">Documents Pending</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Content Section */}
            <div className="glass" style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                {isLoading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto', color: '#3b82f6' }} />
                        <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>Fetching candidates...</p>
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#f8fafc',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 1.5rem'
                        }}>
                            <Search size={32} color="#94a3b8" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>No candidates found</h3>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Info</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role & Dept</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredCandidates.map((candidate, index) => {
                                    const statusStyle = getStatusStyle(candidate.status);
                                    return (
                                        <motion.tr
                                            key={candidate.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.03 }}
                                            style={{ borderBottom: '1px solid #f1f5f9' }}
                                            className="table-row-hover"
                                        >
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '44px', height: '44px', borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 800, color: '#475569', fontSize: '1.125rem'
                                                    }}>
                                                        {candidate.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{candidate.full_name}</div>
                                                        <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                                                            <Mail size={12} /> {candidate.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#334155' }}>{candidate.position}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                                                    <Briefcase size={12} /> {candidate.department}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', width: '200px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Overall</span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>{candidate.progress || 0}%</span>
                                                </div>
                                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${candidate.progress || 0}%` }}
                                                        style={{ height: '100%', background: '#3b82f6', borderRadius: '3px' }}
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{
                                                    padding: '0.375rem 0.875rem',
                                                    borderRadius: '99px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    background: statusStyle.bg,
                                                    color: statusStyle.text,
                                                    border: `1px solid ${statusStyle.border}`,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.375rem'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.text }}></div>
                                                    {candidate.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => navigate(`${basePath}/candidates/${candidate.id}`)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                            background: 'white',
                                                            color: '#475569',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <Eye size={14} /> Profile
                                                    </button>
                                                    <button style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        background: 'white',
                                                        color: '#94a3b8',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CandidateList;
