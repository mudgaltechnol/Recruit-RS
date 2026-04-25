import { GET_DATA_FROM_FAKE, API_BASE_URL, ENDPOINTS } from '../config';
import { MOCK_CANDIDATES, MOCK_ROLES, MOCK_ADMIN_STATS, MOCK_SCHEDULE_EVENTS, MOCK_REPORTS } from '../mockData';

// In-memory store for mock data to allow persistence during session
let localMockEvents = [...MOCK_SCHEDULE_EVENTS];
let localMockEmployees = [
  {
    id: '1',
    name: 'Recruit Right Solutions Admin',
    email: 'admin@recruitrightsolutions.com',
    role: 'admin',
    type: 1,
    status: 'Active',
    position: 'System Administrator',
    mobile: '+1 212 900 8800',
    address: '1200 Avenue of Americas, NY',
    updatedat: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Lakshay Mudgal',
    email: 'lakshaymudgal340@gmail.com',
    role: 'admin',
    type: 1,
    status: 'Active',
    position: 'Project Owner',
    mobile: '+91 9999999999',
    address: 'New Delhi, India',
    updatedat: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Senior Recruiter',
    email: 'recruiter@recruitrightsolutions.com',
    role: 'employee',
    type: 2,
    status: 'Active',
    position: 'Recruiter',
    mobile: '+91 8888888888',
    address: 'Remote',
    updatedat: new Date().toISOString()
  }
];

