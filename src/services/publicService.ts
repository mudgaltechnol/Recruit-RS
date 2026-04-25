import { GET_DATA_FROM_FAKE, API_BASE_URL, ENDPOINTS } from '../config';
import { MOCK_PUBLIC_STATS, MOCK_ROLES } from '../mockData';

export const publicService = {
  getStats: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_PUBLIC_STATS), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PUBLIC.STATS}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getRoles: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_ROLES.filter(r => r.status === 'Open')), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PUBLIC.ROLES}`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  },

  apply: async (formData: any) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PUBLIC.APPLY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const nextError = new Error(error?.error || 'Failed to submit application');
      if (error?.code) {
        (nextError as any).code = error.code;
      }
      throw nextError;
    }
    return response.json();
  },

  uploadResume: async (candidateId: string, file: File) => {
    const fileFormData = new FormData();
    fileFormData.append('resume', file);
    
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PUBLIC.UPLOAD_RESUME(candidateId)}`, {
      method: 'POST',
      body: fileFormData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to upload resume');
    }
    return response.json();
  },

  subscribeNewsletter: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PUBLIC.NEWSLETTER_SUBSCRIBE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to subscribe to newsletter');
    }
    return response.json();
  },

  getTestimonials: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_PUBLIC_STATS.reviews), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PUBLIC.TESTIMONIALS}`);
    if (!response.ok) throw new Error('Failed to fetch testimonials');
    return response.json();
  },

  downloadReport: async (reportName: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = new Blob([`Mock ${reportName} Content`], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportName.toLowerCase().replace(/\s+/g, '-')}.txt`;
          a.click();
          window.URL.revokeObjectURL(url);
          resolve({ success: true });
        }, 1500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/public/reports/download?name=${encodeURIComponent(reportName)}`);
    if (!response.ok) throw new Error('Failed to download report');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    return { success: true };
  }
};
