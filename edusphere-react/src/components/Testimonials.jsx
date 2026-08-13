import React from 'react';

const testimonials = [
  {
    id: 'testi-1',
    av: 'RT',
    avCls: 'ta-1',
    quote: '"EDUVANCE replaced five separate systems we were using. The ROI was evident within the first term — our administrative team saved over 20 hours per week."',
    name: 'Dr. Rachel Thompson',
    role: 'Principal, Pinnacle Academy — London',
    featured: false,
  },
  {
    id: 'testi-2',
    av: 'MO',
    avCls: 'ta-2',
    quote: '"I\'ve evaluated over 30 school management platforms. EDUVANCE is the only one that felt like it was built by people who actually understand how schools work. The depth of features combined with the quality of the interface is unmatched."',
    name: 'Michael Okafor',
    role: 'Director of Technology, BrightFuture District',
    featured: true,
  },
  {
    id: 'testi-3',
    av: 'SC',
    avCls: 'ta-3',
    quote: '"Parent engagement went up 60% after we launched the parent portal. Teachers love it. Admins love it. Even parents who aren\'t particularly tech-savvy figured it out immediately."',
    name: 'Sarah Chen',
    role: 'Head of Operations, Meridian Prep School',
    featured: false,
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials-section" id="customers" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Premium blue glow — top left */}
      <div style={{
        position: 'absolute', top: '-80px', left: '-80px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-header reveal">
          <p className="section-eyebrow">Customer Stories</p>
          <h2 className="section-title">Trusted by school leaders<br />who demand excellence</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              id={t.id}
              className={`testimonial-card ${t.featured ? 'testi-featured' : ''} reveal ${i === 1 ? '' : i === 2 ? '' : ''}`}
            >
              <div className="testi-rating">★★★★★</div>
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-author">
                <div className={`testi-av ${t.avCls}`}>{t.av}</div>
                <div>
                  <p className="testi-name">{t.name}</p>
                  <p className="testi-role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

