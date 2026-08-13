import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', school: '', email: '', size: '', message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, error, success, loading
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
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setMessage('Thank you! Our team will reach out within one business day.');
      setFormData({ name: '', school: '', email: '', size: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    }, 1500);
  };

  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info reveal">
            <p className="section-eyebrow">Get in Touch</p>
            <h2 className="section-title" style={{fontSize: '28px'}}>Talk to our<br/>team directly</h2>
            <p className="section-body">Whether you have a question, need a demo, or want a custom quote for your school network — we're here to help.</p>
            <div className="contact-details">
              <div className="contact-detail">
                <Mail size={16} />
                <span>hello@eduvance.io</span>
              </div>
              <div className="contact-detail">
                <Phone size={16} />
                <span>+1 (800) 477-4373</span>
              </div>
              <div className="contact-detail">
                <MapPin size={16} />
                <span>14 Innovation Drive, Tech City, TC 10001</span>
              </div>
            </div>
          </div>
          
          <div className="contact-form-wrap reveal ">
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              
              {status === 'error' && (
                <div className="form-alert" style={{
                  padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '12px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626'
                }}>
                  {message}
                </div>
              )}
              {status === 'success' && (
                <div className="form-alert" style={{
                  padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '12px',
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#16A34A'
                }}>
                  {message}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cf-name">Full name</label>
                  <input type="text" id="cf-name" name="name" placeholder="Dr. Rachel Johnson" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="cf-school">School name</label>
                  <input type="text" id="cf-school" name="school" placeholder="Pinnacle Academy" value={formData.school} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cf-email">Work email</label>
                  <input type="email" id="cf-email" name="email" placeholder="principal@school.edu" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="cf-size">Number of students</label>
                  <select id="cf-size" name="size" value={formData.size} onChange={handleChange}>
                    <option value="">Select school size</option>
                    <option>Under 300</option>
                    <option>300 – 1,000</option>
                    <option>1,000 – 5,000</option>
                    <option>5,000+</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label htmlFor="cf-message">Message (optional)</label>
                <textarea id="cf-message" name="message" rows={4} placeholder="Tell us about your school's current challenges..." value={formData.message} onChange={handleChange}></textarea>
              </div>
              <button 
                type="submit" 
                className="btn-primary btn-form-submit" 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending...' : status === 'success' ? '✓ Message sent!' : <><span>Send Message</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
