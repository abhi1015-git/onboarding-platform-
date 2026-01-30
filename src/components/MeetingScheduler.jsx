import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, Link as LinkIcon, Plus, Loader2, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MeetingScheduler = ({ candidateId, candidateName }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        title: 'Onboarding Sync',
        meeting_type: 'zoom',
        scheduled_at: '',
        meeting_link: ''
    });

    useEffect(() => {
        if (candidateId) fetchMeetings();
    }, [candidateId]);

    const fetchMeetings = async () => {
        try {
            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            setMeetings(data || []);
        } catch (err) {
            console.error('Error fetching meetings:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateZoomLink = () => {
        const meetingId = Math.floor(1000000000 + Math.random() * 9000000000);
        const pwd = Math.random().toString(36).substring(7);
        return {
            web: `https://zoom.us/j/${meetingId}?pwd=${pwd}`,
            app: `zoommtg://zoom.us/join?confno=${meetingId}&pwd=${pwd}&uname=${encodeURIComponent(localStorage.getItem('user_name') || 'Nexus User')}`
        };
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        setScheduling(true);
        try {
            let finalLink = newMeeting.meeting_link;

            if (!finalLink && newMeeting.meeting_type === 'zoom') {
                const zoom = generateZoomLink();
                finalLink = zoom.web;
            } else if (!finalLink) {
                finalLink = 'https://teams.microsoft.com/l/meetup-join/demo';
            }

            const { error } = await supabase
                .from('meetings')
                .insert({
                    candidate_id: candidateId,
                    title: newMeeting.title,
                    meeting_type: newMeeting.meeting_type,
                    meeting_link: finalLink,
                    scheduled_at: newMeeting.scheduled_at
                });

            if (error) throw error;

            // Audit Log
            await supabase.from('audit_logs').insert([{
                user_email: localStorage.getItem('user_email') || 'hr@nexus.com',
                action: 'SCHEDULE_MEETING_ZOOM',
                table_name: 'meetings',
                record_id: candidateId,
                new_data: { ...newMeeting, meeting_link: finalLink }
            }]);

            setShowForm(false);
            fetchMeetings();
            alert('Meeting scheduled! The Zoom app will be automatically prompted upon joining.');
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setScheduling(false);
        }
    };

    const joinMeeting = (link, type) => {
        if (type === 'zoom' && link.includes('zoom.us/j/')) {
            try {
                const url = new URL(link);
                const meetingId = url.pathname.split('/').pop();
                const pwd = url.searchParams.get('pwd');
                const userName = encodeURIComponent(localStorage.getItem('user_name') || 'Nexus User');

                // Deep link protocol
                const appLink = `zoommtg://zoom.us/join?confno=${meetingId}&pwd=${pwd}&uname=${userName}`;

                // Use a non-disruptive way to trigger the protocol
                const a = document.createElement('a');
                a.href = appLink;
                a.click();

                // Fallback to web link in a new tab after a short delay
                setTimeout(() => {
                    window.open(link, '_blank');
                }, 1500);
            } catch (e) {
                window.open(link, '_blank');
            }
        } else {
            window.open(link, '_blank');
        }
    };

    return (
        <div className="meeting-manager glass" style={{ padding: '1.5rem', borderRadius: '24px', marginTop: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.4)', background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Video size={20} color="#3b82f6" /> Interview & Sync
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                    style={{
                        padding: '0.625rem 1.25rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: showForm ? '#f1f5f9' : 'var(--primary)',
                        color: showForm ? '#64748b' : 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {showForm ? 'Cancel' : <><Plus size={16} /> Schedule Sync</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSchedule} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Title</label>
                            <input
                                type="text"
                                value={newMeeting.title}
                                onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                                placeholder="e.g. Technical Interview"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Platform</label>
                            <select
                                value={newMeeting.meeting_type}
                                onChange={e => setNewMeeting({ ...newMeeting, meeting_type: e.target.value })}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9375rem', background: 'white' }}
                            >
                                <option value="zoom">Zoom (Auto-connect App)</option>
                                <option value="teams">Microsoft Teams</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Schedule Date & Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={newMeeting.scheduled_at}
                                onChange={e => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Meeting Link</label>
                            <input
                                type="url"
                                placeholder="Leave blank to auto-generate Link"
                                value={newMeeting.meeting_link}
                                onChange={e => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9375rem' }}
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={scheduling} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                        {scheduling ? <Loader2 className="animate-spin" size={20} /> : 'Schedule & Notify Candidate'}
                    </button>
                    <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                        Choosing Zoom will automatically generate a secure meeting ID and app injection link.
                    </div>
                </form>
            )}

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={24} color="#3b82f6" /></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {meetings.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(248, 250, 252, 0.5)', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
                            <Calendar size={32} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>No upcoming meetings scheduled for {candidateName}.</p>
                        </div>
                    ) : meetings.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                    background: m.meeting_type === 'zoom' ? '#eff6ff' : '#f5f3ff',
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: m.meeting_type === 'zoom' ? '#3b82f6' : '#8b5cf6'
                                }}>
                                    <Video size={24} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{m.title}</div>
                                    <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <Clock size={14} /> {new Date(m.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '6px', background: '#f1f5f9', fontWeight: 600 }}>{m.meeting_type.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => joinMeeting(m.meeting_link, m.meeting_type)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    background: m.meeting_type === 'zoom' ? '#3b82f6' : '#8b5cf6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Zap size={16} /> Open {m.meeting_type === 'zoom' ? 'Zoom App' : 'Teams'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MeetingScheduler;
