import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, BookOpen, GraduationCap, Users, Settings, CreditCard, Bus, MessageSquare } from 'lucide-react';

const CreateSchool = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    adminName: '',
    adminEmail: '',
    adminPass: '',
    schoolName: '',
    primaryColor: '#10B981',
    levels: { primary: true, secondary: true },
    roles: { admin: true, teacher: true, parent: true, student: false },
    modules: {
      attendance: true,
      gradebook: true,
      finance: false,
      messaging: true,
      library: false,
      transport: false
    }
  });

  const toggleLevel = (level) => {
    setConfig({ ...config, levels: { ...config.levels, [level]: !config.levels[level] } });
  };

  const toggleRole = (role) => {
    setConfig({ ...config, roles: { ...config.roles, [role]: !config.roles[role] } });
  };

  const toggleModule = (mod) => {
    setConfig({ ...config, modules: { ...config.modules, [mod]: !config.modules[mod] } });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        adminName: config.adminName,
        adminEmail: config.adminEmail,
        adminPass: config.adminPass,
        schoolName: config.schoolName,
        primaryColor: config.primaryColor,
        hasPrimary: config.levels.primary,
        hasSecondary: config.levels.secondary,
        configJson: JSON.stringify({ roles: config.roles, modules: config.modules })
      };

      const res = await fetch('http://localhost:8080/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create school");
      const data = await res.json();
      
      // Save data locally for quick access
      localStorage.setItem('edvance_school_config', JSON.stringify({
        ...config,
        schoolId: data.schoolId,
        userRole: 'Admin',
        userId: data.adminId
      }));

      navigate('/admin');
    } catch (err) {
      alert("Error creating school: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: "'Open Sans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 12px 0px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Building size={24} />
          </div>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", margin: 0, fontSize: '32px', color: '#0f172a' }}>
            Create Your School
          </h1>
        </div>

        {/* STEP 1: Basics & Levels */}
        {step === 1 && (
          <div className="wizard-step">
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '24px', marginBottom: '24px' }}>1. School Structure</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>School Name</label>
              <input 
                type="text" 
                value={config.schoolName}
                onChange={(e) => setConfig({...config, schoolName: e.target.value})}
                placeholder="e.g. Severna Private School"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', marginBottom: '16px' }}
              />

              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Admin Name</label>
              <input 
                type="text" 
                value={config.adminName}
                onChange={(e) => setConfig({...config, adminName: e.target.value})}
                placeholder="John Doe"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', marginBottom: '16px' }}
              />

              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Admin Email</label>
              <input 
                type="email" 
                value={config.adminEmail}
                onChange={(e) => setConfig({...config, adminEmail: e.target.value})}
                placeholder="admin@school.com"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', marginBottom: '16px' }}
              />

              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Admin Password</label>
              <input 
                type="password" 
                value={config.adminPass}
                onChange={(e) => setConfig({...config, adminPass: e.target.value})}
                placeholder="Secure password"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px' }}
              />
            </div>

            <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px' }}>Which levels does your school support?</label>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
              <div 
                onClick={() => toggleLevel('primary')}
                style={{ flex: 1, padding: '24px', border: `2px solid ${config.levels.primary ? '#10B981' : '#e2e8f0'}`, borderRadius: '16px', cursor: 'pointer', backgroundColor: config.levels.primary ? '#ecfdf5' : 'white' }}
              >
                <BookOpen size={32} color={config.levels.primary ? '#10B981' : '#94a3b8'} style={{marginBottom: '12px'}} />
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", margin: 0 }}>Primary School</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Grades K-5</p>
              </div>
              <div 
                onClick={() => toggleLevel('secondary')}
                style={{ flex: 1, padding: '24px', border: `2px solid ${config.levels.secondary ? '#10B981' : '#e2e8f0'}`, borderRadius: '16px', cursor: 'pointer', backgroundColor: config.levels.secondary ? '#ecfdf5' : 'white' }}
              >
                <GraduationCap size={32} color={config.levels.secondary ? '#10B981' : '#94a3b8'} style={{marginBottom: '12px'}} />
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", margin: 0 }}>Secondary School</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Grades 6-12</p>
              </div>
            </div>

            <button className="btn-primary btn-lg" onClick={() => setStep(2)}>
              <span>Next: Select Roles</span>
            </button>
          </div>
        )}

        {/* STEP 2: Roles */}
        {step === 2 && (
          <div className="wizard-step">
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '24px', marginBottom: '24px' }}>2. Role Management</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Select which user types should have access to portals.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
              {Object.keys(config.roles).map(role => (
                <div 
                  key={role}
                  onClick={() => toggleRole(role)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', border: `2px solid ${config.roles[role] ? '#10B981' : '#e2e8f0'}`, borderRadius: '16px', cursor: 'pointer', backgroundColor: config.roles[role] ? '#ecfdf5' : 'white' }}
                >
                  <Users size={24} color={config.roles[role] ? '#10B981' : '#94a3b8'} />
                  <div>
                    <h3 style={{ fontFamily: "'Fredoka', sans-serif", margin: 0, textTransform: 'capitalize' }}>{role}s</h3>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-secondary btn-lg" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary btn-lg" onClick={() => setStep(3)}>
                <span>Next: Choose Modules</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Modules */}
        {step === 3 && (
          <div className="wizard-step">
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '24px', marginBottom: '24px' }}>3. Feature Customization</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Enable only the modules your school needs. 100% customizable.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
              {Object.keys(config.modules).map(mod => (
                <div 
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: `2px solid ${config.modules[mod] ? '#10B981' : '#e2e8f0'}`, borderRadius: '16px', cursor: 'pointer', backgroundColor: config.modules[mod] ? '#ecfdf5' : 'white' }}
                >
                  <Settings size={20} color={config.modules[mod] ? '#10B981' : '#94a3b8'} />
                  <div>
                    <h3 style={{ fontFamily: "'Fredoka', sans-serif", margin: 0, textTransform: 'capitalize' }}>{mod}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-secondary btn-lg" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary btn-lg" onClick={() => setStep(4)}>
                <span>Next: Branding</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Branding */}
        {step === 4 && (
          <div className="wizard-step">
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '24px', marginBottom: '24px' }}>4. Branding & Colors</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Select the primary color for your school's portals.</p>
            
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input 
                type="color" 
                value={config.primaryColor}
                onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                style={{ width: '60px', height: '60px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{config.primaryColor}</div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-secondary btn-lg" onClick={() => setStep(3)}>Back</button>
              <button className="btn-primary btn-lg" onClick={handleFinish} disabled={loading} style={{ backgroundColor: config.primaryColor }}>
                <span>{loading ? 'Creating...' : 'Generate Portals'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CreateSchool;
