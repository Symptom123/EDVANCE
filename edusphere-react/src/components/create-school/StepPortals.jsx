import React from 'react';
import { Shield, GraduationCap, Users, BookOpen } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { SCHOOL_TYPES, ROLE_LABELS, STUDENT_SUB_FEATURES } from '../../data/portalConfig';

const ROLE_ICONS = {
  admin: Shield,
  teacher: GraduationCap,
  parents: Users,
  parent: Users,
  student: BookOpen,
};

function StepPortals({ onNext, onBack }) {
  const { draft, updatePortal, toggleStudentSubFeature } = useSchool();
  const roles = SCHOOL_TYPES[draft.type]?.roles || [];

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2>Customize your portals</h2>
        <p>
          Enable or disable portals, rename them, and set welcome messages.
          You have 100% control over what each role sees.
        </p>
      </div>

      <div className="portal-customize-list">
        {roles.map((role) => {
          const portal = draft.portals[role] || {};
          const Icon = ROLE_ICONS[role] || Shield;
          const defaultLabel = ROLE_LABELS[role]?.default || role;

          return (
            <div key={role} className={`portal-customize-card ${portal.enabled ? 'enabled' : 'disabled'}`}>
              <div className="portal-customize-header">
                <div className="portal-customize-icon">
                  <Icon size={22} />
                </div>
                <div className="portal-customize-title">
                  <h3>{defaultLabel} Portal</h3>
                  <span className="portal-role-id">{role}</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={portal.enabled ?? true}
                    onChange={(e) => updatePortal(role, { enabled: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {portal.enabled !== false && (
                <div className="portal-customize-fields">
                  <div className="form-group">
                    <label>Custom portal name</label>
                    <input
                      type="text"
                      placeholder={defaultLabel}
                      value={portal.customName || ''}
                      onChange={(e) => updatePortal(role, { customName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Welcome message</label>
                    <input
                      type="text"
                      placeholder={`Welcome to the ${defaultLabel} portal`}
                      value={portal.welcomeMessage || ''}
                      onChange={(e) => updatePortal(role, { welcomeMessage: e.target.value })}
                    />
                  </div>

                  {role === 'student' && (
                    <div className="student-sub-features">
                      <h4>Student sub-features</h4>
                      {Object.values(STUDENT_SUB_FEATURES).map((sub) => {
                        const subConfig = draft.studentSubFeatures?.[sub.id] || {};
                        return (
                          <label key={sub.id} className="sub-feature-toggle">
                            <input
                              type="checkbox"
                              checked={subConfig.enabled ?? true}
                              onChange={() => toggleStudentSubFeature(sub.id)}
                            />
                            <div>
                              <strong>{sub.label}</strong>
                              <span>{sub.description}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="wizard-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn-primary btn-lg" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default StepPortals;
