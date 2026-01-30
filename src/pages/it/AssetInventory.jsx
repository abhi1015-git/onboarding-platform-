import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Search, Plus, Edit,
    CheckCircle, AlertCircle, Laptop, MousePointer, Cpu, Loader2, X, Tag, Barcode, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AssetManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        asset_tag: '',
        serial_number: '',
        category: 'Laptop',
        name: '',
        status: 'Available'
    });

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [assigneeName, setAssigneeName] = useState('');

    const [stats, setStats] = useState([
        { label: 'Total Assets', value: '0', icon: Cpu, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Available', value: '0', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
        { label: 'Assigned', value: '0', icon: Monitor, color: '#6366f1', bg: '#eef2ff' },
        { label: 'Maintenance', value: '0', icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7' }
    ]);

    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState('');
    const [suggestedAssetTag, setSuggestedAssetTag] = useState('');

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('assets')
                .select('*, candidates(full_name)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching assets:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);

                // Set empty state regardless of error type
                setAssets([]);
                setStats([
                    { label: 'Total Assets', value: '0', icon: Cpu, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Available', value: '0', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Assigned', value: '0', icon: Monitor, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Maintenance', value: '0', icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7' }
                ]);
                return;
            }

            if (data) {
                console.log('Assets fetched successfully:', data.length, 'assets');
                setAssets(data);
                const total = data.length;
                const available = data.filter(a => a.status === 'Available').length;
                const assigned = data.filter(a => a.status === 'Assigned').length;
                const maintenance = data.filter(a => a.status === 'Maintenance').length;

                setStats([
                    { label: 'Total Assets', value: total.toString(), icon: Cpu, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Available', value: available.toString(), icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Assigned', value: assigned.toString(), icon: Monitor, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Maintenance', value: maintenance.toString(), icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7' }
                ]);
            } else {
                // No data returned
                console.log('No assets found in database');
                setAssets([]);
            }
        } catch (error) {
            console.error('Exception in fetchAssets:', error);
            setAssets([]);
            setStats([
                { label: 'Total Assets', value: '0', icon: Cpu, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Available', value: '0', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
                { label: 'Assigned', value: '0', icon: Monitor, color: '#6366f1', bg: '#eef2ff' },
                { label: 'Maintenance', value: '0', icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateNextAssetTag = async () => {
        try {
            const { data, error } = await supabase
                .from('assets')
                .select('asset_tag')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching asset tags:', error);
                return 'LOKA-001'; // Default if error
            }

            if (!data || data.length === 0) {
                return 'LOKA-001'; // First asset
            }

            // Extract numeric parts from all asset tags
            const numbers = data
                .map(asset => {
                    const match = asset.asset_tag?.match(/LOKA-(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(num => num > 0);

            // Find the highest number
            const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
            const nextNumber = maxNumber + 1;

            // Format with leading zeros (e.g., LOKA-008)
            return `LOKA-${String(nextNumber).padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating asset tag:', error);
            return 'LOKA-001';
        }
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('assets')
                .insert([{
                    ...formData,
                    type: formData.category // Sync category and type for consistency
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setFormData({ asset_tag: '', serial_number: '', category: 'Laptop', name: '', status: 'Available' });
            fetchAssets();
        } catch (error) {
            console.error('Error adding asset:', error.message);
            alert('Error adding asset: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchCandidates = async () => {
        const { data, error } = await supabase.from('candidates').select('id, full_name, email');
        if (!error && data) setCandidates(data);
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedCandidateId) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('assets')
                .update({
                    status: 'Assigned',
                    assigned_to: selectedCandidateId
                })
                .eq('id', selectedAsset.id);

            if (error) throw error;

            setIsAssignModalOpen(false);
            setSelectedCandidateId('');
            setSelectedAsset(null);
            fetchAssets();
        } catch (error) {
            console.error('Error assigning asset:', error.message);
            alert('Error assigning asset: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const openAssignModal = (asset) => {
        setSelectedAsset(asset);
        fetchCandidates();
        setIsAssignModalOpen(true);
    };

    const openAddAssetModal = async () => {
        const nextTag = await generateNextAssetTag();
        setSuggestedAssetTag(nextTag);
        setFormData({
            asset_tag: nextTag,
            serial_number: '',
            category: 'Laptop',
            name: '',
            status: 'Available'
        });
        setIsModalOpen(true);
    };

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('laptop')) return Laptop;
        if (t.includes('mouse')) return MousePointer;
        if (t.includes('monitor')) return Monitor;
        if (t.includes('phone') || t.includes('mobile')) return Laptop; // Or a mobile icon if available
        return Cpu;
    };

    const filteredAssets = assets.filter(a =>
        a.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Asset Management</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>Manage company hardware and equipment</p>
                </div>
                <button
                    onClick={openAddAssetModal}
                    className="btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1.5rem',
                        borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)', fontWeight: 700
                    }}
                >
                    <Plus size={18} /> Add Asset
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="stat-card glass"
                        style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: stat.bg, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="section-card glass" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by Asset ID, Serial Number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Assets Table */}
            <div className="section-card glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>All Assets</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: '#3b82f6' }} />
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Asset ID</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Serial Number</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand & Model</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9375rem' }}>No assets found in the inventory.</td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset, index) => {
                                        const Icon = getIcon(asset.category);
                                        return (
                                            <motion.tr
                                                key={asset.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                style={{ borderBottom: '1px solid #f8fafc' }}
                                            >
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <Icon size={18} color="#64748b" />
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{asset.asset_tag}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{asset.serial_number}</td>
                                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', color: '#4b5563', fontWeight: 600 }}>{asset.category}</td>
                                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.8125rem', color: '#4b5563', fontWeight: 600 }}>{asset.name}</td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <span style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                                                        fontSize: '0.75rem', fontWeight: 700,
                                                        color: asset.status === 'Available' ? '#10b981' : asset.status === 'Assigned' ? '#3b82f6' : '#f59e0b'
                                                    }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
                                                        <button style={{ padding: '0.375rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}><Edit size={16} /></button>
                                                        {asset.status === 'Available' ? (
                                                            <button
                                                                onClick={() => openAssignModal(asset)}
                                                                style={{
                                                                    padding: '0.5rem 1rem', background: '#3b82f6', color: 'white',
                                                                    border: 'none', borderRadius: '8px', fontSize: '0.75rem',
                                                                    fontWeight: 700, cursor: 'pointer'
                                                                }}
                                                            >Assign</button>
                                                        ) : (
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                                Assigned to: <span style={{ color: '#1e293b' }}>{asset.candidates?.full_name || '—'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Asset Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        padding: '2rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{
                                background: 'white', borderRadius: '28px', width: '100%', maxWidth: '500px',
                                padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>New Asset</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Add a new hardware item to the inventory.</p>

                            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>
                                            Asset Tag
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 500, color: '#10b981' }}>● Auto-generated</span>
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Tag size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input
                                                required
                                                type="text"
                                                placeholder="LOKA-001"
                                                value={formData.asset_tag}
                                                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem 1rem 0.875rem 2.5rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid #10b981',
                                                    background: '#f0fdf4'
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem' }}>
                                            Next available tag. You can edit if needed.
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Serial Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <Barcode size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input
                                                required
                                                type="text"
                                                placeholder="SN789...123"
                                                value={formData.serial_number}
                                                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Name / Model</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="MacBook Pro M3 - 16GB"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}
                                        >
                                            <option value="Laptop">Laptop</option>
                                            <option value="Monitor">Monitor</option>
                                            <option value="Mouse">Mouse / Peripheral</option>
                                            <option value="Mobile">Mobile Phone</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Initial Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}
                                        >
                                            <option value="Available">Available</option>
                                            <option value="Assigned">Assigned</option>
                                            <option value="Maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="btn-primary"
                                        style={{
                                            flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Register Asset'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Asset Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        padding: '2rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{
                                background: 'white', borderRadius: '28px', width: '100%', maxWidth: '450px',
                                padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Assign Asset</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Allocate <strong>{selectedAsset?.name}</strong> ({selectedAsset?.asset_tag}) to a candidate.</p>

                            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.625rem', color: '#475569', fontSize: '0.875rem' }}>Select Candidate</label>
                                    <div style={{ position: 'relative' }}>
                                        <Users size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <select
                                            required
                                            value={selectedCandidateId}
                                            onChange={(e) => setSelectedCandidateId(e.target.value)}
                                            style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }}
                                        >
                                            <option value="">Choose a candidate...</option>
                                            {candidates.map(c => (
                                                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsAssignModalOpen(false)}
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="btn-primary"
                                        style={{
                                            flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Complete Assignment'}
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

export default AssetManagement;
