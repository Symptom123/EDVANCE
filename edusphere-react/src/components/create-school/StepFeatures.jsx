import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { SCHOOL_TYPES, FEATURE_CATALOG, ROLE_LABELS } from '../../data/portalConfig';

function StepFeatures({ onNext, onBack }) {
  const { draft, toggleFeature } = useSchool();
  const roles = SCHOOL_TYPES[draft.type]?.roles || [];
  const enabledRoles = roles.filter((r) => draft.portals[r]?.enabled !== false);
  const [activeRole, setActiveRole] = useState(enabledRoles[0] || roles[0]);

  const getEnabledCount = (role) => {
    const roleFeatures = draft.features[role] || {};
    return Object.values(roleFeatures).filter(Boolean).length;
  };

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2>Choose features for each portal</h2>
        <p>
          Select which features each role will have access to. Features are empty
          shells for now — you can enable them as we build them out.
        </p>
      </div>

      <div className="feature-customize-layout">
        <div className="feature-role-tabs">
          {enabledRoles.map((role) => {
            const portalName = draft.portals[role]?.customName || ROLE_LABELS[role]?.default || role;
            const count = getEnabledCount(role);
            return (
              <button
                key={role}
                type="button"
                className={`feature-role-tab ${activeRole === role ? 'active' : ''}`}
                onClick={() => setActiveRole(role)}
              >
                {portalName}
                {count > 0 && <span className="feature-count">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="feature-categories">
          {Object.entries(FEATURE_CATALOG).map(([categoryId, category]) => (
            <div key={categoryId} className="feature-category">
              <h4>{category.label}</h4>
              <div className="feature-list">
                {category.features.map((feature) => {
                  const isEnabled = draft.features[activeRole]?.[feature.id] ?? false;
                  return (
                    <label key={feature.id} className={`feature-toggle ${isEnabled ? 'enabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleFeature(activeRole, feature.id)}
                      />
                      <div className="feature-toggle-content">
                        <strong>{feature.label}</strong>
                        <span>{feature.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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

export default StepFeatures;
