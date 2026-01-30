import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Upload, Shield, Laptop, Target, ArrowRight, Bell, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TaskFeed = ({ candidateId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!candidateId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('candidate_tasks')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching tasks:', error.message);
                setTasks([]);
            } else {
                setTasks(data || []);
            }
            setLoading(false);
        };
        fetchTasks();
    }, [candidateId]);

    const updateStatus = async (id, status) => {
        await supabase.from('candidate_tasks').update({ status }).eq('id', id);
        setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '1rem' }}><Loader2 className="animate-spin" size={24} color="#3b82f6" /></div>;
    if (tasks.length === 0) return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
            <Target size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No daily tasks assigned to you yet.</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {tasks.map(task => (
                <div key={task.id} style={{
                    padding: '1.25rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderLeft: task.priority === 'urgent' ? '4px solid #ef4444' : task.priority === 'high' ? '4px solid #f59e0b' : '1px solid #e2e8f0'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>{task.title}</h4>
                            <span style={{
                                fontSize: '0.625rem', padding: '0.125rem 0.375rem', borderRadius: '4px',
                                background: task.status === 'completed' ? '#d1fae5' : '#fef3c7',
                                color: task.status === 'completed' ? '#059669' : '#d97706', fontWeight: 800, textTransform: 'uppercase'
                            }}>{task.status}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>{task.description}</p>
                    </div>
                    {task.status !== 'completed' && (
                        <button
                            onClick={() => updateStatus(task.id, 'completed')}
                            style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Mark Done
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

const CandidateDashboard = () => {
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        fetchCandidateData();
    }, []);

    const fetchCandidateData = async () => {
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
                const currentCandidate = data;
                setCandidate(currentCandidate);

                // Fetch unread notifications
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('candidate_id', currentCandidate.id)
                    .eq('is_read', false);

                setUnreadNotifications(count || 0);
            }
        } catch (error) {
            console.error('Error fetching candidate data:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const progress = candidate?.progress || 0;

    const steps = [
        { name: 'Accept Offer', completed: candidate?.offer_accepted, icon: FileText, path: '/candidate/accept-offer' },
        { name: 'Personal Information', completed: candidate?.personal_info !== null, icon: Target, path: '/candidate/personal-info' },
        { name: 'Upload Documents', completed: progress >= 80, icon: Upload, path: '/candidate/upload-documents' },
        { name: 'Policy Acceptance', completed: candidate?.policy_accepted, icon: Shield, path: '/candidate/policies' },
        { name: 'Device Receipt', completed: candidate?.device_received, icon: Laptop, path: '/candidate/device-receipt' }
    ];

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 className="animate-spin" size={48} color="#3b82f6" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '5rem' }}>
                <h1 className="page-title">No Candidate Profile Found</h1>
                <p className="page-subtitle">Please contact HR to set up your onboarding profile.</p>
                <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Back to Login</button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, {candidate.full_name}!</h1>
                    <p className="page-subtitle" style={{ fontSize: '1rem', color: '#64748b', marginTop: '0.5rem' }}>Your {candidate.position} journey starts here.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" style={{ borderRadius: '10px', padding: '0.625rem 1rem', position: 'relative' }} onClick={() => navigate('/candidate/notifications')}>
                        <Bell size={18} />
                        {unreadNotifications > 0 && (
                            <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '50%', fontWeight: 800 }}>{unreadNotifications}</span>
                        )}
                    </button>
                    <button className="btn-secondary" style={{ borderRadius: '10px', padding: '0.625rem 1rem' }} onClick={() => navigate('/candidate/orientations')}>
                        <Calendar size={18} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div className="main-content">
                    {/* Progress Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="section-card shadow-sm"
                        style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Onboarding Progress</h3>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', borderRadius: '6px' }}
                            />
                        </div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>
                            {progress < 100 ? "Complete your remaining steps to finish onboarding!" : "Congratulations! You have completed all onboarding steps."}
                        </p>
                    </motion.div>

                    {/* Tasks Feed */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Daily Assignments</h3>
                        </div>
                        <TaskFeed candidateId={candidate.id} />
                    </div>

                    {/* Steps List */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Onboarding Roadmap</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => {
                                        // Lock Device Receipt until HR Verified Docs (Progress 80) AND Policy Accepted
                                        if (step.path === '/candidate/device-receipt') {
                                            if (progress < 80) {
                                                alert('Device receipt is pending HR document verification.');
                                                return;
                                            }
                                            if (!candidate.policy_accepted) {
                                                alert('Please accept the company policies before receiving devices.');
                                                return;
                                            }
                                        }
                                        navigate(step.path);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                                        padding: '1.25rem', background: 'white', borderRadius: '1rem',
                                        border: '1px solid #e2e8f0', cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                    }}
                                    whileHover={{ scale: 1.01, borderColor: '#3b82f6', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: step.completed ? '#d1fae5' : '#f8fafc',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: step.completed ? '#10b981' : '#94a3b8',
                                        border: '1px solid',
                                        borderColor: step.completed ? '#d1fae5' : '#e2e8f0'
                                    }}>
                                        {step.completed ? <CheckCircle size={22} /> : <step.icon size={22} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{step.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                                            {step.completed ? 'Completed' : 'Action Required'}
                                        </p>
                                    </div>
                                    <ArrowRight size={18} color="#cbd5e1" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar">
                    {/* Job Details Card */}
                    <div className="section-card glass shadow-sm" style={{ padding: '1.5rem', marginTop: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <h3 className="section-title" style={{ marginBottom: '1.25rem', fontSize: '1.125rem' }}>Job Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Department</div>
                                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>{candidate.department || 'Not Assigned'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Joining Date</div>
                                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>{candidate.joining_date ? new Date(candidate.joining_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Annual CTC</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#059669' }}>₹{candidate.ctc?.toLocaleString() || 'TBD'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Location</div>
                                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>{candidate.location || 'Remote'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="section-card shadow-sm" style={{ padding: '1.5rem', marginTop: '1.5rem', border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: '1.25rem' }}>
                        <h3 className="section-title" style={{ marginBottom: '0.75rem', fontSize: '1rem', color: '#1e40af' }}>Need Help?</h3>
                        <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '1.25rem', fontWeight: 500, opacity: 0.8 }}>Our HR team is here to support you during your onboarding.</p>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#3b82f6', borderRadius: '10px', fontSize: '0.875rem', border: 'none' }}>
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateDashboard;
