import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const faqs = [
  {
    q: 'How does Edvance handle Cameroon\'s Sequence system and coefficient weighting?',
    a: 'Edvance has native support for both Anglophone (Form 1 to Upper Sixth / GCE Ordinary and Advanced Level) and Francophone (6ème to Terminale / BEPC, Probatoire, Baccalauréat) subsystems. Subject coefficients, continuous assessment weightings (Sequences 1 through 6), and term exam computations are pre-configured to MINESEC standards and automatically calculated without spreadsheet formulas.'
  },
  {
    q: 'Does the system work if our campus experiences internet or power cuts?',
    a: 'Yes. The Edvance teacher mark entry module and attendance records feature offline-first architecture. Teachers can continue entering scores and grades locally even when the network is unstable. The system automatically syncs encrypted records to the central cloud the moment connectivity is restored.'
  },
  {
    q: 'Are report cards bilingual and customizable with our school crest?',
    a: 'Absolutely. Report cards can be generated in English, French, or a bilingual format. You can upload your official institution crest, custom header details, principal digital signature watermarks, and QR-code verification seals for tamper-proof credentials.'
  },
  {
    q: 'How do parents access their children\'s grades and notifications?',
    a: 'Parents receive dedicated portal access via web and mobile. Additionally, Edvance includes an automated SMS and WhatsApp notification gateway that delivers term marks, emergency school notices, attendance pings, and tuition payment receipts directly to parent phone numbers.'
  },
  {
    q: 'How long does onboarding and data migration take?',
    a: 'Our regional deployment team typically gets a full secondary school or college operational within 48 to 72 hours. We handle data extraction from your existing Excel files, paper archives, or legacy databases free of charge.'
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="faq-layout">
          {/* Left Column: Sticky Title */}
          <div className="faq-sticky reveal">
            <div className="section-eyebrow-pill">
              <span className="eyebrow-dot" />
              <span className="eyebrow-label">Frequently Answered</span>
            </div>
            <h2 className="section-headline">
              Answers for discerning<br />
              <span className="text-blue">headmasters & trustees</span>
            </h2>
            <p className="section-sub">
              Everything you need to know about curriculum compliance, regional security standards,
              and institutional deployment.
            </p>
          </div>

          {/* Right Column: Accordion List */}
          <div className="faq-list">
            {faqs.map((f, idx) => (
              <div 
                key={idx} 
                className={`faq-item ${openIndex === idx ? 'open' : ''} reveal reveal-delay-${idx + 1}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openIndex === idx}
                >
                  <span className="faq-q-text">{f.q}</span>
                  <span className="faq-icon">
                    <Plus size={16} />
                  </span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    {f.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
