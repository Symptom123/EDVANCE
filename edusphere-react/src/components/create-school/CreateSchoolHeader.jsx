import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, School } from 'lucide-react';

function CreateSchoolHeader() {
  return (
    <header className="create-school-header">
      <div className="create-school-header-inner">
        <Link to="/" className="create-school-back">
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <Link to="/" className="create-school-brand">
          <img src="/images/logo-horizontal.png" alt="Edvance" />
        </Link>
        <div className="create-school-header-badge">
          <School size={16} />
          Create School
        </div>
      </div>
    </header>
  );
}

export default CreateSchoolHeader;
