export const GET_DATA_FROM_FAKE = false;
export const IS_PROD = true;

const envApiBaseUrl = (process.env.VITE_API_BASE_URL || '').trim();
const defaultProdApiBaseUrl = 'https://api.recruitrighthr.com';
const rawApiBaseUrl = envApiBaseUrl || (IS_PROD ? defaultProdApiBaseUrl : '');

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');

export const ENDPOINTS = {
  PUBLIC: {
    STATS: '/api/public/stats',
    ROLES: '/api/public/roles',
    APPLY: '/api/public/apply',
    UPLOAD_RESUME: (candidateId: string) => `/api/public/upload-resume/${candidateId}`,
    NEWSLETTER_SUBSCRIBE: '/api/public/newsletter/subscribe',
    TESTIMONIALS: '/api/public/testimonials',
  },
  ADMIN: {
    CANDIDATES: '/api/candidates',
    CANDIDATE_BY_ID: (id: string) => `/api/candidates/${id}`,
    CANDIDATE_RESUME_ACCESS: (id: string) => `/api/candidates/${id}/resume-access`,
    EMPLOYEES: '/api/admin/employees',
    EMPLOYEE_BY_ID: (id: string) => `/api/admin/employees/${id}`,
    EMPLOYEE_STATUS: (id: string) => `/api/admin/employees/${id}/status`,
    ROLES: '/api/roles',
    NEWSLETTER_SEND: '/api/admin/newsletter/send',
    SCHEDULE: {
      EVENTS: '/api/admin/schedule/events',
      EVENT_BY_ID: (id: string) => `/api/admin/schedule/events/${id}`,
    },
    REPORTS: '/api/admin/reports',
    STATS: '/api/admin/stats'
  }
};
