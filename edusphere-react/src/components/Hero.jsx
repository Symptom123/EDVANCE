import React from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero-section" id="hero">
      <div className="container">
        <div className="hero-content" style={{ maxWidth: '820px', margin: '0 auto' }}>

          <h1 className="hero-headline">
            The operating system<br />for modern schools
          </h1>

          <p className="hero-sub">
            Edvance unifies student management, teacher workflows, parent communication,
            and school administration into one cohesive platform — so your team can focus
            on what matters most: education.
          </p>

          <div className="hero-actions">
            <a href="/register" className="btn-primary btn-lg">
              <span>Start free trial</span>
              <ArrowRight size={16} />
            </a>
            <a href="#showcase" className="btn-secondary btn-lg">
              <PlayCircle size={16} />
              <span>Watch demo</span>
            </a>
          </div>

          <div className="hero-proof">
            <div className="proof-avatars">
              <div className="proof-av av-1">R</div>
              <div className="proof-av av-2">J</div>
              <div className="proof-av av-3">A</div>
              <div className="proof-av av-4">M</div>
            </div>
            <p className="proof-text">
              <strong>4.9/5</strong> from 1,200+ verified reviews
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
