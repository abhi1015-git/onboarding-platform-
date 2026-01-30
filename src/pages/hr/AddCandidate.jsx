import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Info, User, Briefcase, Users, Loader2, Mail, Phone, Calendar, MapPin, DollarSign, ShieldCheck, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { verifyCandidateOnChain } from '../../lib/web3/blockchain';

const AddCandidate = () => {
    const navigate = useNavigate();
    const userPortal = localStorage.getItem('user_portal_id') || 'hr';
    const backPath = userPortal === 'hr' ? '/hr/candidates' : '/admin';

    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        position: '',
        department: '',
        employmentType: 'Full-time',
        location: 'Remote',
        ctc: '2500000',
        joiningDate: new Date().toISOString().split('T')[0],
        assignHr: 'Mallika Chenna',
        assignIt: 'Amit Singh',
        reportingManager: ''
    });

    useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('operational_units').select('name').eq('status', 'Active');
            if (data) setDepartments(data.map(d => d.name));
        };
        fetchDepts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. On-Chain Verification
            setIsVerifying(true);
            const vcResult = await verifyCandidateOnChain(null, {
                name: formData.fullName,
                email: formData.email,
                action: 'CANDIDATE_CREATION'
            });
            setVerificationResult(vcResult);
            setIsVerifying(false);

            // 2. Insert Candidate into Supabase
            const { data, error } = await supabase
                .from('candidates')
                .insert([
                    {
                        full_name: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        position: formData.position,
                        department: formData.department,
                        employment_type: formData.employmentType,
                        location: formData.location,
                        ctc: parseInt(formData.ctc) || 0,
                        joining_date: formData.joiningDate,
                        assigned_hr: formData.assignHr,
                        assigned_it: formData.assignIt,
                        reporting_manager: formData.reportingManager,
                        personal_info: {
                            phone: formData.phone,
                            blockchain_tx: vcResult.signature,
                            explorer_url: vcResult.explorerUrl
                        },
                        status: 'IT Provisioning',
                        it_status: 'Pending',
                        progress: 0
                    }
                ])
                .select();

            if (error) {
                if (error.code === '23505') {
                    if (error.message.includes('email')) {
                        alert('A candidate with this email address already exists. Please use a unique email.');
                    } else if (error.message.includes('phone')) {
                        alert('A candidate with this phone number already exists. Please use a different phone number.');
                    } else {
                        alert('This candidate already exists in the system (Duplicate Entry).');
                    }
                } else {
                    throw error;
                }
                return;
            }

            // 2. Create an IT Request for this candidate
            if (data && data.length > 0) {
                const newCandidate = data[0];
                const { error: itError } = await supabase
                    .from('it_requests')
                    .insert([
                        {
                            candidate_id: newCandidate.id,
                            request_type: 'Software, Access & Hardware',
                            items: 'Laptop, Monitor, Mouse, Email Access',
                            description: `Standard onboarding setup for ${newCandidate.full_name} (${newCandidate.position})`,
                            priority: 'medium',
                            status: 'pending'
                        }
                    ]);
                if (itError) console.error('Error creating IT request:', itError.message);

                // 3. Audit Log
                await supabase.from('audit_logs').insert([{
                    user_email: localStorage.getItem('user_email') || 'hr@nexus.com',
                    action: 'CREATE_CANDIDATE_ON_CHAIN',
                    table_name: 'candidates',
                    record_id: newCandidate.id,
                    new_data: {
                        ...newCandidate,
                        blockchain_tx: vcResult.signature,
                        pda: vcResult.pda
                    }
                }]);

                // Save tx to local storage for quick reference
                localStorage.setItem(`bc_tx_${newCandidate.id}`, vcResult.explorerUrl);
            }

            navigate(backPath);
        } catch (error) {
            console.error('Error adding candidate:', error);
            alert('Failed to add candidate: ' + (error.message || error.details || JSON.stringify(error)));
        } finally {
            setIsLoading(false);
            setIsVerifying(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <button
                    onClick={() => navigate(backPath)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        color: '#64748b', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600,
                        padding: '0.5rem 0', marginBottom: '1rem'
                    }}
                >
                    <ArrowLeft size={18} /> Back to {userPortal === 'hr' ? 'Candidates' : 'Dashboard'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>Add New Candidate</h1>
                        <p style={{ color: '#64748b', fontSize: '1rem' }}>Pre-onboard a new hire and initiate the IT workflow.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Workflow Tip */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass"
                    style={{
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '1px solid #bfdbfe', borderRadius: '1.25rem',
                        padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start'
                    }}
                >
                    <div style={{ padding: '0.75rem', background: 'white', borderRadius: '12px', color: '#3b82f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 0.375rem 0', color: '#1e40af', fontSize: '1rem', fontWeight: 800 }}>Onboarding Initiation</h4>
                        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.875rem', lineHeight: '1.6', opacity: 0.8 }}>
                            Once you create this profile, the IT department will be notified to set up credentials and assets.
                            You can then proceed to send the offer letter.
                        </p>
                    </div>
                </motion.div>

                {/* Blockchain Verification */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                <LinkIcon size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Solana Blockchain Verification</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Verify this candidate's existence on Devnet</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <button
                                type="button"
                                disabled={isVerifying}
                                onClick={async () => {
                                    setIsVerifying(true);
                                    try {
                                        const result = await verifyCandidateOnChain(null, { name: formData.fullName || 'Test Candidate' });
                                        setVerificationResult(result);
                                    } catch (e) {
                                        alert("Verification Failed: " + e.message);
                                    } finally {
                                        setIsVerifying(false);
                                    }
                                }}
                                className="btn-secondary"
                                style={{
                                    border: '1px solid #6366f1', color: isVerifying ? '#94a3b8' : '#4f46e5', background: 'white',
                                    padding: '0.625rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                {isVerifying ? <Loader2 className="animate-spin" size={16} /> : <LinkIcon size={16} />}
                                {isVerifying ? 'Verifying...' : (verificationResult || isVerifying) ? 'Verify Again' : `System Verification`}
                            </button>
                            {verificationResult && (
                                <a
                                    href={verificationResult.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600, textDecoration: 'underline' }}
                                >
                                    View on Solana Explorer
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <User size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Personal Information</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="eg. John Doe"
                                required
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Personal Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="candidate@example.com"
                                required
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="+91 91234 56789"
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Employment Details */}
                <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Briefcase size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Employment Details</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Position *</label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Senior Frontend Engineer"
                                required
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Department *</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="form-input"
                                required
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem', background: 'white' }}
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                                {departments.length === 0 && (
                                    <>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Product">Product</option>
                                        <option value="Design">Design</option>
                                        <option value="HR">HR</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Joining Date *</label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                className="form-input"
                                required
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Annual CTC (INR) *</label>
                            <input
                                type="number"
                                name="ctc"
                                value={formData.ctc}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="0"
                                required
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Work Location</label>
                            <select
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem', background: 'white' }}
                            >
                                <option value="Bangalore">Bangalore</option>
                                <option value="Remote">Remote</option>
                                <option value="Hyderabad">Hyderabad</option>
                                <option value="Pune">Pune</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Employment Type</label>
                            <select
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleChange}
                                className="form-input"
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem', background: 'white' }}
                            >
                                <option value="Full-time">Full-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Team Assignment */}
                <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Users size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Team Assignment</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Reporting Manager</label>
                            <input
                                type="text"
                                name="reportingManager"
                                value={formData.reportingManager}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Manager Name"
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.625rem', display: 'block' }}>Assigned HR</label>
                            <input
                                type="text"
                                name="assignHr"
                                value={formData.assignHr}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="HR Name"
                                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate(backPath)}
                        className="btn-secondary"
                        style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontWeight: 700 }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isVerifying}
                        className="btn-primary"
                        style={{
                            padding: '0.875rem 2.5rem', borderRadius: '12px', fontWeight: 800,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        {isVerifying ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 className="animate-spin" size={20} /> Verifying On-Chain...
                            </div>
                        ) : isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            `Verify & Create Profile`
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCandidate;
