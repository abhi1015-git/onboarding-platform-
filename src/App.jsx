import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  Users, Cpu, GraduationCap, ShieldCheck, Zap,
  LayoutDashboard, Building2, Settings as SettingsIcon, DollarSign, TrendingUp,
  UserPlus, FileText, Calendar, Package, Laptop, Monitor,
  CheckCircle, Upload, Shield, Bell, User, Globe
} from 'lucide-react';
import PortalCard from './components/PortalCard';
import LoginForm from './components/LoginForm';
import PortalLayout from './components/PortalLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TeamsOverview from './pages/admin/TeamsOverview';
import TeamManagement from './pages/admin/TeamManagement';
import UserManagement from './pages/admin/UserManagement';
import Payroll from './pages/admin/Payroll';
import Analytics from './pages/admin/Analytics';

import Settings from './pages/admin/Settings';

// HR Pages
import HRDashboard from './pages/hr/HRDashboard';
import AddCandidate from './pages/hr/AddCandidate';
import CandidateList from './pages/hr/CandidateList';
import CandidateProfile from './pages/hr/CandidateProfile';
import HRDocuments from './pages/hr/Documents';
import Orientations from './pages/hr/Orientations';

// IT Pages
import ITDashboard from './pages/it/ITDashboard';
import RequestManagement from './pages/it/RequestManagement';
import RequestDetail from './pages/it/RequestDetail';
import AssetInventory from './pages/it/AssetInventory';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import AcceptOffer from './pages/candidate/AcceptOffer';
import UploadDocuments from './pages/candidate/UploadDocuments';
import PolicyAcknowledgement from './pages/candidate/PolicyAcknowledgement';
import PersonalInformation from './pages/candidate/PersonalInformation';
import DeviceReceipt from './pages/candidate/DeviceReceipt';
import Notifications from './pages/candidate/Notifications';
import MyOrientations from './pages/candidate/MyOrientations';

import './App.css';
import './Login.css';

const PORTALS = [
  {
    id: 'hr',
    label: 'HR Portal',
    icon: Users,
    color: '#3b82f6',
    email: 'hr@nexus.com',
    password: 'hr123',
    navigation: [
      { label: 'Dashboard', path: '/hr', icon: LayoutDashboard },
      { label: 'Candidates', path: '/hr/candidates', icon: Users },
      { label: 'Documents', path: '/hr/documents', icon: FileText },
      { label: 'Orientations', path: '/hr/orientations', icon: Calendar },
      { label: 'Settings', path: '/hr/settings', icon: SettingsIcon }
    ]
  },
  {
    id: 'it',
    label: 'IT Portal',
    icon: Cpu,
    color: '#f43f5e', // Reddish as seen in screenshot
    email: 'it@nexus.com',
    password: 'it123',
    navigation: [
      { label: 'Dashboard', path: '/it', icon: LayoutDashboard },
      { label: 'IT Requests', path: '/it/requests', icon: Package },
      { label: 'Asset Management', path: '/it/assets', icon: Monitor },
      { label: 'Orientations', path: '/it/orientations', icon: Calendar },
      { label: 'Settings', path: '/it/settings', icon: SettingsIcon }
    ]
  },
  {
    id: 'candidate',
    label: 'Candidate Portal',
    icon: GraduationCap,
    color: '#3b82f6', // Changed to blue to match screenshots
    email: 'user@nexus.com',
    password: 'user123',
    navigation: [
      { label: 'Dashboard', path: '/candidate', icon: LayoutDashboard },
      { label: 'Notifications', path: '/candidate/notifications', icon: Bell },
      { label: 'My Orientations', path: '/candidate/orientations', icon: Calendar },
      { label: 'Accept offer', path: '/candidate/accept-offer', icon: FileText },
      { label: 'Upload Documents', path: '/candidate/upload-documents', icon: Upload },
      { label: 'Personal Information', path: '/candidate/personal-info', icon: User },
      { label: 'Policy Acceptance', path: '/candidate/policies', icon: Shield },
      { label: 'Device Receipt', path: '/candidate/device-receipt', icon: Monitor }
    ]
  },
  {
    id: 'admin',
    label: 'Admin Portal',
    icon: ShieldCheck,
    color: '#8b5cf6', // Magenta/Purple
    email: 'admin@nexus.com',
    password: 'admin123',
    navigation: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Candidates', path: '/admin/candidates', icon: Users },
      { label: 'Teams Overview', path: '/admin/teams-overview', icon: Users },
      { label: 'Add Candidate', path: '/admin/candidates/add', icon: UserPlus },
      { label: 'Departments', path: '/admin/departments', icon: Building2 },
      { label: 'User Management', path: '/admin/users', icon: Users },
      { label: 'Payroll', path: '/admin/payroll', icon: DollarSign },
      { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
      { label: 'Settings', path: '/admin/settings', icon: SettingsIcon }
    ]
  }
];

