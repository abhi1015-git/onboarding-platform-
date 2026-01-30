import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Upload, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AcceptOffer = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [candidate, setCandidate] = useState(null);
    const [isUploaded, setIsUploaded] = useState(false);

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
                .select('*')
                .eq('id', candidateId)
                .single();

            if (error) throw error;
            if (data) {
                setCandidate(data);
                setIsUploaded(data.offer_accepted);
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
                candidate_id: candidate.id,
                response_type: 'OFFER_ACCEPTANCE',
                is_accepted: true,
                metadata: {
                    accepted_on: new Date().toISOString(),
                    position: candidate.position
                }
            });

            // 2. Update main candidate record
            const { error } = await supabase
                .from('candidates')
                .update({
                    offer_accepted: true,
                    status: 'Documents Pending',
                    progress: Math.max(candidate.progress || 0, 20)
                })
                .eq('id', candidate.id);

            if (error) throw error;
            navigate('/candidate/personal-info');
        } catch (error) {
            alert('Error accepting offer: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Accept Offer</h1>
                    <p className="page-subtitle">Review and accept your employment offer</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="content-container"
            >
                {/* Overall Progress */}
                <div className="section-card shadow-sm" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#4b5563' }}>Overall Progress</h3>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>{candidate?.progress || 0}%</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Stage: Post-Offer Acceptance</div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${candidate?.progress || 0}%`, height: '100%', background: '#3b82f6', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                    </div>
                </div>

                {/* Offer Details */}
                <div className="section-card shadow-sm" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <h3 className="section-title" style={{ marginBottom: '2rem', fontSize: '1.25rem' }}>Offer Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>Position</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>{candidate?.position}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>Department</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>Engineering</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>Full Name</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>{candidate?.full_name}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>Email Address</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>{candidate?.email}</div>
                        </div>
                    </div>

                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1rem', borderLeft: '4px solid #3b82f6', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: 500 }}>Estimated Annual CTC</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em', lineHeight: 1 }}>₹18,50,000</div>
                        <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.75rem', fontWeight: 500 }}>Subject to final verification</div>
                    </div>
                </div>

                {/* Offer Letter Preview */}
                <div className="section-card shadow-sm" style={{ marginBottom: '1.5rem', padding: '0', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={20} color="#3b82f6" />
                            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1e293b' }}>OFFERING_LETTER_REF_001.PDF</span>
                        </div>
                        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                            <Download size={14} style={{ marginRight: '0.5rem' }} /> Download PDF
                        </button>
                    </div>
                    <div className="glass" style={{ padding: '4rem', background: 'white', margin: '2rem', borderRadius: '1rem', border: '1px solid #f1f5f9', position: 'relative' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '0.1em' }}>NEXUS CORP</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>EST. 2024 • PRIVATE & CONFIDENTIAL</div>
                        </div>
                        <div style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.9375rem' }}>
                            <p>Dear <strong>{candidate?.full_name}</strong>,</p>
                            <p style={{ marginTop: '1.5rem' }}>We are pleased to offer you the position of <strong>{candidate?.position}</strong>. At Nexus Corp, we believe in pushing the boundaries of technology and value your expertise.</p>
                            <p style={{ marginTop: '1rem' }}><strong>Compensation:</strong> Your annual CTC will be <strong>₹18,50,000</strong> plus performance bonuses and comprehensive health insurance.</p>
                            <p style={{ marginTop: '1rem' }}><strong>Start Date:</strong> February 15th, 2026</p>

                            {candidate?.it_email && (
                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                    <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: '0.5rem', fontSize: '0.875rem' }}>YOUR IT CREDENTIALS</div>
                                    <div style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
                                        <strong>Company Email:</strong> {candidate.it_email}<br />
                                        <strong>Temp Password:</strong> {candidate.it_password || 'Shared separately via secure channel'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>Note: These will be active once you join and complete your first-day verification.</div>
                                </div>
                            )}

                            <p style={{ marginTop: '2.5rem' }}>We are excited to have you join our team. Please review this letter and click the acceptance button below to begin your journey with us.</p>
                        </div>
                        <div style={{ marginTop: '4rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>ISSUED BY</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b', marginTop: '0.25rem' }}>HR OPERATIONS</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>DATE</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b', marginTop: '0.25rem' }}>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Signed Letter */}
                <div className="section-card shadow-sm" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <h3 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Consent & Acceptance</h3>
                    <div
                        onClick={() => !isUploaded && setIsUploaded(true)}
                        style={{
                            border: '2px dashed #cbd5e1', borderRadius: '1rem', padding: '3rem 2rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: '#64748b', cursor: isUploaded ? 'default' : 'pointer', background: '#f8fafc',
                            transition: 'all 0.2s ease',
                            borderColor: isUploaded ? '#10b981' : '#cbd5e1'
                        }}
                    >
                        {!isUploaded ? (
                            <>
                                <Upload size={40} color="#94a3b8" style={{ marginBottom: '1.25rem' }} />
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>Click to confirm acceptance</div>
                                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>By clicking, you agree to the terms listed in the offer letter.</div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '56px', height: '56px', background: '#d1fae5', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
                                }}>
                                    <CheckCircle size={32} color="#10b981" />
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#064e3b' }}>Offer Accepted!</div>
                                <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 500, marginTop: '0.5rem' }}>Confirmed on {new Date().toLocaleDateString()}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => navigate('/candidate')} style={{ borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                        Back to Dashboard
                    </button>
                    <button
                        className="btn-primary"
                        disabled={!isUploaded || isSaving}
                        onClick={handleAccept}
                        style={{ borderRadius: '10px', padding: '0.75rem 2rem', fontWeight: 700, opacity: (!isUploaded || isSaving) ? 0.6 : 1 }}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <>Accept & Continue <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} /></>}
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default AcceptOffer;
