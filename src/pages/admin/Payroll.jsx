import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, Users, Download, MoreVertical, Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Payroll = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [salaryData, setSalaryData] = useState([]);
    const [stats, setStats] = useState({
        totalMonthly: 0,
        pendingCount: 0,
        nextPayDate: 'Feb 1, 2026'
    });

    useEffect(() => {
        fetchPayrollData();
    }, []);

    const fetchPayrollData = async () => {
        setIsLoading(true);
        try {
            const { data: candidates, error } = await supabase
                .from('candidates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (candidates) {
                const mapped = candidates.map(c => {
                    let displayStatus = 'Pending';
                    if (c.payroll_status === 'Paid') {
                        displayStatus = 'Success';
                    } else if (c.progress >= 80 || c.status === 'Completed') {
                        displayStatus = 'Ready';
                    }

                    return {
                        ...c,
                        monthlySalary: Math.round((c.ctc || 0) / 12),
                        status: displayStatus
                    };
                });
                setSalaryData(mapped);

                const total = mapped.reduce((acc, curr) => acc + curr.monthlySalary, 0);
                const pendingCount = mapped.filter(m => m.status === 'Pending' || m.status === 'Ready').length;
                setStats({
                    totalMonthly: total,
                    pendingCount: pendingCount,
                    nextPayDate: 'Feb 1, 2026'
                });
            }
        } catch (error) {
            console.error('Payroll error:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            // Header
            const headers = ["Name", "Department", "CTC", "Monthly Gross", "Status"];

            // Rows - safely handle commas in fields
            const csvRows = salaryData.map(e => [
                `"${e.full_name || ''}"`,
                `"${e.department || ''}"`,
                `"${(e.ctc / 100000).toFixed(1)}L"`,
                `"${e.monthlySalary}"`,
                `"${e.status}"`
            ].join(","));

            const csvContent = [headers.join(","), ...csvRows].join("\n");

            // Create Blob
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'admin@nexus.com',
                action: 'EXPORT_PAYROLL_REPORT',
                table_name: 'candidates',
                new_data: { count: salaryData.length }
            }]);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export report');
        }
    };

    const handleProcessBatch = async () => {
        const readyCandidates = salaryData.filter(s => s.status === 'Ready');

        if (readyCandidates.length === 0) {
            alert('⚠️ No candidates are ready for payroll processing.\n\nPlease ensure onboarding (Document Verification) is completed (Progress 80%+) before executing batch.');
            return;
        }

        setIsProcessing(true);
        console.log('Processing payroll for ready candidates:', readyCandidates.map(s => s.full_name));

        try {
            // 1. Update Candidate Payroll Status ONLY for those who are Ready
            const { error: updateError } = await supabase
                .from('candidates')
                .update({
                    payroll_status: 'Paid',
                    last_payment_date: new Date().toISOString()
                })
                .in('id', readyCandidates.map(s => s.id));

            if (updateError) {
                console.error('Candidate update error:', updateError);
                throw new Error(`Failed to update candidate statuses: ${updateError.message}`);
            }

            // 2. Create the Batch Record
            const totalAmount = readyCandidates.reduce((acc, curr) => acc + curr.monthlySalary, 0);
            const { error: batchError } = await supabase
                .from('payroll_batches')
                .insert([{
                    batch_name: `Payroll Batch ${new Date().toLocaleDateString()}`,
                    total_amount: totalAmount,
                    employee_count: readyCandidates.length,
                    status: 'Processed'
                }]);

            if (batchError) {
                console.error('Batch creation error:', batchError);
            }

            // 3. Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'admin@nexus.com',
                action: 'PROCESS_PAYROLL_BATCH',
                table_name: 'payroll_batches',
                new_data: {
                    count: readyCandidates.length,
                    amount: totalAmount,
                    processed_at: new Date().toISOString()
                }
            }]);

            alert(`✅ Success! Payroll processed for ${readyCandidates.length} candidate(s).\n\nTheir statuses have been updated to "Success". Candidates who are still "Pending" or not verified were skipped.`);
            await fetchPayrollData(); // Refresh UI
        } catch (err) {
            console.error('PROCESS ERROR:', err);
            alert(`❌ Process Failed: ${err.message}\n\nIMPORTANT: Please ensure you have run the ULTIMATE_PAYROLL_FIX.sql script in your Supabase SQL Editor.`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div style={{ padding: '8rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#4f46e5" style={{ margin: '0 auto' }} /></div>;

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#6366f1', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                        <ShieldCheck size={14} /> Fiscal Intelligence
                    </div>
                    <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.025em' }}>Payroll Command</h1>
                    <p className="page-subtitle" style={{ fontSize: '1rem', color: '#64748b' }}>Unified disbursement management and salary analytics</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-secondary"
                        onClick={handleExport}
                        style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', borderRadius: '14px', padding: '0.875rem 1.5rem', fontWeight: 700, border: '1px solid #e2e8f0', background: 'white' }}
                    >
                        <Download size={18} /> Export Fiscal Report
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary"
                        disabled={isProcessing}
                        onClick={handleProcessBatch}
                        style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', borderRadius: '14px', padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', color: 'white', fontWeight: 800 }}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Execute Batch Processing</>}
                    </motion.button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Payroll projection', value: `₹${(stats.totalMonthly / 100000).toFixed(2)}L`, subtitle: 'Current active pipeline cost', icon: DollarSign, color: '#3b82f6', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
                    { label: 'Next cycle Disbursement', value: stats.nextPayDate, subtitle: 'Standard billing cycle', icon: Calendar, color: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' },
                    { label: 'Audit pending compliance', value: stats.pendingCount, subtitle: 'Awaiting finalize signals', icon: Users, color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass"
                        style={{ padding: '2rem', borderRadius: '28px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: stat.bg, opacity: 0.3, borderRadius: '50%', filter: 'blur(40px)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'white', color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <stat.icon size={22} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.025em' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>{stat.subtitle}</div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-card glass"
                style={{ padding: 0, borderRadius: '32px', overflow: 'hidden', border: '1px solid #f1f5f9' }}
            >
                <div style={{ padding: '2rem 2.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>Employee Salary Matrix</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Detailed breakdown of corporate disbursements</p>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                        LIVE DATA FEED
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fcfdfe', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ textAlign: 'left', padding: '1.25rem 2.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>OFFICIAL RECORD</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.75rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>UNIT</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.75rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ANNUAL VALUE</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.75rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>MONTHLY GROSS</th>
                                <th style={{ textAlign: 'right', padding: '1.25rem 2.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaryData.map((emp, i) => (
                                <motion.tr
                                    key={emp.id}
                                    whileHover={{ background: '#fcfdfe' }}
                                    style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                                >
                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '14px',
                                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                                color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, fontSize: '1rem', border: '1px solid #e2e8f0'
                                            }}>
                                                {emp.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{emp.full_name}</div>
                                                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{emp.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 1.75rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 700 }}>{emp.department}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem 1.75rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 800 }}>₹{(emp.ctc / 100000).toFixed(1)}L</div>
                                    </td>
                                    <td style={{ padding: '1.5rem 1.75rem' }}>
                                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 900 }}>₹{emp.monthlySalary.toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                        <span style={{
                                            padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                            background: emp.status === 'Success' ? '#ecfdf5' : (emp.status === 'Ready' ? '#eff6ff' : '#fffbeb'),
                                            color: emp.status === 'Success' ? '#10b981' : (emp.status === 'Ready' ? '#3b82f6' : '#f59e0b'),
                                            border: `1px solid ${emp.status === 'Success' ? '#d1fae5' : (emp.status === 'Ready' ? '#dbeafe' : '#fef3c7')}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                        }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                            {emp.status}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default Payroll;
