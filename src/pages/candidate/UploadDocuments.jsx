import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Loader2, FileUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const UploadDocuments = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    const [uploadedDocs, setUploadedDocs] = useState({});
    const fileInputRefs = useRef({});

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

            const { data, error } = await supabase
                .from('candidates')
                .select('id, progress')
                .eq('id', candidateId)
                .single();

            if (error) throw error;
            if (data) {
                setCandidateId(data.id);
                // Fetch already uploaded docs
                const { data: docs, error: docError } = await supabase
                    .from('candidate_documents')
                    .select('doc_type, status, rejection_reason')
                    .eq('candidate_id', data.id);

                if (docError) throw docError;
                const uploadedMap = {};
                docs.forEach(d => {
                    uploadedMap[d.doc_type] = { status: d.status, reason: d.rejection_reason };
                });
                setUploadedDocs(uploadedMap);
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const docs = [
        { id: 'aadhaar', name: 'Aadhaar Card', required: true },
        { id: 'pan', name: 'PAN Card', required: true },
        { id: 'photo', name: 'Passport Size Photo', required: true },
        { id: 'education', name: 'Educational Certificates', required: true },
        { id: 'experience', name: 'Experience Letters', required: false },
        { id: 'bank', name: 'Bank Account Details', required: true },
        { id: 'address', name: 'Address Proof', required: true },
        { id: 'payslips', name: 'Previous Payslips', required: false }
    ];

    const handleFileChange = async (e, docId, docName) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit.');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${candidateId}/${docId}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('documents')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 3. Save reference in candidate_documents table (using upsert if re-uploading)
            const { error: dbError } = await supabase
                .from('candidate_documents')
                .upsert([{
                    candidate_id: candidateId,
                    doc_type: docId,
                    doc_name: docName,
                    file_url: publicUrl,
                    status: 'Pending',
                    rejection_reason: null
                }], { onConflict: 'candidate_id, doc_type' }); // Ensure unique constraint or handles existing

            if (dbError) throw dbError;

            setUploadedDocs(prev => ({ ...prev, [docId]: { status: 'Pending', reason: null } }));

            // 4. Update progress
            const requiredCount = docs.filter(d => d.required).length;
            const currentUploaded = docs.filter(d => d.required && (uploadedDocs[d.id] || d.id === docId)).length;

            if (currentUploaded === requiredCount) {
                await supabase
                    .from('candidates')
                    .update({
                        progress: 60,
                        status: 'Verification Pending' // This status update acts as a notification for HR
                    })
                    .eq('id', candidateId);

                // Create a notification for the candidate confirming submission
                await supabase.from('notifications').insert([{
                    candidate_id: candidateId,
                    title: 'Documents Submitted',
                    message: 'Your documents have been submitted to HR for verification.',
                    type: 'info'
                }]);
            }

            alert(`${docName} uploaded successfully!`);

        } catch (error) {
            console.error('Upload Error:', error.message);
            alert('Error uploading document. Please ensure the "documents" storage bucket exists in Supabase. Details: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const triggerFileInput = (docId) => {
        fileInputRefs.current[docId].click();
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    const allRequiredVerified = docs.every(d => !d.required || uploadedDocs[d.id]?.status === 'Verified');

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Upload Documents</h1>
                    <p className="page-subtitle">Please provide the necessary documents to verify your profile.</p>
                </div>
            </div>

            {/* Header info box */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.75rem',
                    padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem',
                    fontSize: '0.9375rem', color: '#92400e', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
            >
                <AlertCircle size={24} style={{ flexShrink: 0, color: '#f59e0b' }} />
                <div>
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>All documents are mandatory. Please read each requirement carefully before uploading.</div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyleType: 'disc', color: '#b45309', fontWeight: 500 }}>
                        <li>Upload clear, readable scans or photos</li>
                        <li>Accepted formats: PDF, JPG, PNG (Max 5MB)</li>
                    </ul>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="documents-list"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
                {docs.map((doc, index) => (
                    <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="doc-card"
                        style={{
                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem',
                            padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease',
                            borderColor: uploadedDocs[doc.id] ? '#10b981' : '#e2e8f0'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{
                                padding: '1rem', background: uploadedDocs[doc.id] ? '#d1fae5' : '#eff6ff',
                                borderRadius: '12px', color: uploadedDocs[doc.id] ? '#10b981' : '#3b82f6',
                                transition: 'all 0.3s ease'
                            }}>
                                <FileText size={22} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{doc.name}</h4>
                                    {doc.required && (
                                        <span style={{
                                            fontSize: '0.625rem', fontWeight: 800, padding: '0.25rem 0.5rem',
                                            background: '#fef3c7', color: '#d97706', borderRadius: '4px', textTransform: 'uppercase'
                                        }}>
                                            REQUIRED
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>PDF, JPG, or PNG (Max 5MB)</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="file"
                                hidden
                                ref={el => fileInputRefs.current[doc.id] = el}
                                onChange={(e) => handleFileChange(e, doc.id, doc.name)}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />

                            {uploadedDocs[doc.id]?.status === 'Verified' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
                                    <CheckCircle size={20} /> Verified
                                </div>
                            ) : uploadedDocs[doc.id]?.status === 'Rejected' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>
                                        <AlertCircle size={20} /> Rejected
                                    </div>
                                    <button onClick={() => triggerFileInput(doc.id)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}>
                                        Re-upload
                                    </button>
                                </div>
                            ) : uploadedDocs[doc.id]?.status === 'Pending' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem' }}>
                                    <Clock size={20} /> Pending Verification
                                </div>
                            ) : (
                                <button
                                    onClick={() => triggerFileInput(doc.id)}
                                    disabled={isSaving}
                                    className="btn-secondary"
                                    style={{
                                        fontSize: '0.875rem', padding: '0.625rem 1.25rem', display: 'flex',
                                        alignItems: 'center', gap: '0.625rem', borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                                    Choose File
                                </button>
                            )}
                        </div>
                        {uploadedDocs[doc.id]?.status === 'Rejected' && uploadedDocs[doc.id]?.reason && (
                            <div style={{ padding: '0.75rem 1rem', background: '#fff1f2', borderRadius: '8px', borderLeft: '4px solid #ef4444', marginTop: '1rem', width: '100%', gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Reason for rejection:</div>
                                <div style={{ fontSize: '0.875rem', color: '#b91c1c', fontWeight: 500 }}>{uploadedDocs[doc.id].reason}</div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
                <button className="btn-secondary" onClick={() => navigate(-1)} style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}>
                    <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back
                </button>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/candidate/policies')}
                    disabled={!allRequiredVerified}
                    style={{ borderRadius: '10px', padding: '0.75rem 2.5rem', opacity: allRequiredVerified ? 1 : 0.6 }}
                >
                    Continue <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                </button>
            </div>
        </div>
    );
};

export default UploadDocuments;
