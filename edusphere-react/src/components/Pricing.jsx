import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

const Pricing = () => {
  return (
    <section className="pricing-section" id="pricing">
      <div className="container">
        <div className="section-header reveal">
          <p className="section-eyebrow">Pricing</p>
          <h2 className="section-title">Simple, transparent pricing<br/>for every school size</h2>
          <p className="section-body">Every plan includes full onboarding support, training, data migration assistance, and 99.9% uptime SLA. No hidden fees.</p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card reveal ">
            <div className="price-plan">Starter</div>
            <div className="price-amount-wrap">
              <span className="price-amount">Custom</span>
            </div>
            <p className="price-desc">For small schools beginning their digital transformation journey.</p>
            <ul className="price-features">
              <li><Check size={14} /> Up to 500 students</li>
              <li><Check size={14} /> All users portals</li>
              <li><Check size={14} /> Basic analytics</li>
              <li><Check size={14} /> Email & chat support</li>
              <li><Check size={14} /> Free data migration</li>
            </ul>
            <a href="/register" className="btn-outline-full">Get started</a>
          </div>

          <div className="pricing-card pricing-featured reveal ">
            <div className="pricing-badge">Most Popular</div>
            <div className="price-plan">Growth</div>
            <div className="price-amount-wrap">
              <span className="price-currency">$</span>
              <span className="price-amount">799</span>
              <span className="price-period">/month</span>
            </div>
            <p className="price-desc">The complete platform for growing schools ready to operate at scale.</p>
            <ul className="price-features">
              <li><Check size={14} /> Up to 2,500 students</li>
              <li><Check size={14} /> All user portals</li>
              <li><Check size={14} /> Advanced analytics & reporting</li>
              <li><Check size={14} /> Finance management</li>
              <li><Check size={14} /> Custom branding</li>
              <li><Check size={14} /> Priority support 24/7</li>
              <li><Check size={14} /> API access</li>
            </ul>
            <a href="/register" className="btn-primary-full"><span>Start  3 months free trial</span></a>
          </div>

          <div className="pricing-card reveal ">
            <div className="price-plan">Enterprise</div>
            <div className="price-amount-wrap">
              <span className="price-amount" style={{fontSize: '28px', letterSpacing: '-0.5px'}}>Custom</span>
            </div>
            <p className="price-desc">Tailored for large institutions, multi-campus networks, and school districts.</p>
            <ul className="price-features">
              <li><Check size={14} /> Unlimited students</li>
              <li><Check size={14} /> Multi-campus management</li>
              <li><Check size={14} /> Custom integrations & SSO</li>
              <li><Check size={14} /> Dedicated success manager</li>
              <li><Check size={14} /> On-premise option</li>
              <li><Check size={14} /> SLA & compliance reporting</li>
            </ul>
            <a href="#contact" className="btn-outline-full">Contact sales</a>
          </div>
        </div>

        <div className="pricing-footnote reveal ">
          <ShieldCheck size={14} />
          All plans include a 30-day free trial. No credit card required. Cancel anytime.
        </div>
      </div>
    </section>
  );
};

export default Pricing;

