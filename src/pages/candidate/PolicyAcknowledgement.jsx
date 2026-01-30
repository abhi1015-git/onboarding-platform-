import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, ArrowLeft, Loader2, CheckCircle, FileText, Download, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Policy Documents Component
const PolicyDocuments = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const candidateId = localStorage.getItem('candidate_id');
            if (!candidateId) return;

            const { data, error } = await supabase
                .from('policy_documents')
                .select('*')
                .eq('candidate_id', candidateId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPolicies(data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;
    }

    if (policies.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Policy documents will be available soon.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {policies.map((policy) => (
                <div key={policy.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <FileText size={20} color="#3b82f6" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>{policy.policy_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{policy.file_name}</div>
                    </div>
                    <a
                        href={policy.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#eff6ff',
                            color: '#3b82f6',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid #dbeafe'
                        }}
                    >
                        <ExternalLink size={14} /> View PDF
                    </a>
                </div>
            ))}
        </div>
    );
};

const PolicyAcknowledgement = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    const [candidate, setCandidate] = useState(null);
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        fetchCandidate();
    }, []);

    const fetchCandidate = async () => {
        setIsLoading(true);
        try {
            const candidateId = localStorage.getItem('candidate_id');
            if (!candidateId) {
                navigate('/');
                return;
            }

            const { data, error } = await supabase
                .from('candidates')
                .select('id, policy_accepted, full_name, progress')
                .eq('id', candidateId)
                .single();

            if (error) throw error;
            if (data) {
                setCandidate(data);
                setCandidateId(data.id);
                if (data.policy_accepted) {
                    setFullName(data.full_name);
                }
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        setIsSaving(true);
        try {
            // 1. Log response in structured table
            await supabase.from('candidate_responses').insert({
                candidate_id: candidateId,
                response_type: 'POLICY_ACKNOWLEDGEMENT',
                is_accepted: true,
                metadata: {
                    signature: fullName,
                    signed_at: new Date().toISOString()
                }
            });

            // 2. Update main candidate record
            const { error } = await supabase
                .from('candidates')
                .update({
                    policy_accepted: true,
                    progress: Math.max(candidate?.progress || 0, 90)
                })
                .eq('id', candidateId);

            if (error) throw error;
            navigate('/candidate/device-receipt');
        } catch (error) {
            alert('Error updating policy status: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Policy Acceptance</h1>
                    <p className="page-subtitle">Please review and accept the company policies to proceed.</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="content-container"
            >
                {/* Policies Box */}
                <div className="section-card shadow-sm" style={{ marginBottom: '2.5rem', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                            <Shield size={24} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Required Company Policies</h3>
                    </div>

                    <PolicyDocuments />
                </div>

                {/* Digital Signature */}
                <div className="section-card shadow-sm" style={{ padding: '2.5rem', marginBottom: '2.5rem', border: '1px solid #e2e8f0', borderRadius: '1.5rem' }}>
                    <h3 className="section-title" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Digital Signature</h3>
                    <p style={{ fontSize: '0.9375rem', color: '#64748b', marginBottom: '2rem', fontWeight: 500 }}>
                        Please type your full legal name to validly sign these documents.
                    </p>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <input
                            type="text"
                            placeholder="Type Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="form-input"
                            style={{
                                padding: '1.25rem', fontSize: '1.125rem', border: '1px solid #e2e8f0',
                                background: '#f8fafc', borderRadius: '12px', width: '100%',
                                transition: 'all 0.2s ease', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 500 }}>Signed by:</span>
                            <span style={{ color: '#1e293b', fontWeight: 600, borderBottom: '1px dashed #cbd5e1', minWidth: '100px' }}>{fullName ? fullName : '_ _ _ _ _ _'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 500 }}>Date:</span>
                            <span style={{ color: '#1e293b', fontWeight: 600 }}>{currentDate}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.25rem' }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)} style={{ background: 'white', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                        Back
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleAccept}
                        disabled={!fullName || isSaving}
                        style={{
                            borderRadius: '10px', padding: '0.75rem 2.5rem', fontWeight: 700,
                            opacity: (fullName && !isSaving) ? 1 : 0.6
                        }}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <>Accept & Continue <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} /></>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PolicyAcknowledgement;
