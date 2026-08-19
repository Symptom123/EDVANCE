import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 'testi-1',
    av: 'EM',
    avCls: 'av-1',
    quote: '"Calculating coefficient averages for 1,400 students across 6 sequences used to paralyze our staff for two weeks every term. With Edvance, our entire report card generation process now takes under 45 minutes with zero mathematical errors."',
    name: 'Prof. Emmanuel Mbassi',
    role: 'Principal, Collège Jean-Tabi — Yaoundé',
    school: 'Collège Jean-Tabi',
    featured: false,
  },
  {
    id: 'testi-2',
    av: 'AK',
    avCls: 'av-2',
    quote: '"Edvance is the only school management system that genuinely respects the Cameroon GCE Board structure and MINESEC requirements out of the box. Teacher adoption was 100% within the first month because the interface makes their job easier, not harder."',
    name: 'Dr. Agnes Kengne-Fosso',
    role: 'Director of Academic Affairs, Saker Baptist College — Limbe',
    school: 'Saker Baptist College',
    featured: true,
  },
  {
    id: 'testi-3',
    av: 'BO',
    avCls: 'av-3',
    quote: '"The Parent Portal changed everything for our community. Parents receive attendance alerts and sequence marks immediately on their phones. Tuition fee collection friction dropped by 65% because receipts are tracked automatically."',
    name: 'Rev. Bernard Orock',
    role: 'Headmaster, St. Joseph\'s College — Sasse, Buea',
    school: 'St. Joseph\'s College',
    featured: false,
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials-section" id="testimonials">
      <div className="container">
        <div className="testi-header reveal">
          <div className="section-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span className="eyebrow-label">Institutional Endorsements</span>
          </div>
          <h2 className="section-headline">
            Trusted by the principals<br />
            <span className="text-blue">shaping Africa's future</span>
          </h2>
          <p className="section-sub">
            Leading academic institutions rely on Edvance to manage examinations, 
            faculty workflows, and parent engagement with uncompromising reliability.
          </p>
        </div>

        <div className="testi-grid">
          {testimonials.map((t, idx) => (
            <div 
              key={t.id} 
              className={`testi-card ${t.featured ? 'is-featured' : ''} reveal reveal-delay-${idx + 1}`}
            >
              <div className="testi-stars">
                {[...Array(5)].map((_, s) => (
                  <Star 
                    key={s} 
                    size={16} 
                    fill="#E8A23A" 
                    color="#E8A23A" 
                  />
                ))}
              </div>

              <blockquote className="testi-quote">
                {t.quote}
              </blockquote>

              <div className="testi-author">
                <div className={`testi-avatar ${t.avCls}`}>
                  {t.av}
                </div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
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
