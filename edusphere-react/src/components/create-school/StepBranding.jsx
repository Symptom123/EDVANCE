import React from 'react';
import { Palette, Upload } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

const PRESET_COLORS = [
  { primary: '#10B981', accent: '#059669', name: 'Emerald' },
  { primary: '#3B82F6', accent: '#2563EB', name: 'Blue' },
  { primary: '#8B5CF6', accent: '#7C3AED', name: 'Purple' },
  { primary: '#F59E0B', accent: '#D97706', name: 'Amber' },
  { primary: '#EF4444', accent: '#DC2626', name: 'Red' },
  { primary: '#0F172A', accent: '#334155', name: 'Slate' },
];

function StepBranding({ onNext, onBack }) {
  const { draft, updateBranding } = useSchool();
  const { branding } = draft;

  const applyPreset = (preset) => {
    updateBranding({ primaryColor: preset.primary, accentColor: preset.accent });
  };

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2>Brand your school</h2>
        <p>Customize colors and logo to match your institution&apos;s identity.</p>
      </div>

      <div className="branding-layout">
        <div className="branding-form">
          <div className="form-group">
            <label>
              <Palette size={16} />
              Color presets
            </label>
            <div className="color-presets">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className={`color-preset ${
                    branding.primaryColor === preset.primary ? 'selected' : ''
                  }`}
                  onClick={() => applyPreset(preset)}
                  title={preset.name}
                >
                  <span style={{ background: preset.primary }} />
                  <span style={{ background: preset.accent }} />
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="primary-color">Primary color</label>
              <div className="color-input-wrap">
                <input
                  id="primary-color"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="accent-color">Accent color</label>
              <div className="color-input-wrap">
                <input
                  id="accent-color"
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => updateBranding({ accentColor: e.target.value })}
                />
                <input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => updateBranding({ accentColor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>
              <Upload size={16} />
              School logo
            </label>
            <div className="logo-upload-placeholder">
              <Upload size={24} />
              <p>Logo upload coming soon</p>
              <span>Recommended: 200×200px PNG or SVG</span>
            </div>
          </div>
        </div>

        <div className="branding-preview">
          <h4>Preview</h4>
          <div
            className="branding-preview-card"
            style={{ '--preview-brand': branding.primaryColor, '--preview-accent': branding.accentColor }}
          >
            <div className="preview-header">
              <div className="preview-logo">{draft.name?.charAt(0) || 'S'}</div>
              <div>
                <strong>{draft.name || 'Your School'}</strong>
                <span>{draft.tagline || 'School tagline'}</span>
              </div>
            </div>
            <div className="preview-nav">
              <span className="preview-nav-item active">Dashboard</span>
              <span className="preview-nav-item">Portals</span>
              <span className="preview-nav-item">Settings</span>
            </div>
            <div className="preview-content">
              <div className="preview-stat" />
              <div className="preview-stat" />
              <div className="preview-stat" />
            </div>
          </div>
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

export default StepBranding;
