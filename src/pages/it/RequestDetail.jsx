import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, User, Mail, Shield, Monitor,
    CheckCircle, ArrowRight, RefreshCw, Package,
    Search, AlertCircle, Loader2, MousePointer
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [allocatedAssets, setAllocatedAssets] = useState([]);
    const [itEmail, setItEmail] = useState('');
    const [itPassword, setItPassword] = useState('Loka@2026#Temp');
    const [deskLocation, setDeskLocation] = useState('');
    const [credentialsCreated, setCredentialsCreated] = useState(false);
    const [deviceBrandFilter, setDeviceBrandFilter] = useState('All');

    useEffect(() => {
        fetchRequest();
        fetchInventory();
    }, [id]);

    const validatePassword = (pass) => {
        const minLength = pass.length >= 8;
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNumber = /\d/.test(pass);
        const hasSpecial = /[@$!%*?&#]/.test(pass);
        return {
            isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
            errors: {
                length: !minLength,
                upper: !hasUpper,
                lower: !hasLower,
                number: !hasNumber,
                special: !hasSpecial
            }
        };
    };

    const fetchRequest = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('it_requests')
                .select('*, candidates(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setRequest(data);
            if (data?.candidates) {
                setItEmail(`${data.candidates.full_name.toLowerCase().replace(' ', '.')}@lokachakra.com`);
                setDeskLocation(data.candidates.desk_location || '');
            }
        } catch (error) {
            console.error('Error fetching request:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .eq('status', 'Available');
            if (error) throw error;
            setAvailableAssets(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error.message);
        }
    };

    const allocateAsset = (asset) => {
        setAllocatedAssets([...allocatedAssets, asset]);
        setAvailableAssets(availableAssets.filter(a => a.id !== asset.id));
    };

    const removeAsset = (asset) => {
        setAvailableAssets([...availableAssets, asset]);
        setAllocatedAssets(allocatedAssets.filter(a => a.id !== asset.id));
    };

    const handleComplete = async () => {
        if (!itEmail || !itEmail.trim()) {
            alert('Please enter a valid Company Email Address before finalizing.');
            setStep(1);
            return;
        }

        const validation = validatePassword(itPassword);
        if (!validation.isValid) {
            let errorMsg = "System Password must meet the following requirements:\n";
            if (validation.errors.length) errorMsg += "• At least 8 characters\n";
            if (validation.errors.upper) errorMsg += "• At least one uppercase letter\n";
            if (validation.errors.lower) errorMsg += "• At least one lowercase letter\n";
            if (validation.errors.number) errorMsg += "• At least one number\n";
            if (validation.errors.special) errorMsg += "• At least one special character (@$!%*?&#)\n";
            alert(errorMsg);
            setStep(1);
            return;
        }

        try {
            // 1. Update IT Request Status
            const { error: reqError } = await supabase
                .from('it_requests')
                .update({
                    status: 'completed'
                })
                .eq('id', id);

            if (reqError) throw reqError;

            // 2. Update Candidate Record with credentials and IT status
            if (request.candidate_id) {
                const { error: candError } = await supabase
                    .from('candidates')
                    .update({
                        it_email: itEmail,
                        it_password: itPassword,
                        desk_location: deskLocation,
                        it_status: 'Completed',
                        status: 'IT Completed' // Update status so HR sees IT is done in the list/badge
                    })
                    .eq('id', request.candidate_id);

                if (candError) throw candError;

                // Create Notification for Candidate (Optional, but good for record)
                // Note: Candidate might not have access yet, but this will be there when they log in.
                // Create Notification for Candidate (will be seen upon first login)
                const { error: notifError } = await supabase
                    .from('notifications')
                    .insert([{
                        candidate_id: request.candidate_id,
                        title: 'IT Setup Complete',
                        message: 'Your IT assets and credentials have been provisioned. HR will be in touch shortly.',
                        type: 'info'
                    }]);
                if (notifError) console.error('Error creating notification', notifError);
            }

            // 3. Update Asset Status if any were allocated
            if (allocatedAssets.length > 0) {
                const assetIds = allocatedAssets.map(a => a.id);
                const { error: assetError } = await supabase
                    .from('assets')
                    .update({
                        status: 'Assigned',
                        assigned_to: request.candidate_id
                    })
                    .in('id', assetIds);
                if (assetError) throw assetError;
            }

            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'it@nexus.com',
                action: 'COMPLETE_IT_REQUEST',
                table_name: 'it_requests',
                record_id: id,
                new_data: {
                    candidate_id: request.candidate_id,
                    it_email: itEmail,
                    allocated_assets: allocatedAssets.map(a => a.asset_tag)
                }
            }]);

            navigate('/it/requests');
        } catch (error) {
            alert('Error completing request: ' + error.message);
        }
    };

    if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;
    if (!request) return <div style={{ padding: '4rem', textAlign: 'center' }}>Request not found.</div>;

    const renderStep1 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="section-card glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>Candidate Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{request.candidates?.full_name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Position</div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{request.candidates?.position || '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Department</div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{request.candidates?.department || '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Items Requested</div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{request.items}</div>
                    </div>
                </div>
            </div>

            <div className="section-card glass" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>Login Credentials</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} /> Company Email Address *
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            value={itEmail}
                            onChange={(e) => setItEmail(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={16} /> System Password *
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={itPassword}
                                onChange={(e) => setItPassword(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: '1.4' }}>
                                8+ chars: Uppercase, Lowercase, Number, Special (@$!%*?&#)
                            </p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Monitor size={16} /> Desk / Workstation Location
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Floor 4, Bay 12, Desk 42"
                            value={deskLocation}
                            onChange={(e) => setDeskLocation(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-secondary" onClick={() => navigate('/it/requests')}>Cancel</button>
                        <button
                            className="btn-primary"
                            onClick={async () => {
                                const v = validatePassword(itPassword);
                                if (!v.isValid) {
                                    alert("Please set a valid password before continuing. (8+ chars, upper, lower, number, special)");
                                    return;
                                }
                                if (!itEmail || !itEmail.trim()) {
                                    alert("Please enter a valid Company Email Address.");
                                    return;
                                }
                                // Save credentials to database
                                try {
                                    const { error } = await supabase
                                        .from('candidates')
                                        .update({
                                            it_email: itEmail,
                                            it_password: itPassword,
                                            desk_location: deskLocation
                                        })
                                        .eq('id', request.candidate_id);
                                    if (error) throw error;
                                    setCredentialsCreated(true);
                                    setStep(2);
                                } catch (error) {
                                    alert('Error saving credentials: ' + error.message);
                                }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981' }}
                        >
                            <CheckCircle size={18} /> Save Credentials & Continue
                        </button>
                    </div>
                    {credentialsCreated && (
                        <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={16} /> Credentials Saved
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                <div>
                    <div className="section-card glass" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center', minHeight: '300px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Allocated Assets</h3>
                        {allocatedAssets.length === 0 ? (
                            <div style={{ padding: '4rem', border: '2px dashed #f1f5f9', borderRadius: '16px', color: '#94a3b8' }}>
                                Click icons in inventory to allocate items.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {allocatedAssets.map(asset => (
                                    <div key={asset.id} onClick={() => removeAsset(asset)} style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '12px', textAlign: 'left', position: 'relative', cursor: 'pointer' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{asset.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{asset.asset_tag}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {allocatedAssets.length === 0 && (
                                <div style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600 }}>
                                    ⚠️ Please allocate at least one asset
                                </div>
                            )}
                            <button
                                className="btn-primary"
                                onClick={handleComplete}
                                disabled={allocatedAssets.length === 0}
                                style={{
                                    background: allocatedAssets.length === 0 ? '#cbd5e1' : '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 2rem',
                                    cursor: allocatedAssets.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: allocatedAssets.length === 0 ? 0.6 : 1
                                }}
                            >
                                <CheckCircle size={20} /> Finalize & Issue Assets
                            </button>
                        </div>
                    </div>
                </div>

                <div className="section-card glass" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Inventory Picker</h4>

                    {/* Device Brand Filter */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Filter by Brand</label>
                        <select
                            value={deviceBrandFilter}
                            onChange={(e) => setDeviceBrandFilter(e.target.value)}
                            style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                            <option value="All">All Brands</option>
                            <option value="Dell">Dell</option>
                            <option value="Mac">Mac</option>
                            <option value="HP">HP</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {availableAssets.filter(asset =>
                            deviceBrandFilter === 'All' || asset.name?.toLowerCase().includes(deviceBrandFilter.toLowerCase())
                        ).length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>No available assets found.</div>
                        ) : (
                            availableAssets.filter(asset =>
                                deviceBrandFilter === 'All' || asset.name?.toLowerCase().includes(deviceBrandFilter.toLowerCase())
                            ).map((asset) => (
                                <div key={asset.id} onClick={() => allocateAsset(asset)} style={{ padding: '0.875rem', background: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Package size={14} color="#64748b" />
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{asset.name}</div>
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginLeft: '1.5rem' }}>{asset.asset_tag}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <button
                    onClick={() => navigate('/it/requests')}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1rem' }}
                >
                    <ChevronLeft size={16} /> Back to Requests
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                            {step === 1 ? 'Credential Setup' : 'Asset Allocation'}
                        </h1>
                        <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                            Processing request for {request.candidates?.full_name || 'Loading...'}
                        </p>
                    </div>
                </div>
            </div>
            {step === 1 ? renderStep1() : renderStep2()}
        </div>
    );
};

export default RequestDetail;
