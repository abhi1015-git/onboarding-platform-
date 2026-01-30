import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Laptop, Box, Mail, CheckCircle, AlertCircle, ArrowLeft, Power, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const DeviceReceipt = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [candidate, setCandidate] = useState(null);
    const [assets, setAssets] = useState([]);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const candidateId = localStorage.getItem('candidate_id');
            if (!candidateId) {
                navigate('/');
                return;
            }

            // Get candidate
            const { data: cData, error: cError } = await supabase
                .from('candidates')
                .select('*')
                .eq('id', candidateId)
                .single();

            if (cError) throw cError;
            setCandidate(cData);
            setIsAcknowledged(cData.device_received);

            // Get assigned assets
            const { data: aData, error: aError } = await supabase
                .from('assets')
                .select('*')
                .eq('assigned_to', candidateId);

            if (aError) throw aError;
            setAssets(aData || []);

        } catch (error) {
            console.error('Error fetching data:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcknowledge = async () => {
        setIsSaving(true);
        try {
            // 1. Log response in structured table
            await supabase.from('candidate_responses').insert({
                candidate_id: candidate.id,
                response_type: 'DEVICE_ACKNOWLEDGEMENT',
                is_accepted: true,
                metadata: {
                    acknowledged_at: new Date().toISOString(),
                    assets_count: assets.length
                }
            });

            // 2. Update main candidate record
            const { error } = await supabase
                .from('candidates')
                .update({
                    device_received: true,
                    progress: 100,
                    status: 'Completed'
                })
                .eq('id', candidate.id);

            if (error) throw error;
            setIsAcknowledged(true);
        } catch (error) {
            alert('Error acknowledging receipt: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    const primaryLaptop = assets.find(a => a.type?.toLowerCase() === 'laptop') || assets[0];
    const otherAssets = assets.filter(a => a.id !== primaryLaptop?.id);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Device Receipt & Acknowledgement</h1>
                    <p className="page-subtitle">Please review and acknowledge receipt of your allocated IT assets.</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="content-container"
            >
                {/* Primary Workstation */}
                <div className="section-card shadow-sm" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6', padding: '2rem', borderRadius: '1rem' }}>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.625rem', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
                            <Laptop size={22} />
                        </div>
                        <h3 className="section-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Primary Workstation</h3>
                    </div>
                    <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
                        <div className="info-group">
                            <label className="info-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Full Model Name</label>
                            <div className="info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{primaryLaptop?.name || 'Pending Allocation'}</div>
                        </div>
                        <div className="info-group">
                            <label className="info-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Serial Number</label>
                            <div className="info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{primaryLaptop?.serial_number || 'N/A'}</div>
                        </div>
                        <div className="info-group">
                            <label className="info-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Asset ID (Tag)</label>
                            <div className="info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{primaryLaptop?.id || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Additional Assets */}
                {otherAssets.length > 0 && (
                    <div className="section-card shadow-sm" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '1rem' }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.625rem', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
                                <Box size={22} />
                            </div>
                            <h3 className="section-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Additional Assets</h3>
                        </div>
                        <div className="table-wrapper" style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Name</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset ID</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serial Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otherAssets.map(asset => (
                                        <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1.5rem' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{asset.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{asset.type}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem', color: '#475569', fontWeight: 500 }}>{asset.id}</td>
                                            <td style={{ padding: '1.5rem', color: '#475569', fontWeight: 500 }}>{asset.serial_number}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* System Credentials */}
                <div className="section-card shadow-sm" style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '2rem', borderRadius: '1.5rem' }}>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.625rem', background: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
                            <Mail size={22} />
                        </div>
                        <h3 className="section-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e40af' }}>System Credentials</h3>
                    </div>
                    <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
                        <div className="info-group">
                            <label className="info-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>Company Email</label>
                            <div className="info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a8a' }}>{candidate.it_email || 'Pending Activation'}</div>
                        </div>
                        <div className="info-group">
                            <label className="info-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>System Username</label>
                            <div className="info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a8a' }}>{candidate.full_name?.toLowerCase().replace(' ', '.')}</div>
                        </div>
                        <div className="info-group">
                            <label className="info-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>Temporary Password</label>
                            <div className="info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a8a' }}>********</div>
                        </div>
                    </div>
                </div>

                {/* Action Required */}
                <motion.div
                    animate={{ scale: isAcknowledged ? 0.98 : 1 }}
                    style={{
                        backgroundColor: isAcknowledged ? '#d1fae5' : '#fffbeb',
                        border: '1px solid',
                        borderColor: isAcknowledged ? '#10b981' : '#fcd34d',
                        borderRadius: '1.25rem', padding: '1.5rem 2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '1.5rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: isAcknowledged ? '#10b981' : '#f59e0b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                            {isAcknowledged ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', color: isAcknowledged ? '#065f46' : '#b45309', fontWeight: 700, fontSize: '1.125rem' }}>
                                {isAcknowledged ? 'Receipt Acknowledged' : 'Action Required'}
                            </h4>
                            <p style={{ margin: 0, color: isAcknowledged ? '#059669' : '#92400e', fontSize: '0.9375rem', fontWeight: 500 }}>
                                {isAcknowledged ? 'You have successfully acknowledged your device receipt.' : 'Please confirm that you have received all the items listed above.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAcknowledge}
                        disabled={isAcknowledged || isSaving}
                        className="btn-primary"
                        style={{
                            border: 'none', minWidth: '220px', justifyContent: 'center',
                            borderRadius: '12px', padding: '1rem 1.75rem', fontSize: '1rem',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem',
                            opacity: (isAcknowledged || isSaving) ? 0.8 : 1
                        }}
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : (isAcknowledged ? <><CheckCircle size={20} /> Confirmed</> : 'Acknowledge Receipt')}
                    </button>
                </motion.div>

                {/* Return Dashboard */}
                {isAcknowledged && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}
                    >
                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/candidate')}
                            style={{ borderRadius: '12px', padding: '0.875rem 2.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.625rem', background: '#3b82f6', color: 'white', border: 'none' }}
                        >
                            Complete Onboarding
                        </button>
                    </motion.div>
                )}

                <div style={{ marginTop: '3rem', display: 'flex' }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)} style={{ background: 'white', borderRadius: '10px', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default DeviceReceipt;
