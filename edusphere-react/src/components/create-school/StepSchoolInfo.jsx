import React from 'react';
import { useSchool } from '../../context/SchoolContext';

function StepSchoolInfo({ onNext }) {
  const { draft, updateDraft } = useSchool();

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  const isValid = draft.name.trim() && draft.adminEmail.trim();

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <h2>Tell us about your school</h2>
        <p>Basic information to set up your institution on Edvance.</p>
      </div>

      <form onSubmit={handleSubmit} className="wizard-form">
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="school-name">School name *</label>
            <input
              id="school-name"
              type="text"
              placeholder="e.g. Greenwood Academy"
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="admin-email">Admin email *</label>
            <input
              id="admin-email"
              type="email"
              placeholder="admin@school.edu"
              value={draft.adminEmail}
              onChange={(e) => updateDraft({ adminEmail: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-phone">Admin phone</label>
            <input
              id="admin-phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={draft.adminPhone}
              onChange={(e) => updateDraft({ adminPhone: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              placeholder="123 Education Street"
              value={draft.address}
              onChange={(e) => updateDraft({ address: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              placeholder="City"
              value={draft.city}
              onChange={(e) => updateDraft({ city: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              placeholder="Country"
              value={draft.country}
              onChange={(e) => updateDraft({ country: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="academic-year">Academic year start</label>
            <input
              id="academic-year"
              type="date"
              value={draft.academicYearStart}
              onChange={(e) => updateDraft({ academicYearStart: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tagline">School tagline</label>
            <input
              id="tagline"
              type="text"
              placeholder="Excellence in education"
              value={draft.tagline}
              onChange={(e) => updateDraft({ tagline: e.target.value })}
            />
          </div>
        </div>

        <div className="wizard-actions">
          <button type="submit" className="btn-primary btn-lg" disabled={!isValid}>
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default StepSchoolInfo;
