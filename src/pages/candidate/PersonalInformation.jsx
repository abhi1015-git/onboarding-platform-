import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Heart, ArrowRight, ArrowLeft, Save, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PersonalInformation = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    const [formData, setFormData] = useState({
        phone: '',
        dob: '',
        gender: '',
        maritalStatus: '',
        nationality: 'Indian',
        bloodGroup: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        emergencyName: '',
        emergencyRelation: '',
        emergencyPhone: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const candidateId = localStorage.getItem('candidate_id');
            if (!candidateId) {
                navigate('/');
                return;
            }
            setCandidateId(candidateId);

            // Fetch from BOTH structured table and candidates fallback
            const [detailsRes, candRes] = await Promise.all([
                supabase.from('candidate_details').select('*').eq('candidate_id', candidateId).single(),
                supabase.from('candidates').select('*').eq('id', candidateId).single()
            ]);

            if (detailsRes.data) {
                const d = detailsRes.data;
                setFormData({
                    phone: d.phone || candRes.data?.phone || '',
                    dob: d.dob || candRes.data?.dob || '',
                    gender: d.gender || '',
                    maritalStatus: d.marital_status || '',
                    nationality: d.nationality || 'Indian',
                    bloodGroup: d.blood_group || '',
                    address: d.address || candRes.data?.address || '',
                    city: d.city || candRes.data?.city || '',
                    state: d.state || candRes.data?.state || '',
                    zipCode: d.zip_code || candRes.data?.zip_code || '',
                    emergencyName: d.emergency_name || '',
                    emergencyRelation: d.emergency_relation || '',
                    emergencyPhone: d.emergency_phone || ''
                });
            } else if (candRes.data) {
                const c = candRes.data;
                setFormData(prev => ({
                    ...prev,
                    phone: c.phone || '',
                    dob: c.dob || '',
                    address: c.address || '',
                    city: c.city || '',
                    state: c.state || '',
                    zipCode: c.zip_code || '',
                    ...(c.personal_info || {})
                }));
            }
        } catch (error) {
            console.error('Error fetching details:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Save to structured candidate_details table
            const { error: detailsError } = await supabase
                .from('candidate_details')
                .upsert({
                    candidate_id: candidateId,
                    phone: formData.phone,
                    dob: formData.dob,
                    gender: formData.gender,
                    marital_status: formData.maritalStatus,
                    nationality: formData.nationality,
                    blood_group: formData.bloodGroup,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zipCode,
                    emergency_name: formData.emergencyName,
                    emergency_relation: formData.emergencyRelation,
                    emergency_phone: formData.emergencyPhone,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'candidate_id'
                });

            if (detailsError) throw detailsError;

            // 2. Also keep the JSONB backup in candidates for backward compatibility
            // and update progress
            const { error: candError } = await supabase
                .from('candidates')
                .update({
                    personal_info: formData,
                    progress: Math.max(40, 40) // Logical step 2
                })
                .eq('id', candidateId);

            if (candError) throw candError;

            navigate('/candidate/upload-documents');
        } catch (error) {
            alert('Error saving data: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Personal Information</h1>
                    <p className="page-subtitle">Please provide your personal details and emergency contacts. <span style={{ color: '#ef4444', fontWeight: 500 }}>* Required Fields</span></p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="form-container"
            >
                <form onSubmit={handleSave}>
                    {/* Basic Details */}
                    <div className="section-card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                                <User size={20} />
                            </div>
                            <h3 className="section-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Basic Details</h3>
                        </div>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Phone Number *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input" required style={{ borderColor: '#e2e8f0' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Date of Birth *</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-input" required style={{ borderColor: '#e2e8f0' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="form-input" required style={{ borderColor: '#e2e8f0' }}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Marital Status *</label>
                                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="form-input" required style={{ borderColor: '#e2e8f0' }}>
                                    <option value="">Select Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Nationality *</label>
                                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="form-input" required style={{ borderColor: '#e2e8f0' }} placeholder="e.g. Indian" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Blood Group *</label>
                                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-input" required style={{ borderColor: '#e2e8f0' }}>
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Current Address */}
                    <div className="section-card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                                <MapPin size={20} />
                            </div>
                            <h3 className="section-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Current Address</h3>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Street Address *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} placeholder="123 Main St, Apt 4B" />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>City *</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>State *</label>
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Zip Code *</label>
                                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contacts */}
                    <div className="section-card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                                <Heart size={20} />
                            </div>
                            <h3 className="section-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Emergency Contact</h3>
                        </div>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Contact Name *</label>
                                <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Relation *</label>
                                <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} placeholder="e.g. Spouse" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: '#4b5563', marginBottom: '0.625rem' }}>Phone Number *</label>
                                <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="form-input" required style={{ border: '1px solid #e2e8f0' }} />
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => navigate(-1)} style={{ borderRadius: '10px', padding: '0.75rem 1.5rem', background: 'white' }}>
                            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back
                        </button>
                        <button type="submit" disabled={isSaving} className="btn-primary" style={{ borderRadius: '10px', padding: '0.75rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save & Continue <ArrowRight size={18} /></>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default PersonalInformation;
