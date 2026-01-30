import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Video, ExternalLink, Mail, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MyOrientations = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [orientations, setOrientations] = useState([]);
    const [personalMeetings, setPersonalMeetings] = useState([]);
    const [activeTab, setActiveTab] = useState('orientations'); // 'orientations' or 'meetings'

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const candidateId = localStorage.getItem('candidate_id');
            if (!candidateId) return;

            const [orientRes, meetRes] = await Promise.all([
                supabase
                    .from('orientations')
                    .select('*')
                    .order('date', { ascending: true }),
                supabase
                    .from('meetings')
                    .select('*')
                    .eq('candidate_id', candidateId)
                    .order('scheduled_at', { ascending: true })
            ]);

            if (orientRes.error) throw orientRes.error;
            if (meetRes.error) throw meetRes.error;

            setOrientations(orientRes.data || []);
            setPersonalMeetings(meetRes.data || []);
        } catch (error) {
            console.error('Error fetching event data:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const joinMeeting = (link, type) => {
        if (type === 'zoom' && link.includes('zoom.us/j/')) {
            try {
                const url = new URL(link);
                const meetingId = url.pathname.split('/').pop();
                const pwd = url.searchParams.get('pwd');
                const userName = encodeURIComponent(localStorage.getItem('user_name') || 'Nexus Participant');

                // Deep link protocol
                const appLink = `zoommtg://zoom.us/join?confno=${meetingId}&pwd=${pwd}&uname=${userName}`;

                // Use a non-disruptive way to trigger the protocol
                const a = document.createElement('a');
                a.href = appLink;
                a.click();

                // Open the web version as a secondary backup after delay
                setTimeout(() => {
                    window.open(link, '_blank');
                }, 1500);
            } catch (e) {
                window.open(link, '_blank');
            }
        } else {
            // Standard fallback for Teams or non-standard Zoom links
            window.open(link, '_blank');
        }
    };

    if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ margin: '0 auto' }} /></div>;

    const displayData = activeTab === 'orientations' ? orientations : personalMeetings;

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Schedule & Events</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.9375rem', color: '#64748b' }}>View your upcoming orientations and 1-on-1 syncs</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('orientations')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'orientations' ? '3px solid #3b82f6' : '3px solid transparent',
                        color: activeTab === 'orientations' ? '#1e293b' : '#64748b',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        transition: 'all 0.2s'
                    }}
                >
                    General Orientations ({orientations.length})
                </button>
                <button
                    onClick={() => setActiveTab('meetings')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'meetings' ? '3px solid #3b82f6' : '3px solid transparent',
                        color: activeTab === 'meetings' ? '#1e293b' : '#64748b',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <User size={16} /> My 1-on-1 Syncs ({personalMeetings.length})
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div className="main-content">
                    {displayData.length === 0 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1.5rem', border: '1px dashed #e2e8f0' }}>
                            <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>No {activeTab} scheduled</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Check back later or contact HR for more details.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {displayData.map((event, index) => {
                                const date = new Date(event.date || event.scheduled_at);
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="section-card shadow-sm"
                                        style={{
                                            padding: '1.75rem', display: 'flex', gap: '2rem', alignItems: 'center',
                                            borderRadius: '1.5rem', border: '1px solid #e2e8f0', background: 'white',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        {activeTab === 'meetings' && (
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }} />
                                        )}

                                        <div style={{
                                            width: '72px', height: '72px', borderRadius: '16px',
                                            background: '#f8fafc', border: '1px solid #e2e8f0',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                                                {date.getDate()}
                                            </div>
                                            <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>
                                                {date.toLocaleString('default', { month: 'short' })}
                                            </div>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{event.title}</h4>
                                                {activeTab === 'meetings' && (
                                                    <span style={{ fontSize: '0.625rem', padding: '0.25rem 0.625rem', borderRadius: '6px', background: '#dbeafe', color: '#1e40af', fontWeight: 800, textTransform: 'uppercase' }}>1-on-1 Sync</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Clock size={16} color="#94a3b8" /> {event.time || new Date(event.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <MapPin size={16} color="#94a3b8" /> {event.location || (event.meeting_type === 'zoom' ? 'Zoom Meeting' : 'Teams Meeting')}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <button
                                                onClick={() => joinMeeting((event.location?.startsWith('http') ? event.location : (event.meeting_link || '#')), event.meeting_type)}
                                                style={{
                                                    padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white',
                                                    border: 'none', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer',
                                                    boxShadow: '0 6px 12px -2px rgba(59, 130, 246, 0.3)', textDecoration: 'none'
                                                }}
                                            >
                                                <Video size={18} /> Join Now
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="sidebar">
                    <div className="section-card shadow-sm" style={{ padding: '2rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: '#1e40af' }}>
                            <Mail size={22} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>Sync Support</h3>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '1.5rem', lineHeight: 1.6, fontWeight: 500 }}>
                            Can't make it to a scheduled sync? Please notify your HR coordinator or the meeting organizer at least 2 hours in advance.
                        </p>
                        <a href="mailto:hr@lokachakra.com" style={{
                            fontSize: '0.9375rem', color: '#2563eb', fontWeight: 800,
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'white', padding: '0.75rem 1rem', borderRadius: '10px', width: 'fit-content'
                        }}>
                            hr@lokachakra.com <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyOrientations;

