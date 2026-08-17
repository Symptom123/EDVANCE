import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Users, Settings, GraduationCap, LogOut } from 'lucide-react';

const SecondaryPortal = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('edvance_school_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    } else {
      navigate('/register');
    }
  }, [navigate]);

  if (!config) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f5f4f0' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'system-ui' }}>Loading your portal...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ "--btn-color": config.primaryColor, display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Open Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '24px', color: config.primaryColor, margin: '0 0 40px' }}>
          {config.schoolName || 'Secondary Portal'}
        </h1>

        <div style={{ "--btn-color": config.primaryColor, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ padding: '12px 16px', backgroundColor: config.primaryColor + "15", color: config.primaryColor, borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Home size={20} /> Dashboard
          </div>

          {/* Render Customized Roles */}
          <div style={{ margin: '20px 0 8px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Roles</div>
          {Object.keys(config.roles).map(role => config.roles[role] && (
            <div key={role} style={{ padding: '10px 16px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <Users size={18} /> {role.charAt(0).toUpperCase() + role.slice(1)}s
            </div>
          ))}

          {/* Render Customized Modules */}
          <div style={{ margin: '20px 0 8px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enabled Modules</div>
          {Object.keys(config.modules).map(mod => config.modules[mod] && (
            <div key={mod} style={{ padding: '10px 16px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <Settings size={18} /> {mod.charAt(0).toUpperCase() + mod.slice(1)}
            </div>
          ))}
        </div>

        <Link to="/" style={{ padding: '12px 16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', fontWeight: 600 }}>
          <LogOut size={20} /> Exit Portal
        </Link>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <GraduationCap size={48} color={config.primaryColor} style={{ marginBottom: '24px' }} />
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '32px', color: '#0f172a', margin: '0 0 16px' }}>Secondary School Portal is Ready</h2>
          <p style={{ color: '#64748b', fontSize: '18px', maxWidth: '500px' }}>
            This empty shell represents your customized portal. Only the roles and modules you enabled during setup are visible in the sidebar.
          </p>
          
          {config.levels.primary && (
            <Link to="/portal/primary" className="btn-secondary" style={{ marginTop: '32px', border: '2px solid #3b82f6', color: config.primaryColor }}>
              <span>Switch to Primary Portal</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecondaryPortal;

