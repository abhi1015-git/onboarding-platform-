import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Users, FileText, Loader2, TrendingUp, ArrowUpRight, Target, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Analytics = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
        avgDays: 4.2
    });
    const [deptPerformance, setDeptPerformance] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        try {
            const [candRes, auditRes] = await Promise.all([
                supabase.from('candidates').select('*').order('created_at', { ascending: true }),
                supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
            ]);

            if (candRes.error) throw candRes.error;
            const candidates = candRes.data;
            setAuditLogs(auditRes.data || []);

            if (candidates) {
                const total = candidates.length;
                const completed = candidates.filter(c => c.progress === 100).length;
                const pending = total - completed;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                setStats({
                    total,
                    completed,
                    pending,
                    completionRate: rate,
                    avgDays: 4.2
                });

                // Calculate Dept Performance
                const depts = [...new Set(candidates.map(c => c.department || 'General'))];
                const deptStats = depts.map(d => {
                    const members = candidates.filter(c => c.department === d);
                    const comp = members.filter(m => m.progress === 100).length;
                    return {
                        name: d,
                        count: members.length,
                        rate: members.length > 0 ? Math.round((comp / members.length) * 100) : 0
                    };
                }).sort((a, b) => b.rate - a.rate);

                setDeptPerformance(deptStats);

                // Calculate Real Growth Trend
                const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
                const trend = months.map(month => {
                    const count = candidates.filter(c => {
                        const date = new Date(c.created_at);
                        const m = date.toLocaleString('default', { month: 'short' });
                        return m === month;
                    }).length;
                    return { month, value: count };
                });
                setMonthlyTrend(trend);
            }
        } catch (error) {
            console.error('Analytics error:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Loader2 className="animate-spin" size={48} color="#4f46e5" />
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title">Executive Analytics</h1>
                    <p className="page-subtitle">High-level insights into organizational growth and operational health</p>
                </div>
                <div className="glass" style={{ padding: '0.625rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <Activity size={18} color="#4f46e5" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>System Live Monitoring</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[
                    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: Target, color: '#3b82f6', trend: '+12% vs last month' },
                    { label: 'Total Hires', value: stats.total, icon: Users, color: '#8b5cf6', trend: 'Growing steadily' },
                    { label: 'Avg Onboarding', value: '4.2d', icon: Clock, color: '#10b981', trend: '-0.5d optimization' },
                    { label: 'Active Pipeline', value: stats.pending, icon: TrendingUp, color: '#f59e0b', trend: '8 urgent actions' }
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass" style={{ padding: '1.75rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <stat.icon size={20} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <ArrowUpRight size={14} /> {stat.trend.split(' ')[0]}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>{stat.trend}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Growth Chart */}
                <div className="section-card glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Onboarding Growth Trend</h3>
                        <select style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.875rem' }}>
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', paddingBottom: '2rem' }}>
                        {monthlyTrend.map((data, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(data.value / stats.total) * 180 + 20}px` }}
                                    style={{ width: '100%', maxWidth: '40px', background: 'linear-gradient(180deg, #4f46e5 0%, #818cf8 100%)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}
                                />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dept Distribution */}
                <div className="section-card glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem' }}>Dept Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {deptPerformance.slice(0, 5).map((dept, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{dept.name}</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#4f46e5' }}>{dept.rate}%</span>
                                </div>
                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${dept.rate}%` }} style={{ height: '100%', background: '#4f46e5', borderRadius: '3px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/admin/departments')}
                        style={{ width: '100%', marginTop: '2rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#4f46e5', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                        View All Departments
                    </button>
                </div>
            </div>
            <div className="section-card glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Live System Activity</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {auditLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No activity logs found.</div>
                    ) : auditLogs.map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', minWidth: '80px' }}>
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                                    {log.user_email.split('@')[0]} <span style={{ fontWeight: 500, color: '#64748b' }}>performed</span> {log.action.replace('_', ' ')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                    Table: {log.table_name} | ID: {log.record_id}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5' }}>NEW</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
