// Centralized API configuration with fallback to production backend
export const API_BASE = ((import.meta.env.VITE_API_URL || 'https://edvance-1v00.onrender.com').replace(/\/+$/, '') || 'https://edvance-1v00.onrender.com').replace(/\/+$/, '');

export const apiUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return API_BASE + cleanPath;
};

export default API_BASE;

