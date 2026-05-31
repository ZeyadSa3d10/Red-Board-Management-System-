import { toast } from '../utils/toastService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5193/api';

const CREDENTIALS = { credentials: 'include' };

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

const refreshAuthToken = async () => {
  const res = await fetch(`${BASE_URL}/Auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
  });

  if (!res.ok) {
    toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 6000);
    window.location.href = '/login';
    throw new Error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
  }

  return res.json();
};

const doFetch = async (url, opts) => {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...CREDENTIALS,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.message || body.title || 'حدث خطأ في الاتصال';
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    const originalUrl = res.url;
    const originalOpts = { method: res.method };

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        await refreshAuthToken();
        isRefreshing = false;
        onRefreshed();
        return doFetch(originalUrl, originalOpts);
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        toast.error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 6000);
        window.location.href = '/login';
        throw new Error('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
      }
    } else {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(async () => {
          try {
            const result = await doFetch(originalUrl, originalOpts);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.message || body.title || 'حدث خطأ في الاتصال';
    toast.error(msg);
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
};

const fetchWithRetry = async (url, opts, retries = 2) => {
  try {
    return await fetch(url, opts);
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchWithRetry(url, opts, retries - 1);
    }
    toast.error('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
    throw err;
  }
};

const fetchWithAuth = async (url, opts = {}) => {
  const headers = { ...opts.headers };
  if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetchWithRetry(url, { ...opts, headers, ...CREDENTIALS });
  return handleResponse(res);
};

export const http = {
  get: async (url, params = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const fullUrl = qs ? `${BASE_URL}${url}?${qs}` : `${BASE_URL}${url}`;
    return fetchWithAuth(fullUrl);
  },

  post: async (url, body) => {
    return fetchWithAuth(`${BASE_URL}${url}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: async (url, body) => {
    const opts = { method: 'PUT' };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
    }
    return fetchWithAuth(`${BASE_URL}${url}`, opts);
  },

  delete: async (url) => {
    return fetchWithAuth(`${BASE_URL}${url}`, {
      method: 'DELETE',
    });
  },
};

export const httpPublic = {
  post: async (url, body) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...CREDENTIALS,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.title || 'حدث خطأ في الاتصال');
    }
    return res.json();
  },
};
