import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, LogOut, CheckCircle2, Circle,
    Clock, Server, Calendar, Info
} from 'lucide-react';

const Dashboard = ({ portal, onLogout }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="dashboard-container glass"
            style={{
                width: '100%',
                maxWidth: '1100px',
                padding: '2.5rem',
                borderRadius: '2rem',
                borderTop: `6px solid ${portal.color}`,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '3rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        backgroundColor: `${portal.color}22`,
                        padding: '1rem',
                        borderRadius: '1.25rem',
                        border: `1px solid ${portal.color}44`
                    }}>
                        <portal.icon color={portal.color} size={32} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h2 className="title-font" style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
                                {portal.label}
                            </h2>
                            <span style={{
                                backgroundColor: `${portal.color}33`,
                                color: portal.color,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '2rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Active Session
                            </span>
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>
                            Monitoring Pre-Onboarding Processes & Task Pipelines
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="submit-btn"
                    style={{
                        width: 'auto',
                        padding: '0.6rem 1.25rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        fontSize: '0.875rem'
                    }}
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>

            {/* Task Content based on User Image */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 className="title-font" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} color={portal.color} /> Pending Action Items
                </h3>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'left' }}>
                                <th style={{ padding: '0 1rem' }}>PROCESS STAGE</th>
                                <th style={{ padding: '0 1rem' }}>STEP</th>
                                <th style={{ padding: '0 1rem' }}>TIMELINE</th>
                                <th style={{ padding: '0 1rem' }}>SYSTEM USED</th>
                                <th style={{ padding: '0 1rem' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portal.tasks.map((task, index) => (
                                <motion.tr
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                >
                                    <td style={{ padding: '1.25rem 1rem', borderRadius: '0.75rem 0 0 0.75rem' }}>
                                        <span style={{ fontWeight: 500 }}>{task.stage}</span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{task.step}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.desc}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                                            <Calendar size={14} color="var(--text-muted)" />
                                            {task.timeline}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                                            <Server size={14} color="var(--text-muted)" />
                                            {task.system}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', borderRadius: '0 0.75rem 0.75rem 0' }}>
                                        <span style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            backgroundColor: task.status === 'Completed' || task.status === 'Complete' ? '#10b98122' : '#f59e0b22',
                                            color: task.status === 'Completed' || task.status === 'Complete' ? '#10b981' : '#f59e0b',
                                            border: `1px solid ${task.status === 'Completed' || task.status === 'Complete' ? '#10b98144' : '#f59e0b44'}`
                                        }}>
                                            {task.status}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Info */}
            <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                border: '1px solid var(--border)'
            }}>
                <Info size={20} color={portal.color} />
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    You are currently viewing the <strong>{portal.label}</strong> operational queue.
                    All tasks are synchronized with the central Nexus database and follow the pre-onboarding timeline as specified in the corporate guidelines.
                </p>
            </div>
        </motion.div>
    );
};

export default Dashboard;
