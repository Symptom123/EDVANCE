import React from 'react';
import { GraduationCap, BookOpen, Check } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { SCHOOL_TYPES } from '../../data/portalConfig';

function StepSchoolType({ onNext, onBack }) {
  const { draft, setSchoolType } = useSchool();

  const handleSelect = (type) => {
    setSchoolType(type);
  };

  const handleContinue = () => {
    if (draft.type) onNext();
  };

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2>Choose your school type</h2>
        <p>
          This determines which portals are available. You can fully customize
          each portal in the next steps.
        </p>
      </div>

      <div className="school-type-grid">
        {Object.values(SCHOOL_TYPES).map((type) => {
          const isSelected = draft.type === type.id;
          const Icon = type.id === 'primary' ? GraduationCap : BookOpen;
          return (
            <button
              key={type.id}
              type="button"
              className={`school-type-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(type.id)}
            >
              {isSelected && (
                <span className="school-type-check">
                  <Check size={16} />
                </span>
              )}
              <div className="school-type-icon">
                <Icon size={28} />
              </div>
              <h3>{type.label}</h3>
              <p>{type.description}</p>
              <div className="school-type-roles">
                {type.roles.map((role) => (
                  <span key={role} className="role-chip">{role}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {draft.type && (
        <div className="school-type-preview">
          <h4>Portal structure for {SCHOOL_TYPES[draft.type].label}</h4>
          <div className="portal-tree">
            <div className="portal-tree-root">{draft.name || 'Your School'}</div>
            <div className="portal-tree-branch">
              {SCHOOL_TYPES[draft.type].roles.map((role) => (
                <div key={role} className="portal-tree-node">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                  {role === 'student' && (
                    <div className="portal-tree-sub">View Result</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="wizard-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary btn-lg"
          onClick={handleContinue}
          disabled={!draft.type}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default StepSchoolType;
