import alasql from 'alasql';
import { getMysqlPool } from '../db/mysql';
import { saveDb } from '../db/init';
import { MOCK_ADMIN_STATS } from '../mockData';
import { IS_PROD } from '../config';

const toMySqlDateTime = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const ensureAlaSQLTables = () => {
  const tables = (alasql as any).tables;
  if (!tables || !tables.roles) {
    console.log("Auto-initializing missing AlaSQL tables...");
    alasql("CREATE TABLE IF NOT EXISTS employees (id INT AUTOINCREMENT PRIMARY KEY, name STRING NOT NULL, email STRING NOT NULL UNIQUE, password STRING NOT NULL, position STRING, role STRING DEFAULT 'employee', type INT, status STRING, mobile STRING, address STRING, updatedat DATETIME)");
    alasql("CREATE TABLE IF NOT EXISTS roles (id STRING PRIMARY KEY, title STRING NOT NULL, client STRING NOT NULL, location STRING NOT NULL, salary STRING, expertise JSON, headcount STRING, status STRING DEFAULT 'Open', description STRING, experienceType STRING)");
    alasql("CREATE TABLE IF NOT EXISTS candidates (id STRING PRIMARY KEY, name STRING NOT NULL, email STRING NOT NULL, role STRING, experience STRING, phone STRING, location STRING, preferredLocation STRING, industry STRING, status STRING DEFAULT 'Applied', avatar STRING, summary STRING, skills JSON, matchScore INT, appliedDate STRING, expectedSalary STRING, noticePeriod STRING, source STRING, portfolio STRING, message STRING, resumeUrl STRING)");
    alasql("CREATE TABLE IF NOT EXISTS reviews (id INT AUTOINCREMENT PRIMARY KEY, author STRING NOT NULL, role STRING, content STRING, rating INT, date STRING)");
    alasql("CREATE TABLE IF NOT EXISTS newsletter_subscribers (email STRING PRIMARY KEY, subscribed_at DATETIME)");
    alasql("CREATE TABLE IF NOT EXISTS schedule_events (id STRING PRIMARY KEY, title STRING NOT NULL, startTime STRING NOT NULL, endTime STRING NOT NULL, candidateId STRING, candidateName STRING, candidateEmail STRING, roleId STRING, roleTitle STRING, type STRING, location STRING, status STRING DEFAULT 'Scheduled', notes STRING, sendCandidateEmail BOOLEAN, senderName STRING, senderEmail STRING, emailSubject STRING, emailMessage STRING)");
    alasql("CREATE TABLE IF NOT EXISTS applications (id STRING PRIMARY KEY, candidateId STRING NOT NULL, roleId STRING NOT NULL, email STRING NOT NULL, status STRING DEFAULT 'Applied', appliedDate STRING, updatedAt DATETIME)");
  }
};

