import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Monitor, Shield, TrendingUp, CheckCircle,
    Clock, AlertCircle, ChevronRight, UserPlus, Loader2, X, Mail, Phone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TeamsOverview = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [overallStats, setOverallStats] = useState({
        activeCandidates: 0,
        pendingDocs: 0,
        awaitingHardware: 0,
        readyOrientation: 0
    });

    useEffect(() => {
        fetchTeamsData();
    }, []);

    const fetchTeamsData = async () => {
        setIsLoading(true);
        try {
            const { data: candidates } = await supabase.from('candidates').select('*');
            const { data: profiles } = await supabase.from('profiles').select('*');
            const { data: itReqs } = await supabase.from('it_requests').select('status');

            setAllProfiles(profiles || []);

            const memberCounts = {
                hr: profiles?.filter(p => p.role === 'hr').length || 0,
                it: profiles?.filter(p => p.role === 'it').length || 0,
                admin: profiles?.filter(p => p.role === 'admin').length || 0
            };

            const candStats = {
                total: candidates?.length || 0,
                completed: candidates?.filter(c => c.progress === 100).length || 0,
                pending: candidates?.filter(c => c.progress < 100).length || 0,
                pendingDocs: candidates?.filter(c => c.progress < 60).length || 0,
                readyOrientation: candidates?.filter(c => c.progress >= 80 && c.progress < 100).length || 0
            };

            const itStats = {
                pending: itReqs?.filter(r => r.status === 'pending').length || 0,
                completed: itReqs?.filter(r => r.status === 'completed').length || 0,
                processing: itReqs?.filter(r => r.status === 'processing').length || 0
            };

            setTeams([
                {
                    id: 'hr',
                    name: 'HR Team',
                    membersCount: memberCounts.hr,
                    lead: 'Mallika Chenna',
                    color: '#3b82f6',
                    stats: [
                        { label: 'Total Candidates', value: candStats.total.toString(), color: '#3b82f6' },
                        { label: 'Completed', value: candStats.completed.toString(), color: '#10b981' },
                        { label: 'In Progress', value: candStats.pending.toString(), color: '#f59e0b' }
                    ],
                    completion: candStats.total > 0 ? Math.round((candStats.completed / candStats.total) * 100) : 0
                },
                {
                    id: 'it',
                    name: 'IT Team',
                    membersCount: memberCounts.it,
                    lead: 'Amit Singh',
                    color: '#f43f5e',
                    stats: [
                        { label: 'Pending', value: itStats.pending.toString(), color: '#f59e0b' },
                        { label: 'Completed', value: itStats.completed.toString(), color: '#10b981' },
                        { label: 'Processing', value: itStats.processing.toString(), color: '#3b82f6' }
                    ],
                    completion: itStats.pending + itStats.completed + itStats.processing > 0
                        ? Math.round((itStats.completed / (itStats.pending + itStats.completed + itStats.processing)) * 100) : 0
                },
                {
                    id: 'admin',
                    name: 'Administrative',
                    membersCount: memberCounts.admin,
                    lead: 'System Admin',
                    color: '#8b5cf6',
                    stats: [
                        { label: 'Profiles', value: (profiles?.length || 0).toString(), color: '#3b82f6' },
                        { label: 'Active', value: profiles?.filter(p => p.status === 'Active').length.toString(), color: '#10b981' },
                        { label: 'System Health', value: 'Optimal', color: '#10b981' }
                    ],
                    completion: 100
                }
            ]);

            setOverallStats({
                activeCandidates: candStats.pending,
                pendingDocs: candStats.pendingDocs,
                awaitingHardware: itStats.pending,
                readyOrientation: candStats.readyOrientation
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#4f46e5" style={{ margin: '0 auto' }} /></div>;

    const filteredMembers = selectedTeam ? allProfiles.filter(p => p.role === selectedTeam.id) : [];

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Teams Performance</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>Deep-dive into departmental effectiveness and member statistics.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {teams.map((team, index) => (
                    <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="section-card glass"
                        style={{ padding: '1.75rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px',
                                    background: `${team.color}15`, color: team.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {team.id === 'hr' ? <Users size={24} /> : team.id === 'it' ? <Monitor size={24} /> : <Shield size={24} />}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>{team.name}</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Lead: {team.lead} • {team.membersCount} Members</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: team.color }}>{team.completion}%</div>
                                <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Fulfillment</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {team.stats.map((stat, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>{stat.value}</div>
                                    <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${team.completion}%` }} style={{ height: '100%', background: team.color, borderRadius: '4px' }} />
                        </div>

                        <button
                            onClick={() => setSelectedTeam(team)}
                            className="view-details-btn"
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '10px',
                                border: `1px solid ${team.color}30`, background: 'white',
                                color: team.color, fontWeight: 700, fontSize: '0.875rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            View Team Members <ChevronRight size={16} />
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Overall Summary */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <TrendingUp size={24} color="#4f46e5" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Operational Pipeline Overview</h2>
                </div>
                <div className="section-card glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        {[
                            { label: 'Active Candidates', value: overallStats.activeCandidates, color: '#3b82f6', desc: 'In onboarding flow' },
                            { label: 'Pending Verification', value: overallStats.pendingDocs, color: '#f59e0b', desc: 'Documentation stage' },
                            { label: 'IT Queue', value: overallStats.awaitingHardware, color: '#ef4444', desc: 'Hardware assignments' },
                            { label: 'Ready for Handoff', value: overallStats.readyOrientation, color: '#10b981', desc: 'Orientation stage' }
                        ].map((stat, idx) => (
                            <div key={idx} style={{ borderRight: idx < 3 ? '1px solid #f1f5f9' : 'none', paddingRight: '1rem' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>{stat.label}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{stat.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Details Modal */}
            <AnimatePresence>
                {selectedTeam && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass" style={{ width: '100%', maxWidth: '800px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.4)' }}>
                            <div style={{ padding: '2rem', background: `${selectedTeam.color}08`, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${selectedTeam.color}22`, color: selectedTeam.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{selectedTeam.name} Members</h2>
                                        <p style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Showing active profiles assigned to {selectedTeam.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTeam(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}><X size={24} /></button>
                            </div>
                            <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '1.5rem' }}>
                                {filteredMembers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <AlertCircle size={40} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                                        <p style={{ color: '#64748b' }}>No members found for this team in the database.</p>
                                    </div>
                                ) : (
                                    <table className="table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '1rem' }}>Member</th>
                                                <th style={{ textAlign: 'left', padding: '1rem' }}>Contact</th>
                                                <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMembers.map((member, i) => (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem' }}>{member.full_name?.charAt(0)}</div>
                                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>{member.full_name}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}><Mail size={12} /> {member.email}</div>
                                                            {member.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}><Phone size={12} /> {member.phone}</div>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className={`status-badge ${member.status?.toLowerCase() || 'active'}`} style={{ fontSize: '0.75rem' }}>{member.status || 'Active'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div style={{ padding: '1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setSelectedTeam(null)} className="btn-secondary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>Close</button>
                                <button onClick={() => { setSelectedTeam(null); /* Navigate to UserManagement with filter? */ }} className="btn-primary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>Full Profile</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamsOverview;
