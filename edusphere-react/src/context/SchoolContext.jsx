import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_SCHOOL_CONFIG,
  getDefaultPortalsForType,
  getDefaultFeaturesForType,
  getDefaultStudentSubFeatures,
} from '../data/portalConfig';

const STORAGE_KEY = 'edvance_school_config';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [draft, setDraft] = useState({ ...DEFAULT_SCHOOL_CONFIG });

  useEffect(() => {
    if (school) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(school));
    }
  }, [school]);

  const updateDraft = useCallback((updates) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  const setSchoolType = useCallback((type) => {
    setDraft((prev) => ({
      ...prev,
      type,
      portals: getDefaultPortalsForType(type),
      features: getDefaultFeaturesForType(type),
      studentSubFeatures: type === 'secondary' ? getDefaultStudentSubFeatures() : {},
    }));
  }, []);

  const updatePortal = useCallback((role, updates) => {
    setDraft((prev) => ({
      ...prev,
      portals: {
        ...prev.portals,
        [role]: { ...prev.portals[role], ...updates },
      },
    }));
  }, []);

  const toggleFeature = useCallback((role, featureId) => {
    setDraft((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [role]: {
          ...prev.features[role],
          [featureId]: !prev.features[role]?.[featureId],
        },
      },
    }));
  }, []);

  const toggleStudentSubFeature = useCallback((subFeatureId) => {
    setDraft((prev) => ({
      ...prev,
      studentSubFeatures: {
        ...prev.studentSubFeatures,
        [subFeatureId]: {
          ...prev.studentSubFeatures[subFeatureId],
          enabled: !prev.studentSubFeatures[subFeatureId]?.enabled,
        },
      },
    }));
  }, []);

  const updateBranding = useCallback((updates) => {
    setDraft((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...updates },
    }));
  }, []);

  const createSchool = useCallback(() => {
    const config = { ...draft, createdAt: new Date().toISOString(), id: crypto.randomUUID() };
    setSchool(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return config;
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraft({ ...DEFAULT_SCHOOL_CONFIG });
  }, []);

  const clearSchool = useCallback(() => {
    setSchool(null);
    localStorage.removeItem(STORAGE_KEY);
    setDraft({ ...DEFAULT_SCHOOL_CONFIG });
  }, []);

  return (
    <SchoolContext.Provider
      value={{
        school,
        draft,
        updateDraft,
        setSchoolType,
        updatePortal,
        toggleFeature,
        toggleStudentSubFeature,
        updateBranding,
        createSchool,
        resetDraft,
        clearSchool,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within SchoolProvider');
  return ctx;
}
