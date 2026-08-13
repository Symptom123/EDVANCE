import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'School Info' },
  { id: 2, label: 'School Type' },
  { id: 3, label: 'Portals' },
  { id: 4, label: 'Features' },
  { id: 5, label: 'Branding' },
  { id: 6, label: 'Review' },
];

function WizardSteps({ currentStep }) {
  return (
    <nav className="wizard-steps" aria-label="Create school progress">
      {STEPS.map((step, index) => {
        const isComplete = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className={`wizard-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
              <div className="wizard-step-indicator">
                {isComplete ? <Check size={14} /> : step.id}
              </div>
              <span className="wizard-step-label">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`wizard-step-line ${isComplete ? 'complete' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default WizardSteps;
