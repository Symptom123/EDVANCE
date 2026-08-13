import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateSchool from './pages/CreateSchool';
import PrimaryPortal from './pages/PrimaryPortal';
import SecondaryPortal from './pages/SecondaryPortal';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import TeacherPortal from './pages/TeacherPortal';
import ParentPortal from './pages/ParentPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<CreateSchool />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentPortal />} />
        <Route path="/teacher" element={<TeacherPortal />} />
        <Route path="/parent" element={<ParentPortal />} />
        <Route path="/portal/primary" element={<PrimaryPortal />} />
        <Route path="/portal/secondary" element={<SecondaryPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
