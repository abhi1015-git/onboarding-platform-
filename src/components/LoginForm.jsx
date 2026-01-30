import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LoginForm = ({ portal, onLogin, allPortals }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // 1. If Candidate Portal, check credentials in candidates table
            if (portal.id === 'candidate') {
                const { data: candIT, error: itError } = await supabase
                    .from('candidates')
                    .select('*')
                    .eq('it_email', trimmedEmail)
                    .eq('it_password', trimmedPassword)
                    .single();

                if (candIT && !itError) {
                    console.log('Candidate login success via IT credentials:', candIT);
                    localStorage.setItem('candidate_id', candIT.id);
                    localStorage.setItem('user_email', trimmedEmail);
                    setIsLoading(false);
                    if (onLogin) onLogin(portal);
                    return;
                }
            }

            // 2. Check Profiles Table (Safe check - column might be missing)
            // Note: We try to match email and role if password check is problematic 
            // but for now we follow the existing logic but more carefully
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', trimmedEmail)
                    .eq('password', trimmedPassword)
                    .single();

                if (profile && !profileError) {
                    console.log('Profile login success:', profile);
                    localStorage.setItem('user_email', trimmedEmail);
                    localStorage.setItem('user_role', profile.role);

                    // Identify which portal this role belongs to
                    const targetPortal = allPortals.find(p => p.id === profile.role) || portal;
                    setIsLoading(false);
                    if (onLogin) onLogin(targetPortal);
                    return;
                }
            } catch (pErr) {
                console.warn('Profiles table check failed (likely no password column):', pErr);
            }

            // 3. Mock Auth Fallback (Universal Check across all portals)
            const matchedPortal = allPortals.find(p =>
                p.email.toLowerCase() === trimmedEmail.toLowerCase() &&
                p.password === trimmedPassword
            );

            if (matchedPortal) {
                console.log('Mock login success for portal:', matchedPortal.id);
                localStorage.setItem('user_email', trimmedEmail);
                localStorage.setItem('user_role', matchedPortal.id);

                setTimeout(() => {
                    setIsLoading(false);
                    if (onLogin) onLogin(matchedPortal);
                }, 800);
                return;
            }

            // 4. Supabase Auth (Final effort)
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: trimmedPassword,
            });

            if (!authError) {
                console.log('Supabase auth success:', data);
                localStorage.setItem('user_email', trimmedEmail);
                setIsLoading(false);
                if (onLogin) onLogin(portal);
                return;
            }

            setError('Invalid email or password');
            setIsLoading(false);

        } catch (err) {
            console.error('Unexpected auth error:', err);
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            key={portal.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="login-container glass"
        >
            <div className="form-header">
                <h2 className="title-font form-title">
                    {portal.label}
                </h2>
                <p className="form-subtitle">
                    Welcome back! Please enter your details.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Username / Email</label>
                    <div className="input-wrapper">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <a href="#" className="forgot-link">Forgot Password?</a>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="error-message"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading}
                    style={{
                        backgroundColor: portal.color,
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? (
                        <Loader2 className="loader" />
                    ) : (
                        <>
                            Login to Portal <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default LoginForm;
