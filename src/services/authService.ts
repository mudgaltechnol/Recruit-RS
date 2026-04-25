
import { GET_DATA_FROM_FAKE, API_BASE_URL } from '../config';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  type?: string | number;
  roleType?: string | number;
  roletype?: string | number;
  status?: 'Active' | 'Inactive';
  position?: string;
  mobile?: string;
  address?: string;
  updatedat?: string;
}

// Mock database of allowed users for local development
const ALLOWED_USERS: User[] = [
  { id: '1', email: 'admin@recruitrightsolutions.com', name: 'Recruit Right Solutions Admin', role: 'admin', type: 1, status: 'Active' },
  { id: '2', email: 'lakshaymudgal340@gmail.com', name: 'Lakshay Mudgal', role: 'admin', type: 1, status: 'Active' },
  { id: '3', email: 'recruiter@recruitrightsolutions.com', name: 'Senior Recruiter', role: 'employee', type: 2, status: 'Active' },
];

export const isAdminUser = (user: User | null) => {
  if (!user) return false;

  const normalizedRoleType = String(user.roleType ?? user.roletype ?? user.type ?? '').trim();
  if (normalizedRoleType === '1') return true;

  const normalizedRole = String(user.role || '').trim().toLowerCase();
  return normalizedRole === 'admin';
};

const parseResponseBody = async (response: Response) => {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

const getLoginErrorMessage = (responseBody: unknown, status: number) => {
  if (responseBody && typeof responseBody === 'object' && 'error' in responseBody) {
    const message = String(responseBody.error || '').trim();
    if (message) {
      return message;
    }
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody.trim();
  }

  if (status >= 500) {
    return 'Unable to sign in right now. Please try again in a moment.';
  }

  return 'Authentication failed. Please check your credentials and try again.';
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    if (GET_DATA_FROM_FAKE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = ALLOWED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error('No user exists with this email address.');
      }

      if (password.length < 6) {
        throw new Error('Invalid password. Please try again.');
      }

      if (user.status === 'Inactive') {
        throw new Error('This employee account is inactive.');
      }

      localStorage.setItem('nexus_user', JSON.stringify(user));
      return user;
    }

    const loginUrl = `${API_BASE_URL}/api/login`;

    console.info('[auth.login] Request started', {
      url: loginUrl,
      apiBaseUrl: API_BASE_URL || '(same-origin)',
      email,
    });

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const responseBody = await parseResponseBody(response);

    console.info('[auth.login] Response received', {
      url: loginUrl,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      body: responseBody,
    });

    if (!response.ok) {
      const message = getLoginErrorMessage(responseBody, response.status);
      console.error('[auth.login] Request failed', {
        url: loginUrl,
        status: response.status,
        message,
        body: responseBody,
      });
      throw new Error(message);
    }

    if (!responseBody || typeof responseBody !== 'object') {
      console.error('[auth.login] Invalid success payload', {
        url: loginUrl,
        status: response.status,
        body: responseBody,
      });
      throw new Error('Unable to sign in right now. Please try again in a moment.');
    }

    const user = responseBody as User;
    localStorage.setItem('nexus_user', JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem('nexus_user');
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem('nexus_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('nexus_user');
  }
};
