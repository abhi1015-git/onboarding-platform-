import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const RequestManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('it_requests')
                .select('*, candidates(*)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                if (error.code === '42P01') {
                    console.warn('it_requests table not found. Please run the database setup script.');
                    alert('IT Requests table not found. Please run COMPLETE_FIX.sql in Supabase.');
                } else {
                    alert('Error loading IT requests: ' + error.message);
                }
                setRequests([]);
            } else {
                setRequests(data || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            alert('Failed to load IT requests. Check console for details.');
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRequests = requests.filter(request => {
        const candidateName = request.candidates?.full_name || '';
        const department = request.candidates?.department || '';

        const matchesSearch = candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>IT Requests</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>View and process incoming asset requests</p>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '0.625rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', background: 'white' }}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="section-card glass" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto' }} />
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Requested</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No requests found.</td></tr>
                            ) : (
                                filteredRequests.map((request, index) => (
                                    <motion.tr
                                        key={request.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        style={{ borderBottom: '1px solid #f8fafc' }}
                                    >
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>
                                                    {request.candidates?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>{request.candidates?.full_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{request.candidates?.position} • {request.candidates?.department}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{request.items}</td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase',
                                                background: request.priority === 'high' ? '#fee2e2' : request.priority === 'medium' ? '#fef3c7' : '#f1f5f9',
                                                color: request.priority === 'high' ? '#ef4444' : request.priority === 'medium' ? '#d97706' : '#64748b'
                                            }}>
                                                {request.priority}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.375rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                                                background: request.status === 'completed' ? '#d1fae5' : '#fef3c7',
                                                color: request.status === 'completed' ? '#065f46' : '#92400e',
                                                display: 'flex', alignItems: 'center', gap: '0.375rem', width: 'fit-content'
                                            }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                                {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <Link to={`/it/requests/${request.id}`} style={{
                                                padding: '0.5rem 1rem', background: '#3b82f6', color: 'white',
                                                textDecoration: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                                            }}>
                                                <Eye size={14} /> Process
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default RequestManagement;
