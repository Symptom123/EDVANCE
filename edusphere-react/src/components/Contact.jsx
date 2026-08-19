import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', school: '', email: '', size: '', message: ''
  });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.school) {
      setStatus('error');
      setMessage('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatus('error');
      setMessage('Please enter a valid official email address.');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setMessage('Thank you. An Edvance Education Director will contact your office within 24 hours.');
      setFormData({ name: '', school: '', email: '', size: '', message: '' });
      setTimeout(() => setStatus('idle'), 6000);
    }, 1200);
  };

  return (
    <section className="contact-section" id="contact" style={{ background: 'var(--white)', padding: 'var(--space-section) 0', borderTop: '1px solid var(--gray-200)' }}>
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info reveal">
            <div className="section-eyebrow-pill">
              <span className="eyebrow-dot" />
              <span className="eyebrow-label">Institutional Inquiries</span>
            </div>
            <h2 className="section-headline">
              Speak directly with our<br />
              <span className="text-blue">regional leadership team</span>
            </h2>
            <p className="section-sub">
              Whether you represent a single campus, a mission education secretariat, or a regional school district,
              our specialists are available to organize private institutional demonstrations and technical feasibility audits.
            </p>

            <div className="contact-details">
              <div className="contact-detail">
                <Mail size={16} />
                <span>chancellery@edvance.io</span>
              </div>
              <div className="contact-detail">
                <Phone size={16} />
                <span>+237 670 000 000 / +237 690 000 000</span>
              </div>
              <div className="contact-detail">
                <MapPin size={16} />
                <span>Bastos Diplomatic Quarter, Yaoundé, Cameroon</span>
              </div>
            </div>
          </div>

          <div className="contact-form-wrap reveal reveal-delay-1">
            <form className="contact-form spotlight-card" onSubmit={handleSubmit} noValidate>
              {status === 'error' && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '16px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626'
                }}>
                  {message}
                </div>
              )}
              {status === 'success' && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '16px',
                  background: 'var(--green-pale)', border: '1px solid rgba(45,125,74,0.3)', color: 'var(--green)'
                }}>
                  <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  {message}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cf-name">Principal / Administrator Name</label>
                  <input type="text" id="cf-name" name="name" placeholder="Dr. Emmanuel Mbassi" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="cf-school">Institution Name</label>
                  <input type="text" id="cf-school" name="school" placeholder="Collège Jean-Tabi" value={formData.school} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cf-email">Official Work Email</label>
                  <input type="email" id="cf-email" name="email" placeholder="principal@jeantabi.org" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="cf-size">Student Enrollment Size</label>
                  <select id="cf-size" name="size" value={formData.size} onChange={handleChange}>
                    <option value="">Select institution scale</option>
                    <option>Under 500 students</option>
                    <option>500 – 1,500 students</option>
                    <option>1,500 – 4,000 students</option>
                    <option>4,000+ students (Multi-Campus / District)</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="cf-message">Curriculum Specifications / Notes (optional)</label>
                <textarea id="cf-message" name="message" rows={4} placeholder="e.g. Bilingual curriculum (GCE Ordinary/Advanced Level + BEPC/Baccalauréat), 1,200 candidates..." value={formData.message} onChange={handleChange}></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-full" 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Transmitting request...' : status === 'success' ? '✓ Ingestion Confirmed' : <><span>Schedule Institutional Consultation</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
