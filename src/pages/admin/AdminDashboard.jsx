import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, FileText, Monitor, Loader2, TrendingUp, AlertCircle, Building, Plus, X, Edit2, Trash2, ArrowUpRight, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [hrPerf, setHrPerf] = useState(null);
    const [itPerf, setItPerf] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', head_name: '' });
    const [compactView, setCompactView] = useState(false);

    useEffect(() => {
        fetchAdminData();
        fetchDepartments();

        // Real-time subscriptions for Admin Dashboard
        const candidateSubscription = supabase
            .channel('admin_candidate_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'candidates' },
                (payload) => {
                    console.log('Candidate change detected:', payload);
                    fetchAdminData();
                }
            )
            .subscribe();

        const itSubscription = supabase
            .channel('admin_it_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'it_requests' },
                (payload) => {
                    console.log('IT request change detected:', payload);
                    fetchAdminData();
                }
            )
            .subscribe();

        const policySubscription = supabase
            .channel('admin_policy_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'policy_documents' },
                (payload) => {
                    console.log('Policy change detected:', payload);
                    fetchAdminData();
                }
            )
            .subscribe();

        return () => {
            candidateSubscription.unsubscribe();
            itSubscription.unsubscribe();
            policySubscription.unsubscribe();
        };
    }, []);

    const fetchDepartments = async () => {
        const { data } = await supabase.from('operational_units').select('*').order('name');
        if (data) setDepartments(data);
    };

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const userEmail = localStorage.getItem('user_email');
            const [candRes, itRes, profileRes] = await Promise.all([
                supabase.from('candidates').select('*').order('created_at', { ascending: false }),
                supabase.from('it_requests').select('*'),
                supabase.from('profiles').select('compact_view').eq('email', userEmail).single()
            ]);

            const cands = candRes.data || [];
            const itReqs = itRes.data || [];
            if (profileRes.data) setCompactView(profileRes.data.compact_view);

            setCandidates(cands);

            // Calculate Metrics
            const total = cands.length;
            const completed = cands.filter(c => c.progress === 100).length;
            const active = total - completed;
            const pendingIT = cands.filter(c => c.progress === 80 && c.it_status !== 'Completed').length;

            // Month-over-Month logic
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
            const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

            const currentMonthCands = cands.filter(c => {
                const date = new Date(c.created_at);
                return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
            }).length;

            const lastMonthCands = cands.filter(c => {
                const date = new Date(c.created_at);
                return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
            }).length;

            const growthRate = lastMonthCands === 0 ? (currentMonthCands > 0 ? 100 : 0) :
                Math.round(((currentMonthCands - lastMonthCands) / lastMonthCands) * 100);

            setStats([
                { label: 'Total Talent Pipeline', value: total.toString(), subtitle: `${growthRate >= 0 ? '+' : ''}${growthRate}% growth MoM`, icon: Users, color: 'blue', trend: growthRate >= 0 ? 'up' : 'down' },
                { label: 'Active Onboarding', value: active.toString(), subtitle: 'Live processes', icon: TrendingUp, color: 'purple', trend: 'neutral' },
                { label: 'Operations Ready', value: completed.toString(), subtitle: 'Fully integrated', icon: CheckCircle, color: 'green', trend: 'up' },
                { label: 'Critical Actions', value: (pendingIT).toString(), subtitle: 'IT / Documentation', icon: AlertCircle, color: 'red', trend: 'warning' }
            ]);

            // Trend calculation
            const monthNames = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
            const trend = monthNames.map(m => {
                const count = cands.filter(c => {
                    const date = new Date(c.created_at);
                    return date.toLocaleString('default', { month: 'short' }) === m;
                }).length;
                return { month: m, value: count };
            });
            setMonthlyTrend(trend);

            // Performance metrics
            const hrRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            setHrPerf({
                title: 'Onboarding Velocity',
                rate: `${hrRate}%`,
                stats: [
                    { label: 'Active', value: active.toString(), color: '#6366f1' },
                    { label: 'Completed', value: completed.toString(), color: '#10b981' },
                    { label: 'Avg Cycle', value: '3.8d', color: '#f59e0b' }
                ]
            });

            const itTotal = itReqs.length;
            const itResolved = itReqs.filter(r => r.status === 'completed').length;
            const itEfficiency = itTotal > 0 ? Math.round((itResolved / itTotal) * 100) : 100;
            setItPerf({
                title: 'Infrastructure Delivery',
                rate: `${itEfficiency}%`,
                stats: [
                    { label: 'Pending', value: (itTotal - itResolved).toString(), color: '#ef4444' },
                    { label: 'Provisioned', value: itResolved.toString(), color: '#10b981' },
                    { label: 'SLA Status', value: '98%', color: '#6366f1' }
                ]
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDept = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('operational_units').insert([newDept]);
            if (error) throw error;
            fetchDepartments();
            setShowDeptModal(false);
            setNewDept({ name: '', head_name: '' });
        } catch (error) {
            alert('Error adding department: ' + error.message);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!confirm('Delete this department?')) return;
        try {
            await supabase.from('operational_units').delete().eq('id', id);
            fetchDepartments();
        } catch (error) {
            alert('Error deleting department');
        }
    };

    const handleResetAll = async () => {
        if (!confirm('Are you sure you want to RESET EVERYTHING? This will delete all candidates, IT requests, and clear asset assignments.')) return;

        setIsLoading(true);
        try {
            await Promise.all([
                supabase.from('candidates').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                supabase.from('it_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                supabase.from('candidate_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                supabase.from('assets').update({ status: 'Available', assigned_to: null }).neq('id', '00000000-0000-0000-0000-000000000000')
            ]);

            const candidates = [
                { full_name: 'Alex Rivera', email: 'alex.rivera@example.com', position: 'Senior Frontend Developer', department: 'Engineering', progress: 0, hr_status: 'Pending', it_status: 'Pending', location: 'Remote', employment_type: 'Full-time', ctc: 2800000, joining_date: '2024-02-15' },
                { full_name: 'Sarah Chen', email: 'sarah.chen@example.com', position: 'Product Designer', department: 'Design', progress: 0, hr_status: 'Pending', it_status: 'Pending', location: 'Remote', employment_type: 'Full-time', ctc: 2400000, joining_date: '2024-03-01' }
            ];

            const { data: newCands } = await supabase.from('candidates').insert(candidates).select();

            if (newCands) {
                const itReqs = newCands.map(c => ({
                    candidate_id: c.id,
                    request_type: 'Software, Access & Hardware',
                    items: 'Laptop, Monitor, Mouse, Email Access',
                    status: 'pending',
                    priority: 'medium'
                }));
                await supabase.from('it_requests').insert(itReqs);
            }

            fetchAdminData();
            alert('Portal has been reset to initial state.');
        } catch (error) {
            console.error('Reset error:', error.message);
            alert('Reset failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Admin Command Center</h1>
                    <p className="page-subtitle">Unified view of cross-departmental onboarding performance</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleResetAll} style={{ padding: '0.625rem 1.25rem', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} /> Reset Portal Data
                    </button>
                    <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>Real-time Sync Active</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: '10rem', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={48} color="#4f46e5" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '1.5rem', color: '#64748b', fontWeight: 500 }}>Synchronizing portal data...</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass"
                                style={{ padding: '1.75rem', borderRadius: '24px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}
                                whileHover={{ y: -5, borderColor: '#3b82f6', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', background: stat.color === 'blue' ? '#eff6ff' : stat.color === 'purple' ? '#f5f3ff' : stat.color === 'green' ? '#ecfdf5' : '#fff1f2', borderRadius: '14px', color: stat.color === 'blue' ? '#3b82f6' : stat.color === 'purple' ? '#8b5cf6' : stat.color === 'green' ? '#10b981' : '#f43f5e' }}>
                                        <stat.icon size={22} />
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: 800,
                                        padding: '0.375rem 0.625rem', borderRadius: '8px',
                                        background: stat.trend === 'up' ? '#ecfdf5' : stat.trend === 'down' ? '#fff1f2' : '#f8fafc',
                                        color: stat.trend === 'up' ? '#10b981' : stat.trend === 'down' ? '#f43f5e' : '#64748b',
                                        display: 'flex', alignItems: 'center', gap: '0.25rem'
                                    }}>
                                        {stat.trend === 'up' ? <TrendingUp size={14} /> : stat.trend === 'down' ? <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} /> : null}
                                        {stat.trend !== 'neutral' ? stat.subtitle.split(' ')[0] : 'Stable'}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{stat.label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.025em' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.5rem' }}>{stat.subtitle}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparative Operational Performance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                        {[hrPerf, itPerf].map((perf, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass"
                                style={{ padding: '2rem', borderRadius: '28px', border: '1px solid #f1f5f9', background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{perf.title}</h3>
                                        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Operational efficiency benchmark</p>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: i === 0 ? '#6366f1' : '#3b82f6' }}>{perf.rate}</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                    {perf.stats.map((s, idx) => (
                                        <div key={idx} style={{ padding: '1.25rem', background: 'white', borderRadius: '20px', border: '1px solid #f8fafc' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>{s.label}</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{s.value}</div>
                                            <div style={{ width: '40px', height: '3px', background: s.color, borderRadius: '2px', marginTop: '0.75rem' }} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate('/admin/analytics')}
                        className="section-card glass"
                        style={{ padding: '2.5rem', borderRadius: '28px', marginBottom: '2.5rem', cursor: 'pointer', border: '1px solid rgba(59, 130, 246, 0.1)' }}
                        whileHover={{ borderColor: '#3b82f6', background: 'rgba(239, 246, 255, 0.3)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Talent Acquisition velocity</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Real-time growth trend of onboarding pipeline</p>
                            </div>
                            <div className="btn-secondary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.8125rem', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                Analytics Report <ArrowUpRight size={16} style={{ marginLeft: '0.5rem' }} />
                            </div>
                        </div>
                        <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '0 1rem' }}>
                            {monthlyTrend.map((data, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max((data.value / (candidates.length || 1)) * 100, 15)}%` }}
                                            style={{
                                                width: '100%', maxWidth: '32px',
                                                background: data.month === 'Feb' ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)' : '#e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: data.month === 'Feb' ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none'
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: data.month === 'Feb' ? '#1e293b' : '#94a3b8' }}>{data.month}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                        {/* Section 1: Global Tracking */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="section-card glass" style={{ padding: compactView ? '1.5rem' : '2.5rem', borderRadius: '28px' }}>
                            <div className="section-header" style={{ marginBottom: compactView ? '1.5rem' : '2.5rem' }}>
                                <div>
                                    <h2 className="section-title" style={{ fontSize: compactView ? '1.25rem' : '1.5rem', fontWeight: 900 }}>Global Tracking</h2>
                                    <p className="section-subtitle">Individual candidate progress monitoring</p>
                                </div>
                                <button
                                    onClick={() => navigate('/admin/candidates/add')}
                                    className="btn-primary"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.625rem 1.25rem', borderRadius: '12px',
                                        fontSize: '0.875rem', fontWeight: 700,
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                                        border: 'none', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                                    }}
                                >
                                    <UserPlus size={18} /> Add New Candidate
                                </button>
                            </div>
                            <div className="candidate-list" style={{ display: 'grid', gap: '0.75rem' }}>
                                {candidates.map((c, i) => (
                                    <div key={c.id} style={{ padding: compactView ? '1rem 1.25rem' : '1.5rem', background: 'white', borderRadius: '20px', border: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: compactView ? '1rem' : '1.5rem' }}>
                                            <div className="candidate-avatar" style={{
                                                width: compactView ? '36px' : '48px', height: compactView ? '36px' : '48px',
                                                fontSize: compactView ? '0.875rem' : '1.125rem', fontWeight: 800,
                                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                                color: '#475569', border: '1px solid #e2e8f0'
                                            }}>{c.full_name?.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{c.full_name}</div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{c.position} • <span style={{ color: '#3b82f6', fontWeight: 700 }}>{c.department}</span></div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.25rem' }}>{c.progress}%</div>
                                                <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.progress}%` }} style={{ height: '100%', background: c.progress === 100 ? '#10b981' : 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(`Mark ${c.full_name} as fully onboarded?`)) return;
                                                        await supabase.from('candidates').update({ progress: 100, status: 'Completed', device_received: true, policy_accepted: true }).eq('id', c.id);
                                                        fetchAdminData();
                                                    }}
                                                    title="Mark as Completed"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <Link to={`/admin/candidates/${c.id}`} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}><ArrowUpRight size={18} /></Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Section 2: Manage Departments */}
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="section-card glass" style={{ padding: '2rem', borderRadius: '28px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div><h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>Operational Units</h2><p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Strategic department control</p></div>
                                    <button onClick={() => setShowDeptModal(true)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}><Plus size={20} /></button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {departments.map(dept => (
                                        <div key={dept.id} style={{ padding: '1rem', background: 'white', borderRadius: '16px', border: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1e293b' }}>{dept.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Head: {dept.head_name || 'TBD'}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDept(dept.id)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Live System Log Activity */}
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: '1.5rem', borderRadius: '28px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Live Event Stream</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                                    {[1, 2, 3, 4].map((_, i) => (
                                        <div key={i} style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(248, 250, 252, 0.5)', fontSize: '0.75rem' }}>
                                            <div style={{ color: '#1e293b', fontWeight: 700, marginBottom: '0.25rem' }}>System <span style={{ fontWeight: 500, color: '#64748b' }}>processed</span> DB_SYNC</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>{Math.floor(Math.random() * 59)} min ago • Nexus Core</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}

            {/* Department Modal */}
            <AnimatePresence>
                {showDeptModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Add New Unit</h2>
                            <form onSubmit={handleAddDept} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Department Name</label>
                                    <input type="text" value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Department Head</label>
                                    <input type="text" value={newDept.head_name} onChange={e => setNewDept({ ...newDept, head_name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setShowDeptModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#3b82f6', border: 'none', color: 'white', fontWeight: 700 }}>Add Unit</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
