import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { SCHOOL_TYPES, ROLE_LABELS, FEATURE_CATALOG } from '../../data/portalConfig';

function StepReview({ onBack }) {
  const { draft, createSchool } = useSchool();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const enabledPortals = Object.entries(draft.portals).filter(([, p]) => p.enabled !== false);

  const getFeatureCount = (role) => {
    const roleFeatures = draft.features[role] || {};
    return Object.entries(roleFeatures).filter(([, enabled]) => enabled).length;
  };

  const getFeatureNames = (role) => {
    const roleFeatures = draft.features[role] || {};
    const names = [];
    Object.entries(FEATURE_CATALOG).forEach(([, category]) => {
      category.features.forEach((f) => {
        if (roleFeatures[f.id]) names.push(f.label);
      });
    });
    return names;
  };

  const handleCreate = async () => {
    setCreating(true);
    await new Promise((r) => setTimeout(r, 800));
    const config = createSchool();
    navigate(`/portal/${config.type}/admin`);
  };

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2>Review your school setup</h2>
        <p>Confirm everything looks right before creating your school.</p>
      </div>

      <div className="review-grid">
        <div className="review-section">
          <h4>School Information</h4>
          <dl className="review-dl">
            <dt>Name</dt><dd>{draft.name}</dd>
            <dt>Type</dt><dd>{SCHOOL_TYPES[draft.type]?.label}</dd>
            <dt>Admin</dt><dd>{draft.adminEmail}</dd>
            {draft.city && <><dt>Location</dt><dd>{[draft.city, draft.country].filter(Boolean).join(', ')}</dd></>}
            {draft.tagline && <><dt>Tagline</dt><dd>{draft.tagline}</dd></>}
          </dl>
        </div>

        <div className="review-section">
          <h4>Branding</h4>
          <div className="review-branding">
            <div className="review-color-swatch" style={{ background: draft.branding.primaryColor }} />
            <div className="review-color-swatch" style={{ background: draft.branding.accentColor }} />
          </div>
        </div>

        <div className="review-section full-width">
          <h4>Enabled Portals ({enabledPortals.length})</h4>
          <div className="review-portals">
            {enabledPortals.map(([role, portal]) => (
              <div key={role} className="review-portal-card">
                <div className="review-portal-header">
                  <strong>{portal.customName || ROLE_LABELS[role]?.default}</strong>
                  <span>{getFeatureCount(role)} features selected</span>
                </div>
                <p className="review-portal-msg">{portal.welcomeMessage}</p>
                {getFeatureNames(role).length > 0 && (
                  <div className="review-feature-chips">
                    {getFeatureNames(role).map((name) => (
                      <span key={name} className="feature-chip">{name}</span>
                    ))}
                  </div>
                )}
                {role === 'student' && draft.studentSubFeatures?.['view-result']?.enabled && (
                  <div className="review-sub-feature">
                    <CheckCircle size={14} />
                    View Result enabled
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="review-note">
        <p>
          Portals are created empty — features will be added as you build them out.
          You can always change customization later from the admin portal.
        </p>
      </div>

      <div className="wizard-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary btn-lg"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Creating school...' : 'Create school'}
          {!creating && <ExternalLink size={16} />}
        </button>
      </div>
    </div>
  );
}

export default StepReview;