export const dbService = {
  // Helper to execute queries on either MySQL or AlaSQL
  query: async (sql: string, params: any[] = []) => {
    const mysqlPool = getMysqlPool();
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.execute(sql, params);
        return rows as any[];
      } catch (err: any) {
        if (IS_PROD) {
          console.error("Production MySQL query failed:", err.message);
          throw err;
        }
        console.error("Local MySQL query failed, falling back to AlaSQL:", err.message);
        // Fall through to AlaSQL
      }
    }

    if (IS_PROD) {
      throw new Error("MySQL is required in production but not available.");
    }

    ensureAlaSQLTables();
    try {
      return alasql(sql, params) as any[];
    } catch (alasqlErr: any) {
      console.error("AlaSQL query failed:", alasqlErr.message);
      return [];
    }
  },

  // ROLES
  getRoles: async (filter?: { status?: string }) => {
    try {
      let rows: any[];
      if (filter?.status) {
        rows = await dbService.query('SELECT * FROM roles WHERE status = ?', [filter.status]);
      } else {
        rows = await dbService.query('SELECT * FROM roles');
      }
      const applicantRows = await dbService.query(
        `SELECT 
          a.roleId,
          c.id,
          c.name,
          c.email,
          c.phone,
          c.location,
          c.role,
          c.status,
          c.appliedDate
        FROM applications a
        LEFT JOIN candidates c ON c.id = a.candidateId`
      );
      const applicationCountMap = new Map<string, number>();
      const appliedCandidateDetailsMap = new Map<string, any[]>();

      applicantRows.forEach((row: any) => {
        if (!row.roleId) return;

        applicationCountMap.set(row.roleId, (applicationCountMap.get(row.roleId) || 0) + 1);

        if (!row.id) return;

        const existingDetails = appliedCandidateDetailsMap.get(row.roleId) || [];
        if (existingDetails.some((item) => item.id === row.id)) return;

        appliedCandidateDetailsMap.set(row.roleId, [
          ...existingDetails,
          {
            id: row.id,
            name: row.name || 'Unnamed',
            email: row.email || '',
            phone: row.phone || '',
            location: row.location || '',
            role: row.role || '',
            status: row.status || 'Applied',
            appliedDate: row.appliedDate || ''
          }
        ]);
      });

      return rows.map(r => ({
        ...r,
        expertise: typeof r.expertise === 'string' ? JSON.parse(r.expertise) : r.expertise,
        appliedCandidates: applicationCountMap.get(r.id) || 0,
        appliedCandidateNames: (appliedCandidateDetailsMap.get(r.id) || []).map((candidate) => candidate.name),
        appliedCandidateDetails: appliedCandidateDetailsMap.get(r.id) || []
      }));
    } catch (e) {
      console.error("dbService.getRoles error:", e);
      return [];
    }
  },

  getRoleById: async (id: string) => {
    try {
      const rows = await dbService.query('SELECT * FROM roles WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      const r = rows[0];
      const applicantRows = await dbService.query(
        `SELECT 
          a.roleId,
          c.id,
          c.name,
          c.email,
          c.phone,
          c.location,
          c.role,
          c.status,
          c.appliedDate
        FROM applications a
        LEFT JOIN candidates c ON c.id = a.candidateId
        WHERE a.roleId = ?`,
        [id]
      );
      const appliedCandidateDetails = applicantRows
        .filter((row: any) => row.id)
        .map((row: any) => ({
          id: row.id,
          name: row.name || 'Unnamed',
          email: row.email || '',
          phone: row.phone || '',
          location: row.location || '',
          role: row.role || '',
          status: row.status || 'Applied',
          appliedDate: row.appliedDate || ''
        }));
      return {
        ...r,
        expertise: typeof r.expertise === 'string' ? JSON.parse(r.expertise) : r.expertise,
        appliedCandidates: applicantRows.length,
        appliedCandidateNames: appliedCandidateDetails.map((candidate: any) => candidate.name),
        appliedCandidateDetails
      };
    } catch (e) {
      console.error("dbService.getRoleById error:", e);
      return null;
    }
  },

  addRole: async (roleData: any) => {
    try {
      const roleId = (roleData.title || "role")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const expertise = JSON.stringify(roleData.expertise || []);
      await dbService.query(
        'INSERT INTO roles (id, title, client, location, salary, expertise, headcount, status, description, experienceType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          roleId,
          roleData.title || '',
          roleData.client || '',
          roleData.location || '',
          roleData.salary || '',
          expertise,
          roleData.headcount || '0/1',
          roleData.status || 'Open',
          roleData.description || '',
          roleData.experienceType || ''
        ]
      );

      saveDb();
      return await dbService.getRoleById(roleId);
    } catch (e) {
      console.error("dbService.addRole error:", e);
      throw e;
    }
  },

  updateRole: async (id: string, roleData: any) => {
    try {
      const expertise = JSON.stringify(roleData.expertise || []);
      await dbService.query(
        'UPDATE roles SET title = ?, client = ?, location = ?, salary = ?, expertise = ?, headcount = ?, status = ?, description = ?, experienceType = ? WHERE id = ?',
        [
          roleData.title || '',
          roleData.client || '',
          roleData.location || '',
          roleData.salary || '',
          expertise,
          roleData.headcount || '0/1',
          roleData.status || 'Open',
          roleData.description || '',
          roleData.experienceType || '',
          id
        ]
      );

      saveDb();
      return await dbService.getRoleById(id);
    } catch (e) {
      console.error("dbService.updateRole error:", e);
      throw e;
    }
  },

  deleteRole: async (id: string) => {
    try {
      await dbService.query('DELETE FROM roles WHERE id = ?', [id]);
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.deleteRole error:", e);
      return false;
    }
  },

  // CANDIDATES
  getCandidates: async () => {
    try {
      const rows = await dbService.query('SELECT * FROM candidates');
      return rows.map(r => ({
        ...r,
        skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills
      }));
    } catch (e) {
      console.error("dbService.getCandidates error:", e);
      return [];
    }
  },

  getCandidateById: async (id: string) => {
    try {
      const rows = await dbService.query('SELECT * FROM candidates WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills
      };
    } catch (e) {
      console.error("dbService.getCandidateById error:", e);
      return null;
    }
  },

  getCandidateByEmail: async (email: string) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!normalizedEmail) return null;

      const rows = await dbService.query('SELECT * FROM candidates WHERE email = ?', [normalizedEmail]);
      if (rows.length === 0) return null;

      const r = rows[0];
      return {
        ...r,
        skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills
      };
    } catch (e) {
      console.error("dbService.getCandidateByEmail error:", e);
      return null;
    }
  },

  hasAppliedToRole: async (email: string, roleId: string) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!normalizedEmail || !roleId) return false;

      const rows = await dbService.query(
        'SELECT id FROM applications WHERE email = ? AND roleId = ?',
        [normalizedEmail, roleId]
      );
      return rows.length > 0;
    } catch (e) {
      console.error("dbService.hasAppliedToRole error:", e);
      return false;
    }
  },

  createApplication: async ({ candidateId, roleId, email, appliedDate, status = 'Applied' }: any) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const existing = await dbService.query(
        'SELECT id FROM applications WHERE email = ? AND roleId = ?',
        [normalizedEmail, roleId]
      );

      if (existing.length > 0) {
        return { duplicate: true, id: existing[0].id };
      }

      const applicationId = `${candidateId}-${roleId}`;
      await dbService.query(
        'INSERT INTO applications (id, candidateId, roleId, email, status, appliedDate, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [applicationId, candidateId, roleId, normalizedEmail, status, appliedDate, toMySqlDateTime()]
      );

      saveDb();
      return { duplicate: false, id: applicationId };
    } catch (e) {
      console.error("dbService.createApplication error:", e);
      throw e;
    }
  },

  applyCandidateToRole: async (candidateId: string, roleId: string) => {
    try {
      const candidate = await dbService.getCandidateById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const roleRows = await dbService.query('SELECT title FROM roles WHERE id = ?', [roleId]) as any[];
      if (roleRows.length === 0) {
        throw new Error('Selected role no longer exists.');
      }

      const normalizedEmail = String(candidate.email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error('Candidate email is required');
      }

      const alreadyApplied = await dbService.hasAppliedToRole(normalizedEmail, roleId);
      if (alreadyApplied) {
        const duplicateError = new Error('This candidate is already applied to this role.');
        (duplicateError as any).code = 'DUPLICATE_APPLICATION';
        throw duplicateError;
      }

      const appliedDate = new Date().toLocaleDateString();
      const roleTitle = roleRows[0].title || candidate.role || 'General Applicant';
      await dbService.query(
        'UPDATE candidates SET role = ?, appliedDate = ?, status = ? WHERE id = ?',
        [roleTitle, appliedDate, candidate.status || 'Applied', candidateId]
      );

      await dbService.createApplication({
        candidateId,
        roleId,
        email: normalizedEmail,
        appliedDate,
        status: candidate.status || 'Applied'
      });

      saveDb();
      return { success: true, candidateId, roleId };
    } catch (e) {
      console.error("dbService.applyCandidateToRole error:", e);
      throw e;
    }
  },

  addCandidate: async (candidateData: any) => {
    try {
      const { name, email, roleId, portfolio, message, resumeUrl } = candidateData;
      const normalizedEmail = (email || "").trim().toLowerCase();

      if (!normalizedEmail) {
        throw new Error("Email is required");
      }

      const roleRows = roleId ? await dbService.query('SELECT title FROM roles WHERE id = ?', [roleId]) as any[] : [];
      const roleTitle = roleRows.length > 0 ? roleRows[0].title : (candidateData.role || "General Applicant");
      const isRoleApplication = Boolean(roleId);

      if (isRoleApplication && roleRows.length === 0) {
        throw new Error("Selected role no longer exists.");
      }

      const appliedDate = new Date().toLocaleDateString();
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "C")}&background=random`;
      const existingCandidates = await dbService.query(
        'SELECT id, email, status, resumeUrl FROM candidates'
      ) as any[];

      const existing = existingCandidates.find((candidate) => {
        const candidateEmail = String(candidate.email || "").trim().toLowerCase();
        return candidateEmail === normalizedEmail;
      });

      if (isRoleApplication) {
        const alreadyApplied = await dbService.hasAppliedToRole(normalizedEmail, roleId);
        if (alreadyApplied) {
          const duplicateError = new Error("You already applied to this role.");
          (duplicateError as any).code = 'DUPLICATE_APPLICATION';
          throw duplicateError;
        }
      }

      let candidateId = existing?.id;
      const normalizedIndustry = String(candidateData.industry || '').trim();
      const normalizedPreferredLocation = String(candidateData.preferredLocation || '').trim();

      if (existing) {
        await dbService.query(
          'UPDATE candidates SET name = ?, email = ?, role = ?, status = ?, appliedDate = ?, portfolio = ?, message = ?, avatar = ?, experience = ?, phone = ?, location = ?, preferredLocation = ?, industry = ?, resumeUrl = ?, summary = ? WHERE id = ?',
          [
            name || "Unnamed",
            normalizedEmail,
            roleTitle,
            candidateData.status || existing.status || 'Applied',
            appliedDate,
            portfolio || "",
            message || "",
            avatar,
            candidateData.experience || "0 Years",
            candidateData.phone || "",
            candidateData.location || "Remote",
            normalizedPreferredLocation,
            normalizedIndustry,
            resumeUrl || existing.resumeUrl || "",
            candidateData.summary || "",
            existing.id
          ]
        );
      } else {
        candidateId = (name || "candidate").toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
        await dbService.query(
          "INSERT INTO candidates (id, name, email, role, status, appliedDate, portfolio, message, avatar, skills, experience, phone, location, preferredLocation, industry, resumeUrl, summary, matchScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [candidateId, name || "Unnamed", normalizedEmail, roleTitle, candidateData.status || 'Applied', appliedDate, portfolio || "", message || "", avatar, '[]', candidateData.experience || "0 Years", candidateData.phone || "", candidateData.location || "Remote", normalizedPreferredLocation, normalizedIndustry, resumeUrl || "", candidateData.summary || "", 75]
        );
      }

      if (isRoleApplication && candidateId) {
        await dbService.createApplication({
          candidateId,
          roleId,
          email: normalizedEmail,
          appliedDate,
          status: candidateData.status || 'Applied'
        });
      }

      saveDb();
      return { id: candidateId, name, email: normalizedEmail, role: roleTitle, updated: Boolean(existing) };
    } catch (e) {
      console.error("dbService.addCandidate error:", e);
      throw e;
    }
  },

  updateCandidate: async (id: string, candidateData: any) => {
    try {
      const { name, email, portfolio, message, resumeUrl, industry, preferredLocation, summary, experience, phone, location } = candidateData;
      const normalizedEmail = (email || "").trim().toLowerCase();
      const normalizedIndustry = String(industry || '').trim();
      const normalizedPreferredLocation = String(preferredLocation || '').trim();

      await dbService.query(
        'UPDATE candidates SET name = ?, email = ?, portfolio = ?, message = ?, experience = ?, phone = ?, location = ?, preferredLocation = ?, industry = ?, resumeUrl = ?, summary = ? WHERE id = ?',
        [
          name || "Unnamed",
          normalizedEmail,
          portfolio || "",
          message || "",
          experience || "0 Years",
          phone || "",
          location || "Remote",
          normalizedPreferredLocation,
          normalizedIndustry,
          resumeUrl || "",
          summary || "",
          id
        ]
      );
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.updateCandidate error:", e);
      throw e;
    }
  },

  deleteCandidate: async (id: string) => {
    try {
      await dbService.query('DELETE FROM candidates WHERE id = ?', [id]);
      await dbService.query('DELETE FROM applications WHERE candidateId = ?', [id]);
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.deleteCandidate error:", e);
      return false;
    }
  },

  updateCandidateStatus: async (id: string, status: string) => {
    try {
      const result = await dbService.query('UPDATE candidates SET status = ? WHERE id = ?', [status, id]);
      saveDb();
      return true; // MySQL returns metadata, AlaSQL returns count. We'll assume success if no error.
    } catch (e) {
      console.error("dbService.updateCandidateStatus error:", e);
      return false;
    }
  },

  updateCandidateResume: async (id: string, resumeUrl: string) => {
    try {
      const result = await dbService.query('UPDATE candidates SET resumeUrl = ? WHERE id = ?', [resumeUrl, id]);
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.updateCandidateResume error:", e);
      return false;
    }
  },

  // NEWSLETTER
  getTestimonials: async () => {
    try {
      return await dbService.query('SELECT * FROM reviews ORDER BY id DESC');
    } catch (e) {
      console.error("dbService.getTestimonials error:", e);
      return [];
    }
  },

  getSubscribers: async () => {
    try {
      const rows = await dbService.query('SELECT email FROM newsletter_subscribers');
      return rows.map(r => r.email);
    } catch (e) {
      console.error("dbService.getSubscribers error:", e);
      return [];
    }
  },

  addSubscriber: async (email: string) => {
    try {
      await dbService.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
      saveDb();
      return true;
    } catch (error) {
      return false; // Email already exists or other error
    }
  },

  getSubscriberCount: async () => {
    try {
      const rows = await dbService.query('SELECT COUNT(*) as count FROM newsletter_subscribers');
      return rows.length > 0 ? rows[0].count : 0;
    } catch (e) {
      console.error("dbService.getSubscriberCount error:", e);
      return 0;
    }
  },

  getEmployeeByEmail: async (email: string) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const rows = await dbService.query('SELECT * FROM employees WHERE LOWER(email) = ?', [normalizedEmail]);
      return rows.length > 0 ? rows[0] : null;
    } catch (e) {
      console.error("dbService.getEmployeeByEmail error:", e);
      return null;
    }
  },

  getEmployees: async () => {
    try {
      const rows = await dbService.query('SELECT * FROM employees ORDER BY updatedat DESC, id DESC');
      return rows.map((employee: any) => ({
        ...employee,
        type: Number(employee.type ?? (String(employee.role || '').toLowerCase() === 'admin' ? 1 : 2)) || 2,
        status: String(employee.status || 'Active').trim() || 'Active',
        role: String(employee.role || 'employee').trim() || 'employee'
      }));
    } catch (e) {
      console.error("dbService.getEmployees error:", e);
      return [];
    }
  },

  addEmployee: async (employeeData: any) => {
    try {
      const name = String(employeeData.name || '').trim();
      const email = String(employeeData.email || '').trim().toLowerCase();
      const password = String(employeeData.password || '').trim();
      const type = Number(employeeData.type) === 1 ? 1 : 2;
      const role = type === 1 ? 'admin' : 'employee';
      const status = String(employeeData.status || 'Active').trim() === 'Inactive' ? 'Inactive' : 'Active';
      const position = String(employeeData.position || '').trim();
      const mobile = String(employeeData.mobile || '').trim();
      const address = String(employeeData.address || '').trim();

      if (!name) throw new Error('Employee name is required');
      if (!email) throw new Error('Employee email is required');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

      await dbService.query(
        'INSERT INTO employees (name, email, password, position, role, type, status, mobile, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, password, position, role, type, status, mobile, address]
      );

      saveDb();
      return await dbService.getEmployeeByEmail(email);
    } catch (e: any) {
      console.error("dbService.addEmployee error:", e);
      const normalizedMessage = String(e?.message || '').toLowerCase();
      if (
        normalizedMessage.includes('unique') ||
        normalizedMessage.includes('duplicate') ||
        normalizedMessage.includes('exists')
      ) {
        throw new Error('An employee with this email already exists');
      }
      throw e;
    }
  },

  updateEmployee: async (id: string, employeeData: any) => {
    try {
      const name = String(employeeData.name || '').trim();
      const email = String(employeeData.email || '').trim().toLowerCase();
      const password = String(employeeData.password || '').trim();
      const type = Number(employeeData.type) === 1 ? 1 : 2;
      const role = type === 1 ? 'admin' : 'employee';
      const status = String(employeeData.status || 'Active').trim() === 'Inactive' ? 'Inactive' : 'Active';
      const position = String(employeeData.position || '').trim();
      const mobile = String(employeeData.mobile || '').trim();
      const address = String(employeeData.address || '').trim();

      if (!name) throw new Error('Employee name is required');
      if (!email) throw new Error('Employee email is required');

      if (password) {
        await dbService.query(
          'UPDATE employees SET name = ?, email = ?, password = ?, position = ?, role = ?, type = ?, status = ?, mobile = ?, address = ?, updatedat = ? WHERE id = ?',
          [name, email, password, position, role, type, status, mobile, address, toMySqlDateTime(), id]
        );
      } else {
        await dbService.query(
          'UPDATE employees SET name = ?, email = ?, position = ?, role = ?, type = ?, status = ?, mobile = ?, address = ?, updatedat = ? WHERE id = ?',
          [name, email, position, role, type, status, mobile, address, toMySqlDateTime(), id]
        );
      }

      saveDb();
      const updatedRows = await dbService.query('SELECT * FROM employees WHERE id = ?', [id]);
      return updatedRows.length > 0 ? updatedRows[0] : null;
    } catch (e: any) {
      console.error("dbService.updateEmployee error:", e);
      const normalizedMessage = String(e?.message || '').toLowerCase();
      if (
        normalizedMessage.includes('unique') ||
        normalizedMessage.includes('duplicate') ||
        normalizedMessage.includes('exists')
      ) {
        throw new Error('An employee with this email already exists');
      }
      throw e;
    }
  },

  updateEmployeeStatus: async (id: string, status: string) => {
    try {
      const normalizedStatus = String(status || '').trim() === 'Inactive' ? 'Inactive' : 'Active';
      await dbService.query(
        'UPDATE employees SET status = ?, updatedat = ? WHERE id = ?',
        [normalizedStatus, toMySqlDateTime(), id]
      );
      saveDb();
      const updatedRows = await dbService.query('SELECT * FROM employees WHERE id = ?', [id]);
      return updatedRows.length > 0 ? updatedRows[0] : null;
    } catch (e) {
      console.error("dbService.updateEmployeeStatus error:", e);
      throw e;
    }
  },

  deleteEmployee: async (id: string) => {
    try {
      await dbService.query('DELETE FROM employees WHERE id = ?', [id]);
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.deleteEmployee error:", e);
      return false;
    }
  },

  // SCHEDULE
  getScheduleEvents: async () => {
    try {
      return await dbService.query('SELECT * FROM schedule_events');
    } catch (e) {
      console.error("dbService.getScheduleEvents error:", e);
      return [];
    }
  },

  addScheduleEvent: async (eventData: any) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await dbService.query("INSERT INTO schedule_events (id, title, startTime, endTime, candidateId, candidateName, candidateEmail, roleId, roleTitle, type, location, status, notes, sendCandidateEmail, senderName, senderEmail, emailSubject, emailMessage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, eventData.title, eventData.startTime, eventData.endTime, eventData.candidateId || null, eventData.candidateName || null, eventData.candidateEmail || null, eventData.roleId || null, eventData.roleTitle || null, eventData.type || 'Meeting', eventData.location || '', eventData.status || 'Scheduled', eventData.notes || '', eventData.sendCandidateEmail ? 1 : 0, eventData.senderName || null, eventData.senderEmail || null, eventData.emailSubject || null, eventData.emailMessage || null]);
      saveDb();
      return { id, ...eventData };
    } catch (e) {
      console.error("dbService.addScheduleEvent error:", e);
      throw e;
    }
  },

  updateScheduleEvent: async (id: string, eventData: any) => {
    try {
      const keys = Object.keys(eventData);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = Object.values(eventData);
      await dbService.query(`UPDATE schedule_events SET ${setClause} WHERE id = ?`, [...values, id]);
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.updateScheduleEvent error:", e);
      return false;
    }
  },

  deleteScheduleEvent: async (id: string) => {
    try {
      console.log('dbService: Deleting event with ID:', id);
      await dbService.query('DELETE FROM schedule_events WHERE id = ?', [id]);
      console.log(`dbService: Deleted rows for ID ${id}`);
      saveDb();
      return true;
    } catch (e) {
      console.error("dbService.deleteScheduleEvent error:", e);
      return false;
    }
  },

  // STATS
  getGlobalStats: async () => {
    try {
      const openRolesRows = await dbService.query('SELECT COUNT(*) AS total_count FROM roles WHERE status = \'Open\'');
      const candidatesRows = await dbService.query('SELECT COUNT(*) AS total_count FROM candidates');
      const interviewingRows = await dbService.query('SELECT COUNT(*) AS total_count FROM candidates WHERE status = \'Interviewing\'');
      const selectedRows = await dbService.query('SELECT COUNT(*) AS total_count FROM candidates WHERE status = \'Selected\' OR status = \'Placed\'');
      const reviewsRows = await dbService.query('SELECT * FROM reviews');
      const clientsRows = await dbService.query('SELECT COUNT(DISTINCT client) AS total_count FROM roles');

      const activeCandidates = candidatesRows.length > 0 ? candidatesRows[0].total_count : 0;
      const selectedCount = selectedRows.length > 0 ? selectedRows[0].total_count : 0;
      const totalClients = clientsRows.length > 0 ? clientsRows[0].total_count : 0;
      const selectionGoal = activeCandidates > 0 ? Math.round((selectedCount / activeCandidates) * 100) : 0;

      const stats = {
        stats: {
          totalPlacements: selectedCount,
          activeMandates: openRolesRows.length > 0 ? openRolesRows[0].count : 0,
          talentPoolSize: activeCandidates > 1000 ? (activeCandidates / 1000).toFixed(1) + "k" : activeCandidates.toString(),
          avgTimeToFill: "0 Days" // Could be calculated if we had 'filledDate'
        },
        reviews: reviewsRows,
        openRoles: openRolesRows.length > 0 ? openRolesRows[0].count : 0,
        activeCandidates: activeCandidates,
        totalClients: totalClients,
        interviewStage: interviewingRows.length > 0 ? interviewingRows[0].count : 0,
        selectionGoal: selectionGoal,
        monthlySelections: selectedCount,
        rejections: 0,
        timeToHireReduction: 0,
        revenue: {
          current: `$${(selectedCount * 15).toFixed(1)}k`, // Mock revenue based on placements
          growth: "0%",
          target: "$0"
        },
        topSkills: [],
        recentActivity: []
      };
      // Try to get real top skills from candidates
      try {
        const allCandidates = await dbService.query('SELECT skills FROM candidates');
        const skillCounts: { [key: string]: number } = {};
        allCandidates.forEach(c => {
          try {
            const skills = typeof c.skills === 'string' ? JSON.parse(c.skills) : c.skills;
            if (Array.isArray(skills)) {
              skills.forEach((s: string) => {
                skillCounts[s] = (skillCounts[s] || 0) + 1;
              });
            }
          } catch (e) { }
        });
        stats.topSkills = Object.entries(skillCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
      } catch (e) { }

      return stats;
    } catch (e) {
      console.error("dbService.getGlobalStats error:", e);
      // Return a basic structure instead of null to prevent frontend crashes
      return {
        stats: { totalPlacements: 0, activeMandates: 0, talentPoolSize: "0", avgTimeToFill: "N/A" },
        reviews: [],
        openRoles: 0,
        activeCandidates: 0,
        interviewStage: 0,
        selectionGoal: 0
      };
    }
  },

  getReports: async () => {
    try {
      const candidateRows = await dbService.query('SELECT status, source, role FROM candidates');
      const roleRows = await dbService.query('SELECT id, title FROM roles');
      const applicationRows = await dbService.query('SELECT roleId, appliedDate FROM applications');
      const subscriberRows = await dbService.query('SELECT subscribed_at FROM newsletter_subscribers');

      const normalizedCandidates = candidateRows.map((candidate: any) => ({
        status: String(candidate.status || 'Applied').trim(),
        source: String(candidate.source || 'Direct Applications').trim() || 'Direct Applications',
        role: String(candidate.role || '').trim(),
      }));

      const countByStatus = (statuses: string[]) =>
        normalizedCandidates.filter((candidate: any) => statuses.includes(candidate.status)).length;

      const funnel = [
        { stage: 'Applied', count: countByStatus(['Applied']), color: '#64748b' },
        { stage: 'Screening', count: countByStatus(['Screening', 'Shortlisted']), color: '#3b82f6' },
        { stage: 'Interviewing', count: countByStatus(['Interviewing']), color: '#8b5cf6' },
        { stage: 'Technical Review', count: countByStatus(['Technical Review']), color: '#06b6d4' },
        { stage: 'Offer', count: countByStatus(['Offer', 'Offered']), color: '#10b981' },
        { stage: 'Selected', count: countByStatus(['Selected', 'Placed']), color: '#0f172a' }
      ];

      const sourceMetrics = normalizedCandidates.reduce((acc: Record<string, { count: number; selected: number }>, candidate: any) => {
        if (!acc[candidate.source]) {
          acc[candidate.source] = { count: 0, selected: 0 };
        }
        acc[candidate.source].count += 1;
        if (['Selected', 'Placed'].includes(candidate.status)) {
          acc[candidate.source].selected += 1;
        }
        return acc;
      }, {});
      const totalCandidates = normalizedCandidates.length;
      const selectedCount = countByStatus(['Selected', 'Placed']);
      const sourcing = Object.entries(sourceMetrics)
        .map(([source, metrics]) => ({
          source,
          count: metrics.count,
          quality: metrics.count > 0 ? Math.round((metrics.selected / metrics.count) * 100) : 0
        }))
        .sort((a, b) => {
          if (b.quality !== a.quality) return b.quality - a.quality;
          return b.count - a.count;
        })
        .slice(0, 4);
      const topPerformer = sourcing[0] || null;

      const applicationsByRole = applicationRows.reduce((acc: Record<string, number>, application: any) => {
        const roleId = String(application.roleId || '').trim();
        if (roleId) {
          acc[roleId] = (acc[roleId] || 0) + 1;
        }
        return acc;
      }, {});
      const timeToFill = roleRows
        .slice(0, 5)
        .map((role: any, index: number) => {
          const title = String(role.title || `Role ${index + 1}`).trim();
          const roleId = String(role.id || '').trim();
          const demand = applicationsByRole[roleId] || 0;
          return {
            role: title,
            days: Math.max(10, 40 - (demand * 2) + index * 3)
          };
        });

      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const placementsBase = Math.max(1, selectedCount);
      const subscriberCount = subscriberRows.length;
      const revenueGrowth = monthLabels.map((month, index) => ({
        month,
        revenue: (placementsBase + index) * 15000 + (subscriberCount * 10),
        placements: Math.max(1, Math.round((placementsBase / 2) + index))
      }));

      return {
        funnel,
        sourcing,
        topPerformer,
        timeToFill,
        revenueGrowth
      };
    } catch (e) {
      console.error("dbService.getReports error:", e);
      return {
        funnel: [
          { stage: 'Applied', count: 0, color: '#64748b' },
          { stage: 'Screening', count: 0, color: '#3b82f6' },
          { stage: 'Interviewing', count: 0, color: '#8b5cf6' },
          { stage: 'Technical Review', count: 0, color: '#06b6d4' },
          { stage: 'Offer', count: 0, color: '#10b981' },
          { stage: 'Selected', count: 0, color: '#0f172a' }
        ],
        sourcing: [],
        topPerformer: null,
        timeToFill: [],
        revenueGrowth: []
      };
    }
  },

  getAdminStats: async () => {
    try {
      const openRolesRows = await dbService.query('SELECT COUNT(*) AS total_count FROM roles WHERE status = \'Open\'');
      const activeCandidatesRows = await dbService.query('SELECT COUNT(*) AS total_count FROM candidates');
      const interviewingRows = await dbService.query('SELECT COUNT(*) AS total_count FROM candidates WHERE status = \'Interviewing\'');
      const selectedRows = await dbService.query('SELECT COUNT(*) AS total_count FROM candidates WHERE status = \'Selected\' OR status = \'Placed\'');
      const subscribersRows = await dbService.query('SELECT COUNT(*) AS total_count FROM newsletter_subscribers');

      const activeCandidates = activeCandidatesRows.length > 0 ? activeCandidatesRows[0].total_count : 0;
      const selectedCount = selectedRows.length > 0 ? selectedRows[0].total_count : 0;
      const selectionGoal = activeCandidates > 0 ? Math.round((selectedCount / activeCandidates) * 100) : 0;

      const stats = {
        openRoles: openRolesRows.length > 0 ? openRolesRows[0].total_count : 0,
        activeCandidates: activeCandidates,
        interviewStage: interviewingRows.length > 0 ? interviewingRows[0].total_count : 0,
        selectionGoal: selectionGoal,
        monthlySelections: selectedCount,
        marketTrends: [
          { label: "Revit Mastery", growth: "0%", status: "Stable" },
          { label: "BIM Coordination", growth: "0%", status: "Stable" },
          { label: "Sustainability", growth: "0%", status: "Stable" }
        ],
        revenue: {
          current: `$${(selectedCount * 15).toFixed(1)}k`,
          growth: "0%",
          target: "$0"
        },
        topSkills: [] as any[],
        recentActivity: [] as any[],
        velocityData: [0, 0, 0, 0, 0, 0, 0],
        timeToHireReduction: 0,
        newsletterSubscribers: subscribersRows.length > 0 ? subscribersRows[0].total_count : 0
      };

      // Try to get real top skills from candidates
      try {
        const allCandidates = await dbService.query('SELECT skills FROM candidates');
        const skillCounts: { [key: string]: number } = {};
        allCandidates.forEach(c => {
          try {
            const skills = typeof c.skills === 'string' ? JSON.parse(c.skills) : c.skills;
            if (Array.isArray(skills)) {
              skills.forEach((s: string) => {
                skillCounts[s] = (skillCounts[s] || 0) + 1;
              });
            }
          } catch (e) { }
        });
        stats.topSkills = Object.entries(skillCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
      } catch (e) { }

      return stats;
    } catch (e) {
      console.error("dbService.getAdminStats error:", e);
      return {
        openRoles: 0,
        activeCandidates: 0,
        interviewStage: 0,
        selectionGoal: 0,
        monthlySelections: 0,
        marketTrends: [],
        revenue: { current: "$0", growth: "0%", target: "$0" },
        topSkills: [],
        recentActivity: [],
        velocityData: [0, 0, 0, 0, 0, 0, 0],
        timeToHireReduction: 0,
        newsletterSubscribers: 0
      };
    }
  }
};
