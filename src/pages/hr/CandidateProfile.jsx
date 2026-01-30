import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Briefcase, Calendar, FileText, Send,
    CheckCircle, ArrowLeft, Building, MapPin, DollarSign,
    Shield, Key, AlertCircle, Plus, Loader2, MoreVertical, Edit2, X, Upload, ExternalLink, Eye, Cpu
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MeetingScheduler from '../../components/MeetingScheduler';
import { verifyCandidateOnChain } from '../../lib/web3/blockchain';

// Policy Upload Manager Component
const PolicyUploadManager = ({ candidateId, onUploadSuccess }) => {
    const [policies, setPolicies] = useState([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newPolicyName, setNewPolicyName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPolicies();

        // Real-time subscription for policy updates
        const subscription = supabase
            .channel('policy_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'policy_documents',
                    filter: `candidate_id=eq.${candidateId}`
                },
                (payload) => {
                    console.log('Policy change detected:', payload);
                    fetchPolicies(); // Refresh policies on any change
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [candidateId]);

    const fetchPolicies = async () => {
        try {
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
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file, policyName) => {
        if (!file) return;

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${policyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
            const filePath = `policies/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // Save to policy_documents table
            const { error: dbError } = await supabase
                .from('policy_documents')
                .insert([{
                    candidate_id: candidateId,
                    policy_name: policyName,
                    policy_type: policyName.toLowerCase().replace(/\s+/g, '_'),
                    file_url: publicUrl,
                    file_name: file.name,
                    uploaded_by: 'HR Team',
                    description: `${policyName} document`
                }]);

            if (dbError) throw dbError;

            alert(`${policyName} uploaded successfully!`);
            fetchPolicies();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            alert(`Failed to upload policy document: ${errorMessage}\n\nPlease ensure:\n1. Supabase storage bucket 'documents' exists\n2. Storage permissions are configured\n3. File is a valid PDF`);
        }
    };

    const handleAddNewPolicy = () => {
        if (!newPolicyName.trim()) {
            alert('Please enter a policy name');
            return;
        }
        setIsAddingNew(false);
        // The policy will be created when a file is uploaded
    };

    const handleDeletePolicy = async (policyId) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;

        try {
            const { error } = await supabase
                .from('policy_documents')
                .update({ is_active: false })
                .eq('id', policyId);

            if (error) throw error;
            alert('Policy deleted successfully');
            fetchPolicies();
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete policy');
        }
    };

    return (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Upload size={18} color="#3b82f6" />
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>Policy Documents</div>
                </div>
                <button
                    onClick={() => setIsAddingNew(true)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        border: '1px solid #dbeafe',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={14} /> Add Policy
                </button>
            </div>

            {/* Add New Policy Form */}
            {isAddingNew && (
                <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '2px solid #3b82f6', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>Add New Policy</div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="text"
                            placeholder="Policy Name (e.g., Remote Work Policy)"
                            value={newPolicyName}
                            onChange={(e) => setNewPolicyName(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.625rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                        <label style={{
                            padding: '0.625rem 1rem',
                            background: '#3b82f6',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="file"
                                accept=".pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && newPolicyName.trim()) {
                                        handleFileUpload(file, newPolicyName);
                                        setNewPolicyName('');
                                        setIsAddingNew(false);
                                    } else if (!newPolicyName.trim()) {
                                        alert('Please enter a policy name first');
                                    }
                                }}
                            />
                            <Upload size={14} /> Upload
                        </label>
                        <button
                            onClick={() => {
                                setIsAddingNew(false);
                                setNewPolicyName('');
                            }}
                            style={{
                                padding: '0.625rem 1rem',
                                background: '#f1f5f9',
                                color: '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Existing Policies */}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Loader2 className="animate-spin" size={24} color="#3b82f6" style={{ margin: '0 auto' }} />
                    </div>
                ) : policies.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                        <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
                        <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>No policies uploaded yet. Click "Add Policy" to get started.</p>
                    </div>
                ) : (
                    policies.map((policy) => (
                        <div key={policy.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <FileText size={16} color="#64748b" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>{policy.policy_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{policy.file_name}</div>
                            </div>
                            <a
                                href={policy.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    background: '#eff6ff',
                                    color: '#3b82f6',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    border: '1px solid #dbeafe'
                                }}
                            >
                                View
                            </a>
                            <button
                                onClick={() => handleDeletePolicy(policy.id)}
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Task Manager Component
const TaskManager = ({ candidateId }) => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchTasks();
    }, [candidateId]);

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('candidate_tasks')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) return;
        try {
            const { error } = await supabase
                .from('candidate_tasks')
                .insert([{
                    candidate_id: candidateId,
                    ...newTask,
                    assigned_by: localStorage.getItem('user_email') || 'hr@nexus.com'
                }]);
            if (error) throw error;

            // Create notification for candidate
            await supabase.from('notifications').insert([{
                candidate_id: candidateId,
                title: 'New Task Assigned',
                message: `HR has assigned a new task: ${newTask.title}`,
                type: 'info'
            }]);

            setNewTask({ title: '', description: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });
            setIsAdding(false);
            fetchTasks();
        } catch (error) {
            alert('Failed to add task: ' + error.message);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm('Remove this task?')) return;
        await supabase.from('candidate_tasks').delete().eq('id', id);
        fetchTasks();
    };

    return (
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Daily Task Assignment</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Manage candidate activities</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white', border: 'none', borderRadius: '12px',
                        fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                >
                    + Assign New Task
                </button>
            </div>

            {isAdding && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '2px solid #10b981', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Task Title</label>
                            <input type="text" placeholder="e.g. Complete Security Training" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9375rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Detailed Description</label>
                            <textarea placeholder="Provide instructions for the candidate..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9375rem', minHeight: '100px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Priority Level</label>
                                <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9375rem' }}>
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent Action</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Due Date</label>
                                <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} style={{ width: '100%', padding: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9375rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button onClick={handleAddTask} style={{ flex: 2, padding: '1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Assign Task to Candidate</button>
                            <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '1rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} color="#10b981" style={{ margin: '0 auto' }} /></div>
                ) : tasks.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
                        <div style={{ marginBottom: '1rem' }}><CheckCircle size={40} color="#cbd5e1" style={{ margin: '0 auto' }} /></div>
                        <p style={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>No tasks assigned to this candidate yet.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} style={{ padding: '1.5rem', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <span style={{
                                    fontSize: '0.625rem', padding: '0.375rem 0.625rem', borderRadius: '8px',
                                    background: task.priority === 'urgent' ? '#fff1f2' : (task.priority === 'high' ? '#fffbeb' : '#f8fafc'),
                                    color: task.priority === 'urgent' ? '#f43f5e' : (task.priority === 'high' ? '#d97706' : '#64748b'),
                                    fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {task.priority}
                                </span>
                                <button onClick={() => handleDeleteTask(task.id)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><X size={16} /></button>
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>{task.title}</h4>
                            <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>{task.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f8fafc', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                <Calendar size={14} /> Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const CandidateProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, docId: null, reason: '' });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [deliveryOptions, setDeliveryOptions] = useState({ personal: true, corporate: true });
    const [blockchainLoading, setBlockchainLoading] = useState(false);
    const [blockchainTx, setBlockchainTx] = useState(localStorage.getItem(`bc_tx_${id}`) || null);
    const userPortal = localStorage.getItem('user_portal_id') || 'hr';
    const backPath = userPortal === 'hr' ? '/hr/candidates' : '/admin/candidates';

    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        location: '',
        ctc: 0,
        employment_type: '',
        reporting_manager: '',
        joining_date: ''
    });

    useEffect(() => {
        fetchCandidate();
        fetchDepts();
    }, [id]);

    const fetchDepts = async () => {
        const { data } = await supabase.from('operational_units').select('name').eq('status', 'Active');
        if (data) setDepartments(data.map(d => d.name));
    };


    const fetchCandidate = async () => {
        setIsLoading(true);
        try {
            const [candRes, docRes] = await Promise.all([
                supabase.from('candidates').select('*').eq('id', id).single(),
                supabase.from('candidate_documents').select('*').eq('candidate_id', id)
            ]);

            if (candRes.error) throw candRes.error;
            setCandidate(candRes.data);
            setEditForm(candRes.data);
            setDocuments(docRes.data || []);
        } catch (error) {
            console.error('Error fetching candidate data:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('candidates')
                .update({
                    full_name: editForm.full_name,
                    email: editForm.email,
                    phone: editForm.phone,
                    position: editForm.position,
                    department: editForm.department,
                    location: editForm.location,
                    ctc: parseInt(editForm.ctc) || 0,
                    employment_type: editForm.employment_type,
                    reporting_manager: editForm.reporting_manager,
                    joining_date: editForm.joining_date
                })
                .eq('id', id);

            if (error) throw error;

            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'hr@nexus.com',
                action: 'UPDATE_CANDIDATE',
                table_name: 'candidates',
                record_id: id,
                old_data: candidate,
                new_data: editForm
            }]);

            setCandidate({ ...candidate, ...editForm });
            setIsEditing(false);
        } catch (error) {
            console.error('Update error:', error.message);
            alert('Failed to update candidate details');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAction = async (docId, newStatus, reason = null) => {
        try {
            console.log('Updating document:', { docId, newStatus, reason });

            const updateData = { status: newStatus };
            if (newStatus === 'Rejected') {
                updateData.rejection_reason = reason;
            } else {
                updateData.rejection_reason = null;
            }

            const { data, error: updateError } = await supabase
                .from('candidate_documents')
                .update(updateData)
                .eq('id', docId)
                .select();

            if (updateError) {
                console.error('Supabase error:', updateError);
                throw updateError;
            }

            console.log('Update successful:', data);

            // Update local state
            setDocuments(docs => docs.map(doc =>
                doc.id === docId ? { ...doc, status: newStatus, rejection_reason: reason } : doc
            ));

            if (newStatus === 'Rejected') {
                setRejectionModal({ isOpen: false, docId: null, reason: '' });
            }

            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'hr@nexus.com',
                action: newStatus === 'Verified' ? 'VERIFY_DOCUMENT' : 'REJECT_DOCUMENT',
                table_name: 'candidate_documents',
                record_id: docId,
                new_data: { status: newStatus, reason: reason }
            }]);

            // Check if all mandatory documents are verified
            const { data: allDocs, error: fetchError } = await supabase
                .from('candidate_documents')
                .select('status')
                .eq('candidate_id', id);

            if (fetchError) {
                console.error('Error fetching documents:', fetchError);
            } else if (allDocs && allDocs.length >= 6 && allDocs.every(d => d.status === 'Verified')) {
                const { error: progressError } = await supabase
                    .from('candidates')
                    .update({
                        progress: 80,
                        status: 'Docs Verified'
                    })
                    .eq('id', id);

                if (progressError) {
                    console.error('Error updating progress:', progressError);
                } else {
                    setCandidate(prev => ({ ...prev, progress: 80, status: 'Docs Verified' }));
                }
            }
        } catch (error) {
            console.error('Document action error:', error);
            alert(`Failed to update document status: ${error.message || 'Unknown error'}`);
        }
    };

    const handleSendOffer = async () => {
        setIsUpdating(true);
        try {
            // Check for credentials
            if (!candidate.it_email || !candidate.it_password) {
                alert('IT Credentials must be generated before sending the offer letter.');
                setIsUpdating(false);
                return;
            }

            setBlockchainLoading(true);
            // 0. Blockchain Transaction (Offer Issuance)
            const result = await verifyCandidateOnChain(null, {
                name: candidate.full_name,
                email: candidate.email,
                action: 'OFFER_ISSUED'
            });
            setBlockchainTx(result.signature);
            localStorage.setItem(`bc_tx_${id}`, result.signature);
            setBlockchainLoading(false);

            const { error } = await supabase
                .from('candidates')
                .update({
                    status: 'Offer Sent',
                    progress: 20
                })
                .eq('id', id);

            if (error) throw error;

            // Create Notification with credentials
            const { error: notifError } = await supabase
                .from('notifications')
                .insert([{
                    candidate_id: id,
                    title: 'Your Offer Letter is Ready!',
                    message: `Congratulations! We have sent you an offer letter. Your company credentials are: Email: ${candidate.it_email} | Password: ${candidate.it_password}. Please use these to log in once you accept.`,
                    type: 'success'
                }]);

            if (notifError) console.error('Error creating notification:', notifError);

            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'hr@nexus.com',
                action: 'SEND_OFFER',
                table_name: 'candidates',
                record_id: id,
                new_data: {
                    status: 'Offer Sent',
                    progress: 20,
                    it_email: candidate.it_email
                }
            }]);

            setShowReviewModal(false);
            fetchCandidate();
        } catch (error) {
            console.error('Error sending offer:', error.message);
            alert('Failed to send offer');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <Loader2 className="animate-spin" size={48} color="#3b82f6" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Candidate not found</h2>
                <Link to="/hr/candidates" style={{ color: '#3b82f6', marginTop: '1rem', display: 'block' }}>Return to list</Link>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header / Nav */}
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
                    <ArrowLeft size={18} /> Back to Candidates
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em' }}>{candidate.full_name}</h1>
                            <span style={{
                                padding: '0.375rem 0.875rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800,
                                background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe'
                            }}>
                                {candidate.status}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={18} /> {candidate.position}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={18} /> {candidate.department}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} /> {candidate.location}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Edit2 size={18} /> Edit Details
                        </button>
                        <button
                            onClick={() => {
                                if (!candidate.it_email || !candidate.it_password) {
                                    alert('IT Credentials must be generated before reviewing/sending the offer letter.');
                                    return;
                                }
                                setShowReviewModal(true);
                            }}
                            disabled={isUpdating || candidate.it_status !== 'Completed' || !candidate.it_email}
                            className="btn-primary"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.875rem 1.75rem', borderRadius: '12px',
                                background: candidate.it_status !== 'Completed' ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                                cursor: candidate.it_status !== 'Completed' ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isUpdating ? <Loader2 className="animate-spin" size={20} /> :
                                candidate.status === 'Offer Sent' ? <><CheckCircle size={20} /> Offer Sent</> :
                                    candidate.status === 'Offer Accepted' ? <><CheckCircle size={20} /> Offer Accepted</> :
                                        <><Eye size={20} /> Review & Send Offer</>}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Progress Overview */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Onboarding Progress</h3>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6' }}>{candidate.progress || 0}%</span>
                        </div>
                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${candidate.progress || 0}%` }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '6px' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                            {[
                                { label: 'Offer Sent', active: (candidate.progress || 0) >= 20 },
                                { label: 'Docs Signed', active: (candidate.progress || 0) >= 40 },
                                { label: 'IT Setup', active: (candidate.progress || 0) >= 60 },
                                { label: 'Policies', active: (candidate.progress || 0) >= 90 },
                                { label: 'Ready to Join', active: (candidate.progress || 0) >= 100 }
                            ].map((step, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        background: step.active ? '#3b82f6' : '#e2e8f0',
                                        margin: '0 auto 0.75rem',
                                        boxShadow: step.active ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
                                    }}></div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: step.active ? '#1e293b' : '#94a3b8' }}>{step.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Candidate Details */}
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '2rem' }}>Candidate Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} color="#3b82f6" /> {candidate.email}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Phone Number</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} color="#3b82f6" /> {candidate.phone || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Joining Date</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} color="#3b82f6" /> {new Date(candidate.joining_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Employment Type</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{candidate.employment_type || 'Full-time'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Annual CTC</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>₹{candidate.ctc?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Reporting Manager</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{candidate.reporting_manager || 'TBD'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Desk Location</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <MapPin size={16} /> {candidate.desk_location || 'Not Assigned'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TaskManager candidateId={id} />

                    {/* Documents Section */}
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Submitted Documents</h3>
                            <div style={{ padding: '0.5rem 1rem', background: '#eff6ff', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>
                                {documents.filter(d => d.status === 'Verified').length} / {documents.length} VERIFIED
                            </div>
                        </div>

                        {documents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: '#64748b', fontWeight: 600 }}>No documents submitted yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {documents.map((doc) => (
                                    <div key={doc.id} style={{ padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', color: '#64748b' }}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>{doc.doc_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{doc.doc_type}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{
                                                padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800,
                                                background: doc.status === 'Verified' ? '#d1fae5' : doc.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                                color: doc.status === 'Verified' ? '#059669' : doc.status === 'Rejected' ? '#dc2626' : '#d97706',
                                            }}>
                                                {doc.status}
                                            </span>

                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    onClick={() => {
                                                        if (doc.file_url) {
                                                            window.open(doc.file_url, '_blank', 'noopener,noreferrer');
                                                        } else {
                                                            alert('Document URL not found.');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid #3b82f6',
                                                        background: '#eff6ff',
                                                        color: '#3b82f6',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.375rem'
                                                    }}
                                                >
                                                    <ExternalLink size={14} /> View Doc
                                                </button>

                                                {doc.status !== 'Verified' && (
                                                    <button
                                                        onClick={() => handleAction(doc.id, 'Verified')}
                                                        style={{ padding: '0.5rem', borderRadius: '8px', background: '#d1fae5', border: 'none', color: '#059669', cursor: 'pointer' }}
                                                    ><CheckCircle size={16} /></button>
                                                )}

                                                {doc.status !== 'Rejected' && (
                                                    <button
                                                        onClick={() => setRejectionModal({ isOpen: true, docId: doc.id, reason: '' })}
                                                        style={{ padding: '0.5rem', borderRadius: '8px', background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                                                    ><AlertCircle size={16} /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Company Policies Section */}
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Company Policies</h3>
                            {candidate.policy_accepted && (
                                <div style={{ padding: '0.5rem 1rem', background: '#d1fae5', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={14} /> ACCEPTED
                                </div>
                            )}
                        </div>

                        <PolicyUploadManager candidateId={id} onUploadSuccess={fetchCandidate} />

                        {candidate.policy_accepted ? (
                            <div style={{ padding: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                                <CheckCircle size={24} color="#16a34a" />
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803d' }}>Policies Accepted</div>
                                    <div style={{ fontSize: '0.8125rem', color: '#16a34a', marginTop: '0.25rem' }}>Candidate has reviewed and accepted all company policies.</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Create notification for candidate to review policies
                                            const { error } = await supabase
                                                .from('notifications')
                                                .insert([{
                                                    candidate_id: id,
                                                    title: 'Company Policies Available',
                                                    message: 'Please review and accept the company policies to continue your onboarding process.',
                                                    type: 'info'
                                                }]);
                                            if (error) throw error;
                                            alert('Policy notification sent to candidate successfully!');
                                        } catch (error) {
                                            console.error('Error sending policy notification:', error);
                                            alert('Failed to send policy notification');
                                        }
                                    }}
                                    className="btn-primary"
                                    style={{
                                        flex: 2,
                                        padding: '0.875rem 1.5rem',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                                        marginTop: '1.5rem'
                                    }}
                                >
                                    <Send size={20} /> Send Policies
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2 (Sidebar) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* IT Credentials */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.625rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#60a5fa' }}>
                                <Key size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>IT Credentials</h3>
                        </div>

                        {/* IT Credentials Display */}
                        {candidate.it_status === 'Completed' && candidate.it_email ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.375rem' }}>Company Email (Login ID)</div>
                                    <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{candidate.it_email}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.375rem' }}>Temporary Password</div>
                                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', color: '#86efac' }}>{candidate.it_password}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '1rem', opacity: 0.7 }}>
                                <AlertCircle size={32} color="#fbbf24" />
                                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#cbd5e1' }}>
                                    Credentials are pending IT setup.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Meeting Scheduler */}
                    <div style={{ marginTop: '2rem' }}>
                        <MeetingScheduler candidateId={id} />
                    </div>
                    {/* Solana Blockchain Notarization */}
                    <div className="glass" style={{
                        padding: '2rem', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
                        color: 'white', marginTop: '2rem', border: 'none', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ padding: '0.625rem', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '12px', color: 'white' }}>
                                <Shield size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Blockchain Trust</h3>
                        </div>

                        <p style={{ fontSize: '0.8125rem', marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.5 }}>
                            Immutable proof of offer & verification on <strong>Solana Devnet</strong>.
                        </p>

                        {!blockchainTx ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    onClick={async () => {
                                        setBlockchainLoading(true);
                                        try {
                                            const result = await verifyCandidateOnChain(null, {
                                                name: candidate.full_name,
                                                email: candidate.email
                                            });

                                            setBlockchainTx(result.explorerUrl);
                                            localStorage.setItem(`bc_tx_${id}`, result.explorerUrl);

                                            // Audit Log
                                            await supabase.from('audit_logs').insert([{
                                                user_email: localStorage.getItem('user_email') || 'hr@nexus.com',
                                                action: 'BLOCKCHAIN_NOTARIZATION',
                                                table_name: 'candidates',
                                                record_id: id,
                                                new_data: { tx: result.signature, pda: result.pda }
                                            }]);
                                        } catch (err) {
                                            alert("Blockchain Error: " + err.message);
                                        } finally {
                                            setBlockchainLoading(false);
                                        }
                                    }}
                                    disabled={blockchainLoading}
                                    style={{
                                        width: '100%', padding: '0.875rem', borderRadius: '12px',
                                        background: 'white', color: '#9945FF', border: 'none',
                                        fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {blockchainLoading ? <Loader2 className="animate-spin" size={18} /> : <><Cpu size={18} /> System Sign On-Chain</>}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={16} /> Verified on Chain
                                </div>
                                <a
                                    href={blockchainTx}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                                        fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <ExternalLink size={16} /> View Transaction
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Assigned Team */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Onboarding Team</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 700 }}>HR</div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{candidate.assigned_hr || 'Unassigned'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HR Coordinator</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700 }}>IT</div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{candidate.assigned_it || 'Unassigned'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IT Specialist</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Edit Candidate Details</h2>
                                <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleUpdateDetails} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Full Name</label>
                                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Email</label>
                                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Phone</label>
                                    <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Position</label>
                                    <input type="text" value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                                    <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        {departments.length === 0 && <option value={editForm.department}>{editForm.department}</option>}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>CTC (Annual)</label>
                                    <input type="number" value={editForm.ctc} onChange={e => setEditForm({ ...editForm, ctc: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Location</label>
                                    <input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Joining Date</label>
                                    <input type="date" value={editForm.joining_date} onChange={e => setEditForm({ ...editForm, joining_date: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>Reporting Manager</label>
                                    <input type="text" value={editForm.reporting_manager} onChange={e => setEditForm({ ...editForm, reporting_manager: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>

                                {/* Manual IT Override - For fixing issues */}
                                {candidate.it_status === 'Completed' && (
                                    <>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>IT Email (Override)</label>
                                            <input type="email" value={editForm.it_email || ''} onChange={e => setEditForm({ ...editForm, it_email: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', display: 'block' }}>IT Password (Override)</label>
                                            <input type="text" value={editForm.it_password || ''} onChange={e => setEditForm({ ...editForm, it_password: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                                        </div>
                                    </>
                                )}

                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                                    <button type="submit" disabled={isUpdating} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#3b82f6', border: 'none', color: 'white', fontWeight: 700 }}>
                                        {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Rejection Modal */}
            < AnimatePresence >
                {
                    rejectionModal.isOpen && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Reject Document</h2>
                                <textarea
                                    value={rejectionModal.reason}
                                    onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Reason for rejection..."
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', margin: '1rem 0', fontFamily: 'inherit' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setRejectionModal({ isOpen: false, docId: null, reason: '' })} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                    <button
                                        onClick={() => handleAction(rejectionModal.docId, 'Rejected', rejectionModal.reason)}
                                        disabled={!rejectionModal.reason.trim()}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: rejectionModal.reason.trim() ? 1 : 0.6 }}
                                    >Confirm</button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence>

            {/* Offer Letter Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
                            <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '24px 24px 0 0' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Review Offer Letter</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Verify the details below before sending to {candidate.full_name}</p>
                                </div>
                                <button onClick={() => setShowReviewModal(false)} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                            </div>

                            <div style={{ padding: '2.5rem' }}>
                                <div style={{ background: '#fff', border: '2px solid #f1f5f9', borderRadius: '16px', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#eff6ff', borderRadius: '50%', opacity: 0.5 }}></div>

                                    {/* Header Preview */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6' }}>LokaChakra</div>
                                        <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: '#64748b' }}>
                                            Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                                            Offer ID: LC-{id.substring(0, 8).toUpperCase()}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Employment Offer Letter</h3>

                                    <div style={{ fontSize: '0.9375rem', lineHeight: '1.7', color: '#475569', marginBottom: '2rem' }}>
                                        Dear <strong style={{ color: '#1e293b' }}>{candidate.full_name}</strong>,<br /><br />
                                        We are pleased to offer you the position of <strong style={{ color: '#1e293b' }}>{candidate.position}</strong> at LokaChakra. Your skills and experience will be a great asset to our <strong style={{ color: '#1e293b' }}>{candidate.department}</strong> department.
                                    </div>

                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Compensation & Benefits</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Annual CTC</div>
                                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>₹{candidate.ctc?.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Joining Date</div>
                                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{new Date(candidate.joining_date).toLocaleDateString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employment Type</div>
                                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{candidate.employment_type || 'Full-time'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reporting Manager</div>
                                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{candidate.reporting_manager || 'TBD'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.75rem' }}>IT Credentials (Included in Offer)</h4>
                                        <div style={{ display: 'flex', gap: '2rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Corporate Email</div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{candidate.it_email}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Temporary Password</div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{candidate.it_password}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                                        This is a system-generated preview. The candidate will be able to digitally sign this offer online.
                                    </div>
                                </div>

                                {/* Delivery Options Facility */}
                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={16} color="#3b82f6" /> Delivery Options
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={deliveryOptions.personal} onChange={(e) => setDeliveryOptions({ ...deliveryOptions, personal: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Personal Email</div>
                                                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{candidate.email}</div>
                                            </div>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={deliveryOptions.corporate} onChange={(e) => setDeliveryOptions({ ...deliveryOptions, corporate: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Corporate Portal</div>
                                                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{candidate.it_email}</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setShowReviewModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Wait, I Need to Edit</button>
                                    <button
                                        onClick={handleSendOffer}
                                        disabled={isUpdating || blockchainLoading}
                                        style={{
                                            flex: 1.5, padding: '1rem', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                            boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
                                        }}
                                    >
                                        {isUpdating || blockchainLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Sign & Send Offer Letter</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default CandidateProfile;
