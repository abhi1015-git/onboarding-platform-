import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Search, Filter, CheckCircle, Clock, AlertCircle,
    MoreHorizontal, Eye, Check, X, User, Loader2, Download, Trash2, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const HRDocuments = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, docId: null, reason: '' });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('candidate_documents')
                .select('*, candidates(full_name)');

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id, newStatus, reason = null) => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'Rejected') updateData.rejection_reason = reason;
            else updateData.rejection_reason = null;

            const { error: updateError } = await supabase
                .from('candidate_documents')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            // Update local state
            setDocuments(docs => docs.map(doc =>
                doc.id === id ? { ...doc, status: newStatus, rejection_reason: reason } : doc
            ));

            if (newStatus === 'Rejected') {
                setRejectionModal({ isOpen: false, docId: null, reason: '' });
            }

            // Check if all documents for this candidate are now verified
            const docBeingUpdated = documents.find(d => d.id === id);
            if (docBeingUpdated && docBeingUpdated.candidate_id) {
                const candId = docBeingUpdated.candidate_id;
                const { data: allDocs } = await supabase
                    .from('candidate_documents')
                    .select('status')
                    .eq('candidate_id', candId);

                if (allDocs && allDocs.length >= 6 && allDocs.every(d => d.status === 'Verified')) {
                    await supabase.from('candidates').update({ progress: 80 }).eq('id', candId);
                }
            }
        } catch (error) {
            console.error('Action error:', error.message);
            alert('Failed to update document status');
        }
    };

    const handleVerifyAll = async (candidateName) => {
        if (!confirm(`Verify ALL documents for ${candidateName}?`)) return;

        try {
            const candDocs = documents.filter(d => d.candidates?.full_name === candidateName);
            if (candDocs.length === 0) return;

            const { error: updateError } = await supabase
                .from('candidate_documents')
                .update({ status: 'Verified', rejection_reason: null })
                .eq('candidate_id', candDocs[0].candidate_id);

            if (updateError) throw updateError;

            setDocuments(docs => docs.map(doc =>
                (doc.candidates?.full_name === candidateName) ? { ...doc, status: 'Verified', rejection_reason: null } : doc
            ));

            await supabase.from('candidates').update({ progress: 80 }).eq('id', candDocs[0].candidate_id);
            alert('All documents verified and candidate progress updated.');
        } catch (error) {
            console.error('Verify all error:', error.message);
        }
    };

    const filteredDocs = documents.filter(doc => {
        const candName = doc.candidates?.full_name || '';
        const matchesCandidate = selectedCandidate === 'all' || candName === selectedCandidate;
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        const matchesSearch = doc.doc_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.doc_type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCandidate && matchesStatus && matchesSearch;
    });

    const stats = [
        { label: 'Total Files', value: documents.length.toString(), icon: FileText, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Pending', value: documents.filter(d => d.status === 'Pending').length.toString(), icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Verified', value: documents.filter(d => d.status === 'Verified').length.toString(), icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
        { label: 'Issues', value: documents.filter(d => d.status === 'Rejected').length.toString(), icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' }
    ];

    const uniqueCandidateNames = [...new Set(documents.map(d => d.candidates?.full_name))].filter(Boolean);

    return (
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Document Center</h1>
                    <p className="page-subtitle" style={{ fontSize: '1.125rem', color: '#64748b', marginTop: '0.5rem' }}>Verify and manage employee documentation securely.</p>
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
                        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        </div>
                        <div style={{ padding: '0.875rem', borderRadius: '14px', background: stat.bg, color: stat.color }}>
                            <stat.icon size={26} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
                {/* Left Sidebar */}
                <aside>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <User size={16} color="#3b82f6" /> Candidates
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <button
                                onClick={() => setSelectedCandidate('all')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.875rem 1rem', borderRadius: '12px', border: 'none',
                                    background: selectedCandidate === 'all' ? '#eff6ff' : 'transparent',
                                    color: selectedCandidate === 'all' ? '#3b82f6' : '#64748b',
                                    cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: selectedCandidate === 'all' ? 800 : 500, fontSize: '0.9375rem',
                                    textAlign: 'left'
                                }}
                            >
                                All Documents
                            </button>
                            {isLoading ? (
                                <div style={{ padding: '1rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={20} color="#94a3b8" /></div>
                            ) : (
                                uniqueCandidateNames.map((name) => (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '0.5rem' }}>
                                        <button
                                            onClick={() => setSelectedCandidate(name)}
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.875rem 1rem', borderRadius: '12px', border: 'none',
                                                background: selectedCandidate === name ? '#eff6ff' : 'transparent',
                                                color: selectedCandidate === name ? '#3b82f6' : '#64748b',
                                                cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: selectedCandidate === name ? 800 : 500, fontSize: '0.9375rem',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '6px',
                                                background: selectedCandidate === name ? '#3b82f6' : '#f1f5f9',
                                                color: selectedCandidate === name ? 'white' : '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
                                            }}>
                                                {name.charAt(0)}
                                            </div>
                                            {name}
                                        </button>
                                        {selectedCandidate === name && (
                                            <button
                                                onClick={() => handleVerifyAll(name)}
                                                style={{ padding: '0.4rem', borderRadius: '8px', background: '#d1fae5', border: 'none', color: '#059669', cursor: 'pointer' }}
                                                title="Verify All"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main>
                    <div className="glass" style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Search by file name or type..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9375rem', background: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Filter size={18} color="#64748b" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="Pending">Pending Verification</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>File Details</th>
                                        <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate</th>
                                        <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload Date</th>
                                        <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                        <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredDocs.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '5rem', textAlign: 'center' }}>
                                                    <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                                                    <p style={{ color: '#64748b', fontWeight: 500 }}>No documents match the filter criteria.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDocs.map((doc, index) => (
                                                <motion.tr
                                                    key={doc.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    style={{ borderBottom: '1px solid #f8fafc' }}
                                                    className="table-row-hover"
                                                >
                                                    <td style={{ padding: '1.25rem 2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', color: '#64748b' }}>
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>{doc.doc_name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>{doc.doc_type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>{doc.candidates?.full_name || '—'}</td>
                                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                                        <span style={{
                                                            padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800,
                                                            background: doc.status === 'Verified' ? '#d1fae5' : doc.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                                            color: doc.status === 'Verified' ? '#059669' : doc.status === 'Rejected' ? '#dc2626' : '#d97706',
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid currentColor', borderOpacity: 0.1
                                                        }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                                            {doc.status === 'Pending' ? 'Pending Verification' : doc.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            {doc.status === 'Pending' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAction(doc.id, 'Verified')}
                                                                        title="Verify"
                                                                        style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#059669', cursor: 'pointer' }}
                                                                    >
                                                                        <Check size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRejectionModal({ isOpen: true, docId: doc.id, reason: '' })}
                                                                        title="Reject"
                                                                        style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAction(doc.id, 'Pending')}
                                                                    title="Reset Status"
                                                                    style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}
                                                                >
                                                                    <RefreshCw size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => window.open(doc.file_url, '_blank')}
                                                                style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => window.open(doc.file_url, '_blank')}
                                                                style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}
                                                            ><Download size={18} /></button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectionModal.isOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Reject Document</h2>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Please provide a reason for rejecting this document so the candidate can rectify it.</p>

                            <textarea
                                value={rejectionModal.reason}
                                onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="e.g. Image is blurry, Wrong document uploaded..."
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '120px', marginBottom: '1.5rem', fontSize: '0.9375rem', fontFamily: 'inherit' }}
                            />

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setRejectionModal({ isOpen: false, docId: null, reason: '' })}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(rejectionModal.docId, 'Rejected', rejectionModal.reason)}
                                    disabled={!rejectionModal.reason.trim()}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: rejectionModal.reason.trim() ? 1 : 0.6 }}
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HRDocuments;
