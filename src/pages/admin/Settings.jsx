import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, Bell, Lock, Globe, Mail,
    Database, Palette, User, Shield, Zap, Save, RefreshCw, Loader2, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SettingsPage = ({ portalRole = 'hr' }) => {
    const [activeTab, setActiveTab] = useState('Account');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        job_title: '',
        phone_number: '',
        email_notifications: true,
        push_notifications: true,
        candidate_updates: false,
        resource_alerts: true,
        theme_color: '#3b82f6',
        compact_view: false,
        slack_integrated: false,
        teams_integrated: false
    });

    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        isUpdating: false
    });

    const tabs = [
        { name: 'Account', icon: User },
        { name: 'Notifications', icon: Bell },
        { name: 'Security', icon: Shield },
        { name: 'Appearance', icon: Palette },
        { name: 'Integrations', icon: Zap }
    ];

    useEffect(() => {
        fetchProfile();
    }, [portalRole]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', portalRole)
                .single();

            if (error) {
                console.warn('Profile not found, using defaults.');
            } else if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Get current user email for precise matching
            const userEmail = localStorage.getItem('user_email');

            // Define columns we want to save (matching what's in the DB)
            const savePayload = {
                ...profile,
                updated_at: new Date().toISOString()
            };

            // Remove internal UI state that might not be in DB yet if user hasn't run SQL
            // But we already provided the SQL, so we try to save everything.
            // If it fails, we fall back to a safer set.

            const { error } = await supabase
                .from('profiles')
                .upsert(savePayload, { onConflict: 'email' });

            if (error) {
                console.error('Initial upsert failed:', error.message);
                // Fallback attempt with minimal mandatory columns if schema is old
                const { error: fallbackError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: profile.full_name,
                        phone: profile.phone_number,
                        department: profile.department,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', profile.email || userEmail);

                if (fallbackError) throw fallbackError;
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error.message);
            alert('Failed to save settings: ' + error.message + '\n\nPlease ensure you have run the UPGRADE_TABLES.sql script in your Supabase SQL Editor.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!security.newPassword) return;

        setSecurity(prev => ({ ...prev, isUpdating: true }));
        try {
            const { error } = await supabase.auth.updateUser({
                password: security.newPassword
            });

            if (error) throw error;

            alert('Password updated successfully!');
            setSecurity({ currentPassword: '', newPassword: '', isUpdating: false });
        } catch (error) {
            alert('Error updating password: ' + error.message);
            setSecurity(prev => ({ ...prev, isUpdating: false }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleNotification = (key) => {
        setProfile(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={40} color="#3b82f6" />
                    <p style={{ color: '#64748b', fontWeight: 500 }}>Loading your preferences...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'Account':
                return (
                    <div className="settings-tab-content">
                        <div className="settings-group" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', color: '#1e293b', letterSpacing: '-0.01em' }}>Personal Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', fontSize: '0.875rem' }}>Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={profile.full_name || ''}
                                        onChange={handleChange}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem', transition: 'all 0.2s' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', fontSize: '0.875rem' }}>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email || ''}
                                        onChange={handleChange}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', fontSize: '0.875rem' }}>Job Title</label>
                                    <input
                                        type="text"
                                        name="job_title"
                                        value={profile.job_title || ''}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="e.g. Talent Acquisition Manager"
                                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', fontSize: '0.875rem' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={profile.phone_number || ''}
                                        onChange={handleChange}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Notifications':
                return (
                    <div className="settings-tab-content">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', color: '#1e293b', letterSpacing: '-0.01em' }}>Notification Preferences</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { id: 'email_notifications', title: 'Email Notifications', desc: 'Receive daily updates and report via email.' },
                                { id: 'push_notifications', title: 'Push Notifications', desc: 'Get real-time alerts on your desktop.' },
                                { id: 'candidate_updates', title: 'Candidate Updates', desc: 'Notify when a candidate completes a step.' },
                                { id: 'resource_alerts', title: 'Resource Alerts', desc: 'Alert when IT inventory levels are low.' }
                            ].map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => toggleNotification(item.id)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '1.25rem 1.5rem', background: 'white', borderRadius: '16px',
                                        border: '1px solid #f1f5f9', cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>{item.desc}</div>
                                    </div>
                                    <div style={{
                                        width: '48px', height: '24px', borderRadius: '12px',
                                        background: profile[item.id] ? '#3b82f6' : '#e2e8f0',
                                        position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        <div style={{
                                            width: '18px', height: '18px', background: 'white', borderRadius: '50%',
                                            position: 'absolute', top: '3px',
                                            left: profile[item.id] ? '27px' : '3px',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}></div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            case 'Security':
                return (
                    <div className="settings-tab-content">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', color: '#1e293b', letterSpacing: '-0.01em' }}>Security Settings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', fontSize: '0.875rem' }}>Current Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={security.currentPassword}
                                    onChange={e => setSecurity({ ...security, currentPassword: e.target.value })}
                                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'block', fontSize: '0.875rem' }}>New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={security.newPassword}
                                    onChange={e => setSecurity({ ...security, newPassword: e.target.value })}
                                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <button
                                className="btn-primary"
                                onClick={handleUpdatePassword}
                                disabled={security.isUpdating || !security.newPassword}
                                style={{ padding: '0.875rem', borderRadius: '12px', fontSize: '0.9375rem', fontWeight: 700, marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {security.isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
                            </button>
                        </div>
                    </div>
                );
            case 'Appearance':
                return (
                    <div className="settings-tab-content">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', color: '#1e293b', letterSpacing: '-0.01em' }}>Visual Preferences</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div>
                                <label style={{ fontWeight: 700, color: '#475569', marginBottom: '1rem', display: 'block', fontSize: '0.875rem' }}>Primary Theme Color</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setProfile({ ...profile, theme_color: color });
                                                document.documentElement.style.setProperty('--primary', color);
                                                document.documentElement.style.setProperty('--active-color', color);
                                            }}
                                            style={{
                                                width: '44px', height: '44px', borderRadius: '12px', background: color,
                                                border: profile.theme_color === color ? '4px solid #1e293b' : 'none',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>Compact View</div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Show more data on dashboards with reduced padding.</div>
                                </div>
                                <div
                                    onClick={() => setProfile({ ...profile, compact_view: !profile.compact_view })}
                                    style={{
                                        width: '48px', height: '24px', borderRadius: '12px',
                                        background: profile.compact_view ? '#3b82f6' : '#e2e8f0',
                                        position: 'relative', cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '3px',
                                        left: profile.compact_view ? '27px' : '3px',
                                        transition: 'all 0.2s'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Integrations':
                return (
                    <div className="settings-tab-content">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', color: '#1e293b', letterSpacing: '-0.01em' }}>Connected Apps</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {[
                                { id: 'slack_integrated', name: 'Slack', desc: 'Send automated status alerts to channels.' },
                                { id: 'teams_integrated', name: 'Microsoft Teams', desc: 'Sync onboarding sessions to Teams calendar.' }
                            ].map(app => (
                                <div key={app.id} style={{ padding: '1.5rem', border: '1px solid #f1f5f9', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Zap size={24} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{app.name}</div>
                                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{app.desc}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setProfile({ ...profile, [app.id]: !profile[app.id] })}
                                        style={{
                                            padding: '0.625rem 1.25rem', borderRadius: '10px',
                                            background: profile[app.id] ? '#fef2f2' : '#eff6ff',
                                            color: profile[app.id] ? '#ef4444' : '#3b82f6',
                                            border: 'none', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer'
                                        }}
                                    >
                                        {profile[app.id] ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Lock size={32} color="#94a3b8" />
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>Section Placeholder</h3>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>We're working on making the {activeTab} section available.</p>
                    </div>
                );
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em' }}>Profile Settings</h1>
                    <p style={{ fontSize: '1rem', color: '#64748b', marginTop: '0.5rem' }}>Manage your {portalRole.toUpperCase()} account preferences.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, fontSize: '0.875rem' }}
                            >
                                <CheckCircle2 size={18} /> Changes Saved!
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={fetchProfile}
                        disabled={isLoading}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', borderRadius: '12px', padding: '0.75rem 1.25rem' }}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="btn-primary"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            borderRadius: '12px', padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)'
                        }}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', alignItems: 'start' }}>
                {/* Tabs Sidebar */}
                <div className="glass" style={{ padding: '0.75rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem 1.25rem', borderRadius: '16px', border: 'none',
                                    background: activeTab === tab.name ? '#eff6ff' : 'transparent',
                                    color: activeTab === tab.name ? '#3b82f6' : '#64748b',
                                    fontWeight: activeTab === tab.name ? 800 : 500,
                                    fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}
                            >
                                <tab.icon size={20} strokeWidth={activeTab === tab.name ? 2.5 : 2} />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Settings Panel */}
                <div className="glass" style={{ padding: '3rem', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.4)', minHeight: '500px' }}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
