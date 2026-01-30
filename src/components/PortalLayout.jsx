import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Zap, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PortalLayout = ({ portal, children, navigationItems, onLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [themeColor, setThemeColor] = useState(portal.color);

    React.useEffect(() => {
        const fetchTheme = async () => {
            try {
                const userEmail = localStorage.getItem('user_email');
                const query = supabase.from('profiles').select('theme_color');

                if (userEmail) {
                    query.eq('email', userEmail);
                } else {
                    query.eq('role', portal.id);
                }

                const { data } = await query.single();

                if (data?.theme_color) {
                    setThemeColor(data.theme_color);
                    document.documentElement.style.setProperty('--primary', data.theme_color);
                    document.documentElement.style.setProperty('--active-color', data.theme_color);
                } else {
                    document.documentElement.style.setProperty('--primary', portal.color);
                    document.documentElement.style.setProperty('--active-color', portal.color);
                }
            } catch (err) {
                console.error('Error fetching theme:', err);
            }
        };
        fetchTheme();
    }, [portal.id, portal.color]);

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate('/');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={`portal-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Inject dynamic theme styles */}
            <style>
                {`
                    :root {
                        --primary: ${themeColor};
                        --active-color: ${themeColor};
                    }
                    .btn-primary { background-color: ${themeColor} !important; }
                    .nav-item.active { background-color: ${themeColor}15 !important; color: ${themeColor} !important; }
                    .nav-indicator { background-color: ${themeColor} !important; }
                    .stat-icon.active { color: ${themeColor} !important; }
                `}
            </style>

            {/* Header */}
            <header className="portal-header glass">
                <div className="portal-brand">
                    <button
                        className="mobile-menu-btn"
                        onClick={toggleSidebar}
                        style={{ background: 'none', border: 'none', color: '#64748b', marginRight: '0.5rem', display: 'none', cursor: 'pointer' }}
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="brand-icon" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}>
                        <Zap size={24} color="white" />
                    </div>
                    <h1 className="brand-name">
                        LokaChakra<span style={{ color: themeColor }}>.</span>
                    </h1>
                    <span className="portal-badge" style={{ backgroundColor: `${themeColor}22`, color: themeColor }}>
                        {portal.label}
                    </span>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} /> <span className="logout-text">Sign Out</span>
                </button>
            </header>

            <div className="portal-container">
                {/* Backdrop for mobile */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleSidebar}
                            className="sidebar-backdrop"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar Navigation */}
                <aside className={`portal-sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
                    <nav className="portal-nav">
                        {navigationItems.map((item, index) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== `/${portal.id}` && location.pathname.startsWith(item.path));

                            return (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    style={{
                                        '--active-color': themeColor
                                    }}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="nav-indicator"
                                            style={{ backgroundColor: themeColor }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="portal-main">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PortalLayout;
