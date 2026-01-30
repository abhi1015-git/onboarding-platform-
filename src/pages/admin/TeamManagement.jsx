import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Edit, Trash2, Search, Loader2, TrendingUp, MoreHorizontal, UserCheck, X, Mail, Building2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TeamManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [newUnit, setNewUnit] = useState({
        name: '',
        head_name: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            // Fetch from operational_units table
            const { data: units, error } = await supabase
                .from('operational_units')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            // Also fetch candidate counts per department
            const { data: candCounts } = await supabase
                .from('candidates')
                .select('department, progress');

            const stats = units?.map(unit => {
                const members = candCounts?.filter(c => c.department === unit.name) || [];
                const completed = members.filter(m => m.progress === 100).length;
                return {
                    ...unit,
                    membersCount: members.length,
                    completedCount: completed,
                    efficiency: members.length > 0 ? Math.round((completed / members.length) * 100) : 0,
                    color: getDeptColor(unit.name)
                };
            });

            setDepartments(stats || []);
        } catch (error) {
            console.error('Error fetching departments:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('operational_units')
                .insert([newUnit]);

            if (error) throw error;
            setIsAddModalOpen(false);
            setNewUnit({ name: '', head_name: '', status: 'Active' });
            fetchDepartments();
        } catch (error) {
            alert('Error creating unit: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            const { error } = await supabase
                .from('operational_units')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchDepartments();
        } catch (error) {
            alert('Error deleting department');
        }
    };

    const getDeptColor = (name) => {
        const colors = ['#3b82f6', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'];
        const index = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
        return colors[index];
    };

    const filteredDepts = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.head_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title">Operational Units</h1>
                    <p className="page-subtitle">Strategic management of organization departments and leadership</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderRadius: '12px' }}>
                        <Plus size={18} /> Add New Unit
                    </button>
                </div>
            </div>

            {/* Premium Search & Filters */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search departments or heads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: '8rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#4f46e5" style={{ margin: '0 auto' }} /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {filteredDepts.length === 0 ? (
                        <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '6rem', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                            <Building2 size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: '#64748b' }}>No operational units found.</p>
                        </div>
                    ) : (
                        filteredDepts.map((dept, index) => (
                            <motion.div
                                key={dept.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="section-card glass"
                                style={{ padding: '2rem', borderRadius: '24px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${dept.color}15`, color: dept.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building2 size={26} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleDeleteDept(dept.id)} className="icon-btn" style={{ color: '#ef4444', background: '#fef2f2' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>{dept.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>
                                    <User size={16} /> Head: {dept.head_name || 'Unassigned'}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Staff Count</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{dept.membersCount}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Efficiency</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{dept.efficiency}%</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <span style={{ color: '#64748b' }}>Fulfillment Progress</span>
                                        <span style={{ color: '#1e293b' }}>{dept.completedCount}/{dept.membersCount} Completed</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${dept.efficiency}%` }} style={{ height: '100%', background: dept.color, borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create New Unit</h2>
                                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unit Name</label>
                                    <input required type="text" value={newUnit.name} onChange={e => setNewUnit({ ...newUnit, name: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="e.g. Strategic Growth" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unit Head</label>
                                    <input type="text" value={newUnit.head_name} onChange={e => setNewUnit({ ...newUnit, head_name: e.target.value })} style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="Manager Name" />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                                    <button type="submit" disabled={isSaving} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700 }}>
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Create Unit'}
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

export default TeamManagement;
