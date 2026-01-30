import React from 'react';
import { motion } from 'framer-motion';

const PortalCard = ({ id, label, icon: Icon, color, isActive, onClick }) => {
    return (
        <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`portal-card ${isActive ? 'active' : ''}`}
            style={{
                borderColor: isActive ? color : 'var(--border)',
                '--active-color': color
            }}
        >
            <div
                className="icon-wrapper"
                style={{
                    backgroundColor: isActive ? color : 'var(--bg-tertiary)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)'
                }}
            >
                <Icon size={24} color="currentColor" />
            </div>
            <span
                className="portal-label"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
                {label}
            </span>

            {isActive && (
                <motion.div
                    layoutId="activeTab"
                    className="active-indicator"
                    style={{
                        position: 'absolute',
                        bottom: '-4px',
                        width: '40%',
                        height: '4px',
                        borderRadius: '4px',
                        backgroundColor: color
                    }}
                />
            )}
        </motion.button>
    );
};

export default PortalCard;
