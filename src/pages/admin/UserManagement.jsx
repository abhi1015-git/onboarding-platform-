import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, X, Loader2, UserPlus, Shield, Trash2, Edit2, BadgeCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const UserManagement = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '', // Added password field
        role: 'hr',
        phone: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            password: user.password || '', // Added password
            role: user.role || 'hr',
            phone: user.phone || '',
            status: user.status || 'Active'
        });
        setSelectedUserId(user.id);
        setIsEditing(true);
        setShowAddModal(true);
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = validatePassword(formData.password);
        if (!validation.isValid) {
            let errorMsg = "Password must meet the following requirements:\n";
            if (validation.errors.length) errorMsg += "• At least 8 characters\n";
            if (validation.errors.upper) errorMsg += "• At least one uppercase letter\n";
            if (validation.errors.lower) errorMsg += "• At least one lowercase letter\n";
            if (validation.errors.number) errorMsg += "• At least one number\n";
            if (validation.errors.special) errorMsg += "• At least one special character (@$!%*?&#)\n";
            alert(errorMsg);
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('profiles')
                    .update(formData)
                    .eq('id', selectedUserId);
                if (error) throw error;
                alert('User account updated successfully.');
            } else {
                const { error } = await supabase
                    .from('profiles')
                    .insert([formData]);
                if (error) throw error;
                alert('User account created successfully.');
            }

            setShowAddModal(false);
            setIsEditing(false);
            setSelectedUserId(null);
            setFormData({ full_name: '', email: '', password: '', role: 'hr', phone: '', status: 'Active' });
            fetchUsers();
        } catch (error) {
            alert('Error saving user: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            fetchUsers();
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Assign roles and manage access for HR and IT department leads</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setIsEditing(false);
                        setFormData({ full_name: '', email: '', password: '', role: 'hr', phone: '', status: 'Active' });
                        setShowAddModal(true);
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.875rem 1.75rem', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
                        border: 'none'
                    }}
                >
                    <Plus size={20} /> Add System User
                </button>
            </div>

            {/* Stats Overview Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Users', value: users.length, color: '#4f46e5' },
                    { label: 'Active Admins', value: users.filter(u => u.role === 'admin').length, color: '#ef4444' },
                    { label: 'HR Leads', value: users.filter(u => u.role === 'hr').length, color: '#3b82f6' },
                    { label: 'IT Specialists', value: users.filter(u => u.role === 'it').length, color: '#8b5cf6' }
                ].map((stat, i) => (
                    <div key={i} className="glass" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Search and Table */}
            <div className="section-card glass" style={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name, email or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1.25rem 2rem' }}>User details</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem' }}>Access Role</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem' }}>Security</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem' }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '1.25rem 2rem' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} /></td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '1.25rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{user.full_name?.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.full_name}</div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.375rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                            background: user.role === 'admin' ? '#fef2f2' : user.role === 'hr' ? '#eff6ff' : '#f5f3ff',
                                            color: user.role === 'admin' ? '#ef4444' : user.role === 'hr' ? '#3b82f6' : '#8b5cf6'
                                        }}>{user.role}</span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        {user.password ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8125rem', fontWeight: 700 }}>
                                                <ShieldCheck size={14} /> Password Set
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500 }}>
                                                <Shield size={14} /> Default
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 700 }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
                                            Active
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEditClick(user)} className="icon-btn" style={{ color: '#64748b' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="icon-btn" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isEditing ? 'Edit System User' : 'Add System User'}</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Full Name</label>
                                    <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Email Address</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="rahul@nexus.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Login Password</label>
                                    <input required type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="Set a secure password" />
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem', lineHeight: '1.4' }}>
                                        Must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&#)
                                    </p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>System Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}>
                                        <option value="hr">HR Manager</option>
                                        <option value="it">IT Specialist</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                                    <button type="submit" disabled={isSaving} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', background: '#4f46e5', color: 'white', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><BadgeCheck size={18} /> {isEditing ? 'Save Changes' : 'Create Account'}</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
