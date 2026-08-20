import React from 'react';
import { Check, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const Pricing = () => {
  return (
    <section className="pricing-section" id="pricing">
      <div className="container">
        <div className="pricing-header reveal">
          <h2 className="section-headline">
            Institutional plans with<br />
            <span className="text-blue">zero hidden surcharges</span>
          </h2>
          <p className="section-sub">
            Every tier includes bilingual onboarding support, local currency payment options (XAF / USD),
            complete data migration assistance, and our 99.9% uptime SLA.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Tier 1: Starter */}
          <div className="pricing-card reveal">
            <div className="pricing-tier">Starter Academy</div>
            <div className="pricing-price">
              <span className="price-main">Custom</span>
            </div>
            <p className="pricing-desc">
              For standalone private and community schools modernizing mark entry and parent reporting.
            </p>
            <div className="pricing-features-list">
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Up to 600 enrolled students</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Sequence 1–6 mark calculation & rankings</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Official PDF report card generator</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Standard Teacher & Administrator portals</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Free legacy Excel / paper data migration</span>
              </div>
            </div>
            <a href="/register" className="btn btn-secondary-full">
              <span>Begin 30-day trial</span>
              <ArrowRight size={15} className="btn-arrow-trailing" />
            </a>
          </div>

          {/* Tier 2: Professional (Featured) */}
          <div className="pricing-card is-featured reveal reveal-delay-1">
            <div className="pricing-popular">
              <Sparkles size={12} />
              <span>Most Selected by Principals</span>
            </div>
            <div className="pricing-tier text-blue">Professional Campus</div>
            <div className="pricing-price">
              <span className="price-currency">$</span>
              <span className="price-main">490</span>
              <span className="price-period">/ month (billed termly)</span>
            </div>
            <p className="pricing-desc">
              The complete institutional standard for secondary schools, colleges, and high schools.
            </p>
            <div className="pricing-features-list">
              <div className="pricing-feature">
                <div className="pricing-check pricing-featured-check"><Check size={11} strokeWidth={3} /></div>
                <span><strong>Up to 2,500 students</strong> across all streams</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check pricing-featured-check"><Check size={11} strokeWidth={3} /></div>
                <span>Full GCE, BEPC & Baccalauréat coefficient modules</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check pricing-featured-check"><Check size={11} strokeWidth={3} /></div>
                <span><strong>Dedicated Parent & Student Portals</strong> + SMS alert gateway</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check pricing-featured-check"><Check size={11} strokeWidth={3} /></div>
                <span>Fee collection & automated tuition receipts</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check pricing-featured-check"><Check size={11} strokeWidth={3} /></div>
                <span>Custom school crest, stamp & bilingual watermarks</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check pricing-featured-check"><Check size={11} strokeWidth={3} /></div>
                <span>Priority WhatsApp & direct phone support for registrar</span>
              </div>
            </div>
            <a href="/register" className="btn btn-primary-full">
              <span>Deploy for your school</span>
              <ArrowRight size={16} className="btn-arrow-trailing" />
            </a>
          </div>

          {/* Tier 3: Multi-Campus Enterprise */}
          <div className="pricing-card reveal reveal-delay-2">
            <div className="pricing-tier">District & Multi-Campus</div>
            <div className="pricing-price">
              <span className="price-main" style={{ fontSize: '38px', letterSpacing: '-0.02em' }}>Enterprise</span>
            </div>
            <p className="pricing-desc">
              Tailored governance for school networks, mission education secretariats, and regional groups.
            </p>
            <div className="pricing-features-list">
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span><strong>Unlimited students</strong> and faculty members</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Multi-campus aggregate dashboard & comparison</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Custom SIS / National Examination board integration</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>Dedicated Enterprise Account Director</span>
              </div>
              <div className="pricing-feature">
                <div className="pricing-check"><Check size={11} strokeWidth={3} /></div>
                <span>On-premise or sovereign cloud hosting option</span>
              </div>
            </div>
            <a href="#contact" className="btn btn-secondary-full">
              <span>Request formal proposal</span>
              <ArrowRight size={15} className="btn-arrow-trailing" />
            </a>
          </div>
        </div>

        <div className="pricing-footnote reveal">
          <ShieldCheck size={16} className="text-blue" />
          <span>All plans come with a 30-day evaluation period. Local payments accepted via Bank Wire, Mobile Money (MTN/Orange MoMo), and Cards.</span>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
