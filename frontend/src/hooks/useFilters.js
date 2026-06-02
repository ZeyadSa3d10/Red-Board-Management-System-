import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const useFilters = (defaults = {}, options = {}) => {
  const { syncUrl = true, debounceMs = 0, onFilterChange } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  const onFilterChangeRef = useRef(onFilterChange);
  const debounceTimerRef = useRef(null);
  const initialLoadRef = useRef(true);

  onFilterChangeRef.current = onFilterChange;

  const initFilters = useCallback(() => {
    if (!syncUrl) return { ...defaultsRef.current };
    const fromUrl = {};
    for (const key of Object.keys(defaultsRef.current)) {
      const val = searchParams.get(key);
      fromUrl[key] = val !== null ? val : defaultsRef.current[key];
    }
    return fromUrl;
  }, [syncUrl, searchParams]);

  const [filters, setFiltersState] = useState(initFilters);

  const setFilter = useCallback((key, value) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((updates) => {
    setFiltersState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...defaultsRef.current });
  }, []);

  const activeCount = useMemo(() => {
    return Object.keys(defaultsRef.current).filter(k => {
      const v = filters[k];
      const d = defaultsRef.current[k];
      if (typeof v === 'boolean') return v !== d;
      if (typeof v === 'number') return v !== d;
      return String(v ?? '') !== String(d ?? '');
    }).length;
  }, [filters]);

  const debouncedFilters = useMemo(() => filters, [filters]);

  useEffect(() => {
    if (syncUrl) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        const d = defaultsRef.current[key];
        if (value !== undefined && value !== null && value !== '' && value !== d) {
          params.set(key, String(value));
        }
      });
      setSearchParams(params, { replace: true });
    }
  }, [filters, syncUrl, setSearchParams]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (onFilterChangeRef.current) {
      if (debounceMs > 0) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          onFilterChangeRef.current(filters);
        }, debounceMs);
      } else {
        onFilterChangeRef.current(filters);
      }
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters, debounceMs]);

  return { filters, setFilter, setFilters, resetFilters, activeCount };
};

export default useFilters;