export const adminService = {
  getEmployees: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...localMockEmployees]), 400);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.EMPLOYEES}`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  addEmployee: async (employeeData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newEmployee = {
            id: Math.random().toString(36).slice(2, 9),
            ...employeeData,
            role: Number(employeeData.type) === 1 ? 'admin' : 'employee',
            status: employeeData.status || 'Active',
            updatedat: new Date().toISOString()
          };
          localMockEmployees = [newEmployee, ...localMockEmployees];
          resolve(newEmployee);
        }, 400);
      });
    }
    console.log('[employees][create][request]', employeeData);
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.EMPLOYEES}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData),
    });
    console.log('[employees][create][response-status]', response.status, response.statusText);
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      console.error('[employees][create][response-error]', error);
      throw new Error(error?.error || 'Failed to add employee');
    }
    const result = await response.json();
    console.log('[employees][create][response-data]', result);
    return result;
  },

  updateEmployee: async (id: string, employeeData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let updatedEmployee: any = null;
          localMockEmployees = localMockEmployees.map((employee) => {
            if (String(employee.id) !== String(id)) return employee;
            updatedEmployee = {
              ...employee,
              ...employeeData,
              role: Number(employeeData.type ?? employee.type) === 1 ? 'admin' : 'employee',
              updatedat: new Date().toISOString()
            };
            return updatedEmployee;
          });
          resolve(updatedEmployee);
        }, 400);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.EMPLOYEE_BY_ID(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to update employee');
    }
    return response.json();
  },

  updateEmployeeStatus: async (id: string, status: 'Active' | 'Inactive') => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let updatedEmployee: any = null;
          localMockEmployees = localMockEmployees.map((employee) => {
            if (String(employee.id) !== String(id)) return employee;
            updatedEmployee = { ...employee, status, updatedat: new Date().toISOString() };
            return updatedEmployee;
          });
          resolve(updatedEmployee);
        }, 300);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.EMPLOYEE_STATUS(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to update employee status');
    }
    return response.json();
  },

  deleteEmployee: async (id: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          localMockEmployees = localMockEmployees.filter((employee) => String(employee.id) !== String(id));
          resolve({ success: true });
        }, 300);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.EMPLOYEE_BY_ID(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to delete employee');
    }
    return response.json();
  },

  getCandidates: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_CANDIDATES), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.CANDIDATES}`);
    if (!response.ok) throw new Error('Failed to fetch candidates');
    return response.json();
  },

  getCandidateById: async (id: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const candidate = MOCK_CANDIDATES.find(c => c.id === id);
          if (candidate) resolve(candidate);
          else reject(new Error('Candidate not found'));
        }, 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.CANDIDATE_BY_ID(id)}`);
    if (!response.ok) throw new Error('Failed to fetch candidate details');
    return response.json();
  },

  getCandidateResumeAccess: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.CANDIDATE_RESUME_ACCESS(id)}`);
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to fetch resume access URL');
    }
    return response.json();
  },

  addCandidate: async (candidateData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: 'new-id', ...candidateData }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });
    if (!response.ok) throw new Error('Failed to add candidate');
    return response.json();
  },

  updateCandidate: async (id: string, candidateData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, ...candidateData }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });
    if (!response.ok) throw new Error('Failed to update candidate');
    return response.json();
  },

  deleteCandidate: async (id: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete candidate');
    return response.json();
  },

  applyCandidateToRole: async (candidateId: string, roleId: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, candidateId, roleId }), 300);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/applicants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to add candidate to role');
    }
    return response.json();
  },

  updateCandidateStatus: async (id: string, status: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/candidates/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  getRoles: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_ROLES), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.ROLES}`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  },

  addRole: async (roleData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Math.random().toString(36).substr(2, 9), ...roleData }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) throw new Error('Failed to add role');
    return response.json();
  },

  updateRole: async (id: string, roleData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, ...roleData }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/roles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) throw new Error('Failed to update role');
    return response.json();
  },

  deleteRole: async (id: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/roles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete role');
    return response.json();
  },

  downloadMarketReport: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock download
          const blob = new Blob(['Mock Market Report Content'], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'market-report.txt';
          a.click();
          window.URL.revokeObjectURL(url);
          resolve({ success: true });
        }, 1000);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/market`, {
      method: 'GET',
    });
    if (!response.ok) throw new Error('Failed to download report');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'market-report.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  getStats: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_ADMIN_STATS), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.STATS}`);
    if (!response.ok) throw new Error('Failed to fetch admin stats');
    return response.json();
  },

  search: async (query: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const candidates = MOCK_CANDIDATES.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) || 
            c.role.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
          const roles = MOCK_ROLES.filter(r => 
            r.title.toLowerCase().includes(query.toLowerCase()) || 
            r.client.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
          resolve({ candidates, roles });
        }, 300);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  getNewsletterSubscribersCount: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ count: MOCK_ADMIN_STATS.newsletterSubscribers }), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/newsletter/subscribers/count`);
    if (!response.ok) throw new Error('Failed to fetch subscribers count');
    return response.json();
  },

  sendNewsletter: async (subject: string, content: string) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: 'Broadcast sent to 1,240 subscribers!' }), 1500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.NEWSLETTER_SEND}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send newsletter');
    }
    return response.json();
  },

  getScheduleEvents: async () => {
    console.log('Fetching schedule events...');
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Returning ${localMockEvents.length} mock events`);
          resolve([...localMockEvents]); // Return a new array to trigger React updates
        }, 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.SCHEDULE.EVENTS}`);
    if (!response.ok) throw new Error('Failed to fetch schedule events');
    return response.json();
  },

  addScheduleEvent: async (eventData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newEvent = { id: Math.random().toString(36).substr(2, 9), ...eventData };
          localMockEvents = [...localMockEvents, newEvent];
          console.log('Added mock event:', newEvent.id);
          resolve(newEvent);
        }, 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.SCHEDULE.EVENTS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to add schedule event');
    }
    return response.json();
  },

  updateScheduleEvent: async (id: string, eventData: any) => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          localMockEvents = localMockEvents.map(e => String(e.id) === String(id) ? { ...e, ...eventData } : e);
          console.log('Updated mock event:', id);
          resolve({ success: true, ...eventData });
        }, 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.SCHEDULE.EVENT_BY_ID(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to update schedule event');
    }
    return response.json();
  },

  deleteScheduleEvent: async (id: string) => {
    console.log('Service: Deleting event with ID:', id);
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const initialCount = localMockEvents.length;
          const exists = localMockEvents.some(e => String(e.id) === String(id));
          if (!exists) {
            console.warn(`Service: Event with ID ${id} not found in localMockEvents`);
          }
          localMockEvents = localMockEvents.filter(e => String(e.id) !== String(id));
          console.log(`Service: Deleted event ${id}. Initial count: ${initialCount}, New count: ${localMockEvents.length}`);
          resolve({ success: true });
        }, 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.SCHEDULE.EVENT_BY_ID(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete schedule event');
    return response.json();
  },

  getReports: async () => {
    if (GET_DATA_FROM_FAKE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_REPORTS), 500);
      });
    }
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.REPORTS}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  }
};
