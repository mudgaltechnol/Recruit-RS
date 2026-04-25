import fs from 'fs';
import alasql from 'alasql';
import path from 'path';
import { getMysqlPool } from './mysql';
import { IS_PROD } from '../config';
import { MOCK_CANDIDATES, MOCK_SCHEDULE_EVENTS } from '../mockData';

const DB_FILE = path.join(process.cwd(), 'database.json');

async function addMysqlColumnIfMissing(mysqlPool: any, tableName: string, columnName: string, definition: string) {
  const [rows] = await mysqlPool.query(
    `SELECT COUNT(*) as count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if ((rows as any)[0]?.count === 0) {
    await mysqlPool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureMysqlAutoIncrementId(mysqlPool: any, tableName: string) {
  const [rows] = await mysqlPool.query(
    `SELECT COLUMN_TYPE, COLUMN_KEY, EXTRA
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'id'`,
    [tableName]
  );

  const idColumn = (rows as any[])[0];
  const columnType = String(idColumn?.COLUMN_TYPE || '').toLowerCase();
  const hasPrimaryKey = idColumn?.COLUMN_KEY === 'PRI';
  const isAutoIncrement = String(idColumn?.EXTRA || '').toLowerCase().includes('auto_increment');

  if (!idColumn) return;

  if (!columnType.includes('int')) {
    const [invalidIds] = await mysqlPool.query(
      `SELECT id
       FROM ${tableName}
       WHERE id IS NOT NULL
         AND CAST(id AS CHAR) NOT REGEXP '^[0-9]+$'
       LIMIT 1`
    );

    if ((invalidIds as any[]).length > 0) {
      throw new Error(`${tableName}.id contains non-numeric values and cannot be converted to AUTO_INCREMENT INT safely`);
    }
  }

  if (!columnType.includes('int') || !hasPrimaryKey || !isAutoIncrement) {
    await mysqlPool.execute(`ALTER TABLE ${tableName} MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT`);
  }
}

export async function initDb() {
  const mysqlPool = getMysqlPool();

  if (IS_PROD && !mysqlPool) {
    throw new Error('Production database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, and optionally DB_PORT.');
  }

  if (mysqlPool) {
    try {
      console.log("Initializing MySQL RDS Database...");
      // Test connection
      await mysqlPool.query('SELECT 1');
      
      // 1. Create Tables (MySQL Syntax)
      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        role VARCHAR(255) DEFAULT 'employee',
        type INT DEFAULT 2,
        status VARCHAR(255) DEFAULT 'Active',
        mobile VARCHAR(255),
        address TEXT,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);

      await ensureMysqlAutoIncrementId(mysqlPool, 'employees');
      await addMysqlColumnIfMissing(mysqlPool, 'employees', 'type', 'INT DEFAULT 2');
      await addMysqlColumnIfMissing(mysqlPool, 'employees', 'status', 'VARCHAR(255) DEFAULT \'Active\'');
      await addMysqlColumnIfMissing(
        mysqlPool,
        'employees',
        'updatedat',
        'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      );

      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY, 
        title VARCHAR(255) NOT NULL, 
        client VARCHAR(255) NOT NULL, 
        location VARCHAR(255) NOT NULL, 
        salary VARCHAR(255), 
        expertise JSON, 
        headcount VARCHAR(255), 
        status VARCHAR(255) DEFAULT 'Open', 
        description TEXT
      )`);
      
      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(255) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        email VARCHAR(255) NOT NULL, 
        role VARCHAR(255), 
        experience VARCHAR(255), 
        phone VARCHAR(255), 
        location VARCHAR(255), 
        preferredLocation VARCHAR(255),
        industry VARCHAR(255),
        status VARCHAR(255) DEFAULT 'Applied', 
        avatar VARCHAR(255), 
        summary TEXT, 
        skills JSON, 
        matchScore INT, 
        appliedDate VARCHAR(255), 
        expectedSalary VARCHAR(255), 
        noticePeriod VARCHAR(255), 
        source VARCHAR(255), 
        portfolio VARCHAR(255), 
        message TEXT, 
        resumeUrl VARCHAR(255)
      )`);

      await addMysqlColumnIfMissing(mysqlPool, 'candidates', 'preferredLocation', 'VARCHAR(255)');
      await addMysqlColumnIfMissing(mysqlPool, 'candidates', 'industry', 'VARCHAR(255)');

      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        author VARCHAR(255) NOT NULL, 
        role VARCHAR(255), 
        content TEXT, 
        rating INT, 
        date VARCHAR(255)
      )`);

      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        email VARCHAR(255) PRIMARY KEY, 
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS schedule_events (
        id VARCHAR(255) PRIMARY KEY, 
        title VARCHAR(255) NOT NULL, 
        startTime VARCHAR(255) NOT NULL, 
        endTime VARCHAR(255) NOT NULL, 
        candidateId VARCHAR(255), 
        candidateName VARCHAR(255), 
        candidateEmail VARCHAR(255), 
        roleId VARCHAR(255), 
        roleTitle VARCHAR(255), 
        type VARCHAR(255), 
        location VARCHAR(255), 
        status VARCHAR(255) DEFAULT 'Scheduled', 
        notes TEXT,
        sendCandidateEmail TINYINT(1) DEFAULT 0,
        senderName VARCHAR(255),
        senderEmail VARCHAR(255),
        emailSubject VARCHAR(255),
        emailMessage TEXT
      )`);

      await addMysqlColumnIfMissing(mysqlPool, 'schedule_events', 'candidateEmail', 'VARCHAR(255)');
      await addMysqlColumnIfMissing(mysqlPool, 'schedule_events', 'sendCandidateEmail', 'TINYINT(1) DEFAULT 0');
      await addMysqlColumnIfMissing(mysqlPool, 'schedule_events', 'senderName', 'VARCHAR(255)');
      await addMysqlColumnIfMissing(mysqlPool, 'schedule_events', 'senderEmail', 'VARCHAR(255)');
      await addMysqlColumnIfMissing(mysqlPool, 'schedule_events', 'emailSubject', 'VARCHAR(255)');
      await addMysqlColumnIfMissing(mysqlPool, 'schedule_events', 'emailMessage', 'TEXT');

      await mysqlPool.execute(`CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(255) PRIMARY KEY,
        candidateId VARCHAR(255) NOT NULL,
        roleId VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(255) DEFAULT 'Applied',
        appliedDate VARCHAR(255),
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);

      // Seed Initial Data if empty
      if (process.env.SKIP_SEEDING === 'true') {
        console.log("Skipping database seeding as per SKIP_SEEDING environment variable.");
        return;
      }

      const [employees] = await mysqlPool.execute('SELECT COUNT(*) as count FROM employees');
      if ((employees as any)[0].count === 0) {
        await mysqlPool.execute("INSERT INTO employees (name, email, password, position, role, type, status, mobile, address) VALUES ('Recruit Right Solutions Admin', 'admin@recruitrightsolutions.com', 'admin123', 'System Administrator', 'admin', 1, 'Active', '+1 212 900 8800', '1200 Avenue of Americas, NY'), ('Lakshay Mudgal', 'lakshaymudgal340@gmail.com', 'admin123', 'Project Owner', 'admin', 1, 'Active', '+91 9999999999', 'New Delhi, India')");
      }

      const [roles] = await mysqlPool.execute('SELECT COUNT(*) as count FROM roles');
      if ((roles as any)[0].count === 0) {
        await mysqlPool.execute("INSERT INTO roles (id, title, client, location, salary, expertise, headcount, status, description) VALUES ('senior-project-architect', 'Senior Project Architect', 'Foster + Partners', 'New York, NY', '$140k - $185k', '[\"Revit\", \"Sustainability\"]', '2/3', 'Open', 'Leading the design and delivery of high-profile commercial projects in Manhattan.'), ('bim-manager', 'BIM Manager', 'Zaha Hadid Architects', 'London, UK', '£85k - £110k', '[\"BIM Level 2\", \"Rhino\"]', '0/1', 'Open', 'Implementing complex BIM workflows for parametric architectural projects.'), ('junior-urban-designer', 'Junior Urban Designer', 'Gensler', 'Berlin, DE', '€45k - €55k', '[\"Vectorworks\"]', '1/1', 'Open', 'Supporting the urban planning team on sustainable city initiatives across Europe.')");
      }

      const [candidates] = await mysqlPool.execute('SELECT COUNT(*) as count FROM candidates');
      if ((candidates as any)[0].count === 0) {
        for (const c of MOCK_CANDIDATES as Array<Record<string, any>>) {
          await mysqlPool.execute("INSERT INTO candidates (id, name, email, role, status, appliedDate, avatar, skills, matchScore, experience, phone, location, preferredLocation, industry, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [c.id, c.name, c.email, c.role, c.status, c.appliedDate || new Date().toLocaleDateString(), c.avatar, JSON.stringify(c.skills || []), c.matchScore || 80, c.experience || "0 Years", c.phone || "", c.location || "Remote", c.preferredLocation || "", c.industry || "", c.summary || ""]);
        }
      }

      const [reviews] = await mysqlPool.execute('SELECT COUNT(*) as count FROM reviews');
      if ((reviews as any)[0].count === 0) {
        await mysqlPool.execute("INSERT INTO reviews (author, role, content, rating, date) VALUES ('James Wilson', 'Director at Foster + Partners', 'Nexus Talent has consistently delivered high-caliber architects who understand our design ethos.', 5, '2 days ago'), ('Elena Rossi', 'Senior Associate at Zaha Hadid', 'The level of technical screening provided by Nexus is unparalleled in the industry.', 5, '1 week ago')");
      }

      const [events] = await mysqlPool.execute('SELECT COUNT(*) as count FROM schedule_events');
      if ((events as any)[0].count === 0) {
        for (const e of MOCK_SCHEDULE_EVENTS as any[]) {
          await mysqlPool.execute("INSERT INTO schedule_events (id, title, startTime, endTime, candidateId, candidateName, candidateEmail, roleId, roleTitle, type, location, status, notes, sendCandidateEmail, senderName, senderEmail, emailSubject, emailMessage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [e.id, e.title, e.startTime, e.endTime, e.candidateId, e.candidateName, e.candidateEmail || null, e.roleId, e.roleTitle, e.type, e.location, e.status, e.notes, e.sendCandidateEmail ? 1 : 0, e.senderName || null, e.senderEmail || null, e.emailSubject || null, e.emailMessage || null]);
        }
      }
      console.log("MySQL RDS Initialization complete.");
      return;
    } catch (mysqlErr) {
      if (IS_PROD) {
        throw mysqlErr;
      }
      console.error("MySQL Initialization failed, falling back to AlaSQL:", mysqlErr.message);
    }
  }

  try {
    console.log("Initializing AlaSQL Database...");
    // --- ALASQL FALLBACK ---
    // 1. Create Tables (Standard SQL)
    alasql("CREATE TABLE IF NOT EXISTS employees (id INT AUTOINCREMENT PRIMARY KEY, name STRING NOT NULL, email STRING NOT NULL UNIQUE, password STRING NOT NULL, position STRING, role STRING DEFAULT 'employee', type INT, status STRING, mobile STRING, address STRING, updatedat DATETIME)");
    alasql("CREATE TABLE IF NOT EXISTS roles (id STRING PRIMARY KEY, title STRING NOT NULL, client STRING NOT NULL, location STRING NOT NULL, salary STRING, expertise JSON, headcount STRING, status STRING DEFAULT 'Open', description STRING)");
    alasql("CREATE TABLE IF NOT EXISTS candidates (id STRING PRIMARY KEY, name STRING NOT NULL, email STRING NOT NULL, role STRING, experience STRING, phone STRING, location STRING, preferredLocation STRING, industry STRING, status STRING DEFAULT 'Applied', avatar STRING, summary STRING, skills JSON, matchScore INT, appliedDate STRING, expectedSalary STRING, noticePeriod STRING, source STRING, portfolio STRING, message STRING, resumeUrl STRING)");
    alasql("CREATE TABLE IF NOT EXISTS reviews (id INT AUTOINCREMENT PRIMARY KEY, author STRING NOT NULL, role STRING, content STRING, rating INT, date STRING)");
    alasql("CREATE TABLE IF NOT EXISTS newsletter_subscribers (email STRING PRIMARY KEY, subscribed_at DATETIME)");
    alasql("CREATE TABLE IF NOT EXISTS schedule_events (id STRING PRIMARY KEY, title STRING NOT NULL, startTime STRING NOT NULL, endTime STRING NOT NULL, candidateId STRING, candidateName STRING, candidateEmail STRING, roleId STRING, roleTitle STRING, type STRING, location STRING, status STRING DEFAULT 'Scheduled', notes STRING, sendCandidateEmail BOOLEAN, senderName STRING, senderEmail STRING, emailSubject STRING, emailMessage STRING)");
    alasql("CREATE TABLE IF NOT EXISTS applications (id STRING PRIMARY KEY, candidateId STRING NOT NULL, roleId STRING NOT NULL, email STRING NOT NULL, status STRING DEFAULT 'Applied', appliedDate STRING, updatedAt DATETIME)");

    // --- LOAD DATA FROM FILE IF EXISTS ---
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        if (fileContent) {
          const data = JSON.parse(fileContent);
          if (data.employees && data.employees.length > 0) alasql('INSERT INTO employees SELECT * FROM ?', [data.employees]);
          if (data.roles && data.roles.length > 0) alasql('INSERT INTO roles SELECT * FROM ?', [data.roles]);
          if (data.candidates && data.candidates.length > 0) alasql('INSERT INTO candidates SELECT * FROM ?', [data.candidates]);
          if (data.reviews && data.reviews.length > 0) alasql('INSERT INTO reviews SELECT * FROM ?', [data.reviews]);
          if (data.newsletter_subscribers && data.newsletter_subscribers.length > 0) alasql('INSERT INTO newsletter_subscribers SELECT * FROM ?', [data.newsletter_subscribers]);
          if (data.schedule_events && data.schedule_events.length > 0) alasql('INSERT INTO schedule_events SELECT * FROM ?', [data.schedule_events]);
          if (data.applications && data.applications.length > 0) alasql('INSERT INTO applications SELECT * FROM ?', [data.applications]);
        }
      } catch (e) {
        console.error("Failed to load database file:", e);
      }
    }

    // --- SEED INITIAL DATA (Only if tables are empty) ---
    if (process.env.SKIP_SEEDING === 'true') {
      console.log("Skipping database seeding as per SKIP_SEEDING environment variable.");
      return;
    }

    const employees = alasql('SELECT * FROM employees') as any[];
    if (!employees || employees.length === 0) {
      alasql("INSERT INTO employees (name, email, password, position, role, type, status, mobile, address) VALUES ('Recruit Right Solutions Admin', 'admin@recruitrightsolutions.com', 'admin123', 'System Administrator', 'admin', 1, 'Active', '+1 212 900 8800', '1200 Avenue of Americas, NY'), ('Lakshay Mudgal', 'lakshaymudgal340@gmail.com', 'admin123', 'Project Owner', 'admin', 1, 'Active', '+91 9999999999', 'New Delhi, India')");
    }
    const normalizedEmployees = (alasql('SELECT * FROM employees') as any[]).map((employee) => ({
      ...employee,
      status: String(employee.status || '').trim() || 'Active',
      type: employee.type == null
        ? (String(employee.role || 'employee').trim().toLowerCase() === 'admin' ? 1 : 2)
        : Number(employee.type) === 1 ? 1 : 2,
      role: String(employee.role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'employee'
    }));
    alasql('DELETE FROM employees');
    if (normalizedEmployees.length > 0) {
      alasql('INSERT INTO employees SELECT * FROM ?', [normalizedEmployees]);
    }

    const roles = alasql('SELECT * FROM roles') as any[];
    if (!roles || roles.length === 0) {
      alasql("INSERT INTO roles (id, title, client, location, salary, expertise, headcount, status, description) VALUES ('senior-project-architect', 'Senior Project Architect', 'Foster + Partners', 'New York, NY', '$140k - $185k', '[\"Revit\", \"Sustainability\"]', '2/3', 'Open', 'Leading the design and delivery of high-profile commercial projects in Manhattan.'), ('bim-manager', 'BIM Manager', 'Zaha Hadid Architects', 'London, UK', '£85k - £110k', '[\"BIM Level 2\", \"Rhino\"]', '0/1', 'Open', 'Implementing complex BIM workflows for parametric architectural projects.'), ('junior-urban-designer', 'Junior Urban Designer', 'Gensler', 'Berlin, DE', '€45k - €55k', '[\"Vectorworks\"]', '1/1', 'Open', 'Supporting the urban planning team on sustainable city initiatives across Europe.')");
    }

    const candidates = alasql('SELECT * FROM candidates') as any[];
    if (!candidates || candidates.length === 0) {
      const candidatesToInsert = MOCK_CANDIDATES.map(c => ({
        ...c,
        skills: JSON.stringify(c.skills || []),
        appliedDate: c.appliedDate || new Date().toLocaleDateString(),
        matchScore: c.matchScore || Math.floor(Math.random() * 40) + 60
      }));
      alasql("INSERT INTO candidates SELECT * FROM ?", [candidatesToInsert]);
    }

    const reviews = alasql('SELECT * FROM reviews') as any[];
    if (!reviews || reviews.length === 0) {
      alasql("INSERT INTO reviews (author, role, content, rating, date) VALUES ('James Wilson', 'Director at Foster + Partners', 'Nexus Talent has consistently delivered high-caliber architects who understand our design ethos.', 5, '2 days ago'), ('Elena Rossi', 'Senior Associate at Zaha Hadid', 'The level of technical screening provided by Nexus is unparalleled in the industry.', 5, '1 week ago')");
    }

    const scheduleEvents = alasql('SELECT * FROM schedule_events') as any[];
    if (!scheduleEvents || scheduleEvents.length === 0) {
      alasql("INSERT INTO schedule_events SELECT * FROM ?", [MOCK_SCHEDULE_EVENTS]);
    }

    // Save initial state
    saveDb();
  } catch (err) {
    console.error("initDb: CRITICAL ERROR:", err);
    throw err;
  }
}

export function saveDb() {
  try {
    const requiredTables = ['employees', 'roles', 'candidates', 'reviews', 'newsletter_subscribers', 'schedule_events', 'applications'];
    const existingTables = (alasql as any).tables || {};
    const hasLocalTables = requiredTables.every((table) => existingTables[table]);

    if (!hasLocalTables) {
      return;
    }

    const data = {
      employees: alasql('SELECT * FROM employees'),
      roles: alasql('SELECT * FROM roles'),
      candidates: alasql('SELECT * FROM candidates'),
      reviews: alasql('SELECT * FROM reviews'),
      newsletter_subscribers: alasql('SELECT * FROM newsletter_subscribers'),
      schedule_events: alasql('SELECT * FROM schedule_events'),
      applications: alasql('SELECT * FROM applications')
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log("Database saved to file.");
  } catch (err) {
    console.error("Failed to save database:", err);
  }
}