// Login Page Component
function LoginPage({ onLogin }) {
  const [activePortal, setActivePortal] = useState(PORTALS[0]);

  return (

    <div className="login-wrapper">
      <header className="login-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Zap size={32} color="white" />
          </div>
          <h1 className="title-font logo-text">
            LokaChakra<span className="logo-dot">.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <p className="login-subtitle" style={{ margin: 0 }}>
            Onboarding Management Portal
          </p>
        </div>
      </header>

      <main className="login-main">
        <div className="portals-grid">
          {PORTALS.map((portal) => (
            <PortalCard
              key={portal.id}
              {...portal}
              isActive={activePortal.id === portal.id}
              onClick={() => setActivePortal(portal)}
            />
          ))}
        </div>

        <LoginForm
          portal={activePortal}
          onLogin={onLogin}
          allPortals={PORTALS}
        />

        <div className="demo-access">
          <p className="demo-text">
            SYSTEM ACCESS: Use portal specific credentials below or select a portal above.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
            <span>Admin: admin@nexus.com</span>
            <span>HR: hr@nexus.com</span>
            <span>IT: it@nexus.com</span>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        © 2026 LokaChakra Solutions. All rights reserved.
      </footer>
    </div>
  );

}

// Portal Routes Component
function PortalRoutes({ portal }) {
  switch (portal.id) {
    case 'admin':
      return (
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/add" element={<AddCandidate />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          <Route path="/teams-overview" element={<TeamsOverview />} />
          <Route path="/departments" element={<TeamManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings portalRole="admin" />} />
        </Routes>
      );
    case 'hr':
      return (
        <Routes>
          <Route path="/" element={<HRDashboard />} />
          <Route path="/candidates/add" element={<AddCandidate />} />
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          <Route path="/documents" element={<HRDocuments />} />
          <Route path="/orientations" element={<Orientations />} />
          <Route path="/settings" element={<Settings portalRole="hr" />} />
        </Routes>
      );
    case 'it':
      return (
        <Routes>
          <Route path="/" element={<ITDashboard />} />
          <Route path="/requests" element={<RequestManagement />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/assets" element={<AssetInventory />} />
          <Route path="/orientations" element={<Orientations />} />
          <Route path="/settings" element={<Settings portalRole="it" />} />
        </Routes>
      );
    case 'explorer':
      return (
        <Routes>
          <Route path="*" element={<BlockchainExplorer />} />
        </Routes>
      );
    case 'candidate':
      return (
        <Routes>
          <Route path="/" element={<CandidateDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/orientations" element={<MyOrientations />} />
          <Route path="/accept-offer" element={<AcceptOffer />} />
          <Route path="/upload-documents" element={<UploadDocuments />} />
          <Route path="/personal-info" element={<PersonalInformation />} />
          <Route path="/policies" element={<PolicyAcknowledgement />} />
          <Route path="/device-receipt" element={<DeviceReceipt />} />
        </Routes>
      );
    default:
      return <Navigate to="/" />;
  }
}

function App() {
  const [userPortal, setUserPortal] = useState(() => {
    const saved = localStorage.getItem('user_portal_id');
    return saved ? PORTALS.find(p => p.id === saved) : null;
  });

  const handleLogin = (portal) => {
    setUserPortal(portal);
    localStorage.setItem('user_portal_id', portal.id);
  };

  const handleLogout = () => {
    setUserPortal(null);
    localStorage.removeItem('user_portal_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('candidate_id');
    localStorage.removeItem('user_name');
  };

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/"
          element={
            userPortal ? (
              <Navigate to={`/${userPortal.id}`} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />


        {/* Portal Routes */}
        {PORTALS.map((portal) => (
          <Route
            key={portal.id}
            path={`/${portal.id}/*`}
            element={
              userPortal && userPortal.id === portal.id ? (
                <PortalLayout
                  portal={portal}
                  navigationItems={portal.navigation}
                  onLogout={handleLogout}
                >
                  <ErrorBoundary>
                    <PortalRoutes portal={portal} />
                  </ErrorBoundary>
                </PortalLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
        ))}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
