import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import { Resend } from "resend";
import dotenv from "dotenv";
import { dbService } from "./src/services/dbService";
import { initDb } from "./src/db/init";
import { IS_PROD } from "./src/config";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const S3_REGION = process.env.AWS_S3_REGION || "";
const S3_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
const S3_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN || "";
const S3_PUBLIC_BASE_URL = process.env.AWS_S3_PUBLIC_BASE_URL || "";
const S3_SIGNED_URL_TTL_SECONDS = Number(process.env.AWS_S3_SIGNED_URL_TTL_SECONDS || "300");
const S3_RESUME_PREFIX = (process.env.AWS_S3_RESUME_PREFIX || "cv").replace(/^\/+|\/+$/g, "");
const s3Host = S3_REGION ? `s3.${S3_REGION}.amazonaws.com` : "";
const s3BucketHost = S3_BUCKET ? `${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com` : "";
const configuredCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://recruitrighthr.com",
  "https://www.recruitrighthr.com",
  ...configuredCorsOrigins,
]);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: IS_PROD ? multer.memoryStorage() : storage,
});

const createSha256Hex = (value: string | Buffer) =>
  crypto.createHash("sha256").update(value).digest("hex");

const createHmac = (key: string | Buffer, value: string) =>
  crypto.createHmac("sha256", key).update(value).digest();

const encodeRfc3986 = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

const getS3ObjectUrl = (objectKey: string) => {
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  const baseUrl = S3_PUBLIC_BASE_URL || `https://${s3BucketHost}`;
  return `${baseUrl.replace(/\/$/, "")}/${encodedKey}`;
};

const getResumeObjectKey = (fileName: string) =>
  S3_RESUME_PREFIX ? `${S3_RESUME_PREFIX}/${fileName}` : fileName;

const getStoredResumeFileName = (resumeValue: string) => {
  if (!resumeValue) return "";

  const normalizedValue = String(resumeValue).trim();
  if (!normalizedValue) return "";

  const extractedObjectKey = extractS3ObjectKey(normalizedValue);
  const prefixPattern = S3_RESUME_PREFIX ? new RegExp(`^${S3_RESUME_PREFIX}/`) : null;
  const normalizedKey = extractedObjectKey
    .replace(/^uploads\//, "")
    .replace(prefixPattern || /^$/, "");

  return path.posix.basename(normalizedKey);
};

const getCandidateResumeUrl = (resumeFileName: string) => {
  const normalizedFileName = getStoredResumeFileName(resumeFileName);
  if (!normalizedFileName) return "";

  if (!IS_PROD) {
    return `/uploads/${encodeURIComponent(normalizedFileName)}`;
  }

  return getS3ObjectUrl(getResumeObjectKey(normalizedFileName));
};

const extractS3ObjectKey = (fileUrl: string) => {
  if (!fileUrl) return "";

  try {
    const parsedUrl = new URL(fileUrl, "http://localhost");
    const objectPath = parsedUrl.pathname.replace(/^\/+/, "");
    const bucketPrefix = `${S3_BUCKET}/`;
    if (parsedUrl.hostname === s3BucketHost || parsedUrl.hostname === S3_BUCKET) {
      return decodeURIComponent(objectPath);
    }
    return decodeURIComponent(objectPath.startsWith(bucketPrefix) ? objectPath.slice(bucketPrefix.length) : objectPath);
  } catch {
    return decodeURIComponent(String(fileUrl).replace(/^\/+/, ""));
  }
};

const buildS3AuthorizationHeaders = (
  method: "PUT" | "DELETE",
  objectKey: string,
  payloadHash: string,
  contentType?: string,
) => {
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !s3BucketHost) {
    throw new Error("Missing S3 configuration");
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = `/${objectKey.split("/").map(encodeURIComponent).join("/")}`;

  const canonicalHeadersList: Array<[string, string]> = [
    ["host", s3BucketHost],
    ["x-amz-content-sha256", payloadHash],
    ["x-amz-date", amzDate],
  ];

  if (contentType) {
    canonicalHeadersList.push(["content-type", contentType]);
  }

  if (S3_SESSION_TOKEN) {
    canonicalHeadersList.push(["x-amz-security-token", S3_SESSION_TOKEN]);
  }

  canonicalHeadersList.sort(([left], [right]) => left.localeCompare(right));

  const canonicalHeaders = canonicalHeadersList
    .map(([key, value]) => `${key}:${value.trim()}\n`)
    .join("");
  const signedHeaders = canonicalHeadersList.map(([key]) => key).join(";");

  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createSha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = createHmac(
    createHmac(
      createHmac(
        createHmac(`AWS4${S3_SECRET_ACCESS_KEY}`, dateStamp),
        S3_REGION,
      ),
      "s3",
    ),
    "aws4_request",
  );

  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const headers: Record<string, string> = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    Host: s3BucketHost,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (S3_SESSION_TOKEN) {
    headers["x-amz-security-token"] = S3_SESSION_TOKEN;
  }

  return headers;
};

const buildS3PresignedGetUrl = (objectKey: string) => {
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !s3BucketHost) {
    throw new Error("Missing S3 configuration");
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = `/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
  const credentialScope = `${dateStamp}/${S3_REGION}/s3/aws4_request`;

  const queryEntries: Array<[string, string]> = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${S3_ACCESS_KEY_ID}/${credentialScope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(S3_SIGNED_URL_TTL_SECONDS)],
    ["X-Amz-SignedHeaders", "host"],
  ];

  if (S3_SESSION_TOKEN) {
    queryEntries.push(["X-Amz-Security-Token", S3_SESSION_TOKEN]);
  }

  queryEntries.sort(([left], [right]) => left.localeCompare(right));

  const canonicalQueryString = queryEntries
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join("&");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQueryString,
    `host:${s3BucketHost}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createSha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = createHmac(
    createHmac(
      createHmac(
        createHmac(`AWS4${S3_SECRET_ACCESS_KEY}`, dateStamp),
        S3_REGION,
      ),
      "s3",
    ),
    "aws4_request",
  );

  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return `https://${s3BucketHost}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
};

const uploadFileToS3 = async (objectKey: string, fileBuffer: Buffer, contentType: string) => {
  const payloadHash = createSha256Hex(fileBuffer);
  const requestBody = new Uint8Array(fileBuffer);
  const objectPath = objectKey.split("/").map(encodeURIComponent).join("/");
  const uploadUrl = `https://${s3BucketHost}/${objectPath}`;
  console.log("S3 resume upload URL:", uploadUrl);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: buildS3AuthorizationHeaders("PUT", objectKey, payloadHash, contentType),
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 upload failed with status ${response.status}: ${errorText || "No response body"}`);
  }

  return getS3ObjectUrl(objectKey);
};

const deleteFileFromS3 = async (objectKey: string) => {
  if (!objectKey) return;

  const objectPath = objectKey.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`https://${s3BucketHost}/${objectPath}`, {
    method: "DELETE",
    headers: buildS3AuthorizationHeaders("DELETE", objectKey, createSha256Hex("")),
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`S3 delete failed with status ${response.status}: ${errorText || "No response body"}`);
  }
};

// Initialize Resend
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const REQUIRED_SCHEDULE_FIELDS = [
  "title",
  "startTime",
  "endTime",
  "type",
  "location",
  "candidateId",
  "candidateName",
  "roleId",
  "roleTitle",
  "notes",
] as const;

const normalizeScheduleEventPayload = (payload: Record<string, unknown>) => ({
  ...payload,
  title: String(payload.title || "").trim(),
  startTime: String(payload.startTime || "").trim(),
  endTime: String(payload.endTime || "").trim(),
  type: String(payload.type || "").trim(),
  location: String(payload.location || "").trim(),
  candidateId: String(payload.candidateId || "").trim(),
  candidateName: String(payload.candidateName || "").trim(),
  roleId: String(payload.roleId || "").trim(),
  roleTitle: String(payload.roleTitle || "").trim(),
  notes: String(payload.notes || "").trim(),
  status: String(payload.status || "Scheduled").trim() || "Scheduled",
});

const validateScheduleEventPayload = (payload: ReturnType<typeof normalizeScheduleEventPayload>) => {
  for (const field of REQUIRED_SCHEDULE_FIELDS) {
    if (!payload[field]) {
      return `${field} is required`;
    }
  }

  const startDate = new Date(payload.startTime);
  const endDate = new Date(payload.endTime);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Invalid session time";
  }
  if (endDate <= startDate) {
    return "End time must be later than start time";
  }

  return null;
};

const normalizeEmployeePayload = (payload: Record<string, unknown>) => {
  const type = Number(payload.type) === 1 ? 1 : 2;
  const status = String(payload.status || "Active").trim() === "Inactive" ? "Inactive" : "Active";

  return {
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    password: String(payload.password || "").trim(),
    position: String(payload.position || "").trim(),
    mobile: String(payload.mobile || "").trim(),
    address: String(payload.address || "").trim(),
    type,
    status,
    role: type === 1 ? "admin" : "employee",
  };
};

const validateEmployeePayload = (
  payload: ReturnType<typeof normalizeEmployeePayload>,
  options: { isEdit?: boolean } = {}
) => {
  if (!payload.name) return "Employee name is required";
  if (!payload.email) return "Employee email is required";
  if (!options.isEdit && (!payload.password || payload.password.length < 6)) {
    return "Password must be at least 6 characters";
  }
  if (options.isEdit && payload.password && payload.password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

const sanitizeEmployee = (employee: any) => {
  if (!employee) return employee;
  const { password: _, ...employeeWithoutPassword } = employee;
  return employeeWithoutPassword;
};

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use((req, res, next) => {
      const requestOrigin = req.headers.origin;

      if (requestOrigin && allowedCorsOrigins.has(requestOrigin)) {
        res.header("Access-Control-Allow-Origin", requestOrigin);
        res.header("Vary", "Origin");
        res.header("Access-Control-Allow-Credentials", "true");
      }

      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }

      next();
    });

    app.use(express.json());

    // Auth Routes
    app.post("/api/login", async (req, res) => {
      const { email, password } = req.body;
      try {
        const user = await dbService.getEmployeeByEmail(email);

        if (!user) {
          return res.status(401).json({ error: "No user exists with this email address." });
        }

        if (user.password !== password) {
          return res.status(401).json({ error: "Invalid password. Please try again." });
        }

        if (String(user.status || 'Active').trim() === 'Inactive') {
          return res.status(403).json({ error: "This employee account is inactive." });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (err) {
        res.status(500).json({ error: "Internal server error during login" });
      }
    });

    // Health check route
    app.get("/api/health", async (req, res) => {
      let dbStatus = "unknown";
      try {
        const roles = await dbService.getRoles();
        dbStatus = `ok (${roles.length} roles)`;
      } catch (e) {
        dbStatus = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
      res.json({
        status: "ok",
        database: dbStatus,
        time: new Date().toISOString()
      });
    });

    // Initialize Database
    try {
      await initDb();
    } catch (dbErr) {
      console.error("Database initialization failed:", dbErr);
    }

    // API Routes
    app.get("/api/public/stats", async (req, res) => {
      const stats = await dbService.getGlobalStats();
      res.json(stats);
    });

    app.get("/api/public/roles", async (req, res) => {
      const openRoles = await dbService.getRoles({ status: "Open" });
      res.json(openRoles);
    });

    app.get("/api/public/testimonials", async (req, res) => {
      const testimonials = await dbService.getTestimonials();
      res.json(testimonials);
    });

    app.post("/api/public/apply", async (req, res) => {
      try {
        const newCandidate = await dbService.addCandidate(req.body);
        res.status(201).json({
          success: true,
          id: newCandidate.id,
          message: "Application data received. Please upload your resume."
        });
      } catch (error) {
        if (error instanceof Error && (error as any).code === 'DUPLICATE_APPLICATION') {
          return res.status(409).json({
            error: error.message,
            code: 'DUPLICATE_APPLICATION'
          });
        }

        res.status(500).json({ error: "Failed to process application" });
      }
    });

    app.post("/api/public/upload-resume/:id", upload.single("resume"), async (req, res) => {
      try {
        const candidateId = req.params.id;
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const candidate = await dbService.getCandidateById(candidateId);
        if (!candidate) {
          if (!IS_PROD && req.file.path) {
            fs.unlink(req.file.path, () => { });
          }
          return res.status(404).json({ error: "Candidate not found" });
        }

        const emailPrefix = (candidate.email || "candidate").split("@")[0].trim() || "candidate";
        const safeBaseName = emailPrefix.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
        const fileExtension = path.extname(req.file.originalname) || path.extname(req.file.filename);
        const finalFileName = `${safeBaseName}${fileExtension}`;
        const finalObjectKey = getResumeObjectKey(finalFileName);
        let storedResumeFileName = "";

        if (IS_PROD) {
          if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
            return res.status(500).json({ error: "S3 is not configured for production uploads" });
          }

          const existingFileName = getStoredResumeFileName(candidate.resumeUrl || "");
          const existingObjectKey = existingFileName ? getResumeObjectKey(existingFileName) : "";
          const existingBaseName = path.parse(existingFileName).name;
          if (existingObjectKey && existingBaseName === safeBaseName) {
            await deleteFileFromS3(existingObjectKey);
          }

          await uploadFileToS3(
            finalObjectKey,
            req.file.buffer,
            req.file.mimetype || "application/octet-stream",
          );
          storedResumeFileName = finalFileName;
        } else {
          const finalFilePath = path.join(uploadsDir, finalFileName);

          for (const existingFile of fs.readdirSync(uploadsDir)) {
            if (existingFile === req.file.filename) continue;
            const existingBaseName = path.parse(existingFile).name;
            if (existingBaseName === safeBaseName) {
              fs.unlinkSync(path.join(uploadsDir, existingFile));
            }
          }

          if (req.file.path !== finalFilePath) {
            if (fs.existsSync(finalFilePath)) {
              fs.unlinkSync(finalFilePath);
            }
            fs.renameSync(req.file.path, finalFilePath);
          }

          storedResumeFileName = finalFileName;
        }

        const success = await dbService.updateCandidateResume(candidateId, storedResumeFileName);

        if (!success) {
          return res.status(404).json({ error: "Candidate not found" });
        }

      res.json({
        success: true,
        resumeUrl: getCandidateResumeUrl(storedResumeFileName),
        message: "Resume uploaded and linked to candidate profile."
      });
    } catch (error) {
      console.error("Resume upload failed:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload resume" });
    }
  });

    app.get("/api/public/reports/download", async (req, res) => {
      const { name } = req.query;
      if (!name) return res.status(400).json({ error: "Report name is required" });

      // In a real app, this would generate a PDF or CSV
      // For now, we return a simple text file
      const content = `Nexus Talent - ${name}\nGenerated on: ${new Date().toISOString()}\n\nThis is a mock report for ${name}.`;
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${String(name).toLowerCase().replace(/\s+/g, "-")}.txt"`);
      res.send(content);
    });

    // Newsletter Routes
    app.post("/api/public/newsletter/subscribe", async (req, res) => {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const success = await dbService.addSubscriber(email);
      if (!success) {
        return res.status(400).json({ error: "Email already subscribed" });
      }

      res.json({ success: true, message: "Subscribed successfully" });
    });

    app.get("/api/admin/newsletter/subscribers/count", async (req, res) => {
      const count = await dbService.getSubscriberCount();
      res.json({ count });
    });

    app.post("/api/admin/newsletter/send", async (req, res) => {
      const { subject, content } = req.body;
      const subscribers = await dbService.getSubscribers();

      if (!resend) {
        return res.status(500).json({ error: "Resend API key not configured" });
      }

      if (subscribers.length === 0) {
        return res.status(400).json({ error: "No subscribers to send to" });
      }

      try {
        const { data, error } = await resend.emails.send({
          from: "Architectural Curator <onboarding@resend.dev>", // IMPORTANT: Update this to your verified domain e.g. "newsletter@yourdomain.com"
          to: "lakshaymudgal340@gmail.com", // Dummy 'to' address
          bcc: subscribers, // Prevents subscribers from seeing each other's emails
          subject: subject || "Newsletter Update",
          html: content || "<p>Thank you for subscribing to our newsletter!</p>",
        });

        if (error) {
          return res.status(400).json({ error });
        }

        res.json({ success: true, data, message: `Newsletter sent to ${subscribers.length} subscribers` });
      } catch (err) {
        res.status(500).json({ error: "Failed to send newsletter" });
      }
    });

    // Schedule Routes
    app.get("/api/admin/schedule/events", async (req, res) => {
      const events = await dbService.getScheduleEvents();
      res.json(events);
    });

    app.post("/api/admin/schedule/events", async (req, res) => {
      try {
        const eventPayload = normalizeScheduleEventPayload(req.body || {});
        const validationError = validateScheduleEventPayload(eventPayload);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const newEvent = await dbService.addScheduleEvent(eventPayload);
        res.status(201).json(newEvent);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create event" });
      }
    });

    app.patch("/api/admin/schedule/events/:id", async (req, res) => {
      try {
        const eventPayload = normalizeScheduleEventPayload(req.body || {});
        const validationError = validateScheduleEventPayload(eventPayload);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const success = await dbService.updateScheduleEvent(req.params.id, eventPayload);
        if (!success) {
          return res.status(404).json({ error: "Event not found" });
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update event" });
      }
    });

    app.delete("/api/admin/schedule/events/:id", async (req, res) => {
      const success = await dbService.deleteScheduleEvent(req.params.id);
      if (success) res.json({ success: true });
      else res.status(404).json({ error: "Event not found" });
    });

    app.get("/api/admin/reports", async (req, res) => {
      const reports = await dbService.getReports();
      res.json(reports);
    });

    app.get("/api/admin/employees", async (req, res) => {
      const employees = await dbService.getEmployees();
      res.json(employees.map(sanitizeEmployee));
    });

    app.post("/api/admin/employees", async (req, res) => {
      try {
        const employeePayload = normalizeEmployeePayload(req.body || {});
        const validationError = validateEmployeePayload(employeePayload);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const employee = await dbService.addEmployee(employeePayload);
        res.status(201).json(sanitizeEmployee(employee));
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add employee" });
      }
    });

    app.patch("/api/admin/employees/:id", async (req, res) => {
      try {
        const employeePayload = normalizeEmployeePayload(req.body || {});
        const validationError = validateEmployeePayload(employeePayload, { isEdit: true });
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const employee = await dbService.updateEmployee(req.params.id, employeePayload);
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }

        res.json(sanitizeEmployee(employee));
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update employee" });
      }
    });

    app.patch("/api/admin/employees/:id/status", async (req, res) => {
      try {
        const status = String(req.body?.status || '').trim() === 'Inactive' ? 'Inactive' : 'Active';
        const employee = await dbService.updateEmployeeStatus(req.params.id, status);
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }

        res.json(sanitizeEmployee(employee));
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update employee status" });
      }
    });

    app.delete("/api/admin/employees/:id", async (req, res) => {
      const success = await dbService.deleteEmployee(req.params.id);
      if (success) res.json({ success: true });
      else res.status(404).json({ error: "Employee not found" });
    });

    app.get("/api/admin/stats", async (req, res) => {
      const stats = await dbService.getAdminStats();
      res.json(stats);
    });

    // Serve uploaded files
    app.use("/uploads", express.static(uploadsDir));

    app.get("/api/candidates", async (req, res) => {
      const candidates = await dbService.getCandidates();
      res.json(candidates.map((candidate: any) => ({
        ...candidate,
        resumeUrl: getCandidateResumeUrl(candidate.resumeUrl || ""),
      })));
    });

    app.get("/api/candidates/:id", async (req, res) => {
      const candidate = await dbService.getCandidateById(req.params.id);
      if (candidate) {
        res.json({
          ...candidate,
          resumeUrl: getCandidateResumeUrl(candidate.resumeUrl || ""),
        });
      }
      else res.status(404).json({ error: "Candidate not found" });
    });

    app.get("/api/candidates/:id/resume-access", async (req, res) => {
      try {
        const candidate = await dbService.getCandidateById(req.params.id);
        if (!candidate || !candidate.resumeUrl) {
          return res.status(404).json({ error: "Resume not found" });
        }

        const resumeFileName = getStoredResumeFileName(candidate.resumeUrl);
        if (!resumeFileName) {
          return res.status(400).json({ error: "Invalid resume path" });
        }

        if (!IS_PROD) {
          return res.json({ url: getCandidateResumeUrl(resumeFileName), expiresIn: null });
        }

        const objectKey = getResumeObjectKey(resumeFileName);
        if (!objectKey) {
          return res.status(400).json({ error: "Invalid resume path" });
        }

        return res.json({
          url: buildS3PresignedGetUrl(objectKey),
          expiresIn: S3_SIGNED_URL_TTL_SECONDS,
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create signed URL" });
      }
    });

    app.post("/api/candidates", async (req, res) => {
      try {
        const newCandidate = await dbService.addCandidate(req.body);
        res.status(201).json(newCandidate);
      } catch (error) {
        if (error instanceof Error && (error as any).code === 'DUPLICATE_APPLICATION') {
          return res.status(409).json({
            error: error.message,
            code: 'DUPLICATE_APPLICATION'
          });
        }

        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add candidate" });
      }
    });

    app.patch("/api/candidates/:id", async (req, res) => {
      try {
        const success = await dbService.updateCandidate(req.params.id, req.body);
        if (success) res.json({ success: true });
        else res.status(404).json({ error: "Candidate not found" });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update candidate" });
      }
    });

    app.delete("/api/candidates/:id", async (req, res) => {
      const success = await dbService.deleteCandidate(req.params.id);
      if (success) res.json({ success: true });
      else res.status(404).json({ error: "Candidate not found" });
    });

    app.patch("/api/candidates/:id/status", async (req, res) => {
      const { status } = req.body;
      const success = await dbService.updateCandidateStatus(req.params.id, status);
      if (success) res.json({ success: true });
      else res.status(404).json({ error: "Candidate not found" });
    });

    app.get("/api/roles", async (req, res) => {
      const roles = await dbService.getRoles();
      res.json(roles);
    });

    app.post("/api/roles/:roleId/applicants", async (req, res) => {
      try {
        const result = await dbService.applyCandidateToRole(req.body.candidateId, req.params.roleId);
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof Error && (error as any).code === 'DUPLICATE_APPLICATION') {
          return res.status(409).json({
            error: error.message,
            code: 'DUPLICATE_APPLICATION'
          });
        }

        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add candidate to role" });
      }
    });

    app.post("/api/admin/roles", async (req, res) => {
      try {
        const role = await dbService.addRole(req.body);
        res.status(201).json(role);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add role" });
      }
    });

    app.patch("/api/admin/roles/:id", async (req, res) => {
      try {
        const role = await dbService.updateRole(req.params.id, req.body);
        res.json(role);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update role" });
      }
    });

    app.delete("/api/admin/roles/:id", async (req, res) => {
      const success = await dbService.deleteRole(req.params.id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Role not found" });
      }
    });

    app.get("/api/stats", async (req, res) => {
      const stats = await dbService.getGlobalStats();
      res.json(stats);
    });

    app.post("/api/applications", (req, res) => {
      res.status(201).json({ message: "Application submitted successfully" });
    });

    app.get("/api/admin/search", async (req, res) => {
      const query = req.query.q as string;
      if (!query) return res.json({ candidates: [], roles: [] });

      const candidates = await dbService.getCandidates();
      const roles = await dbService.getRoles();

      const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.role.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      const filteredRoles = roles.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.client.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      res.json({ candidates: filteredCandidates, roles: filteredRoles });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error during server startup:", err);
    throw err;
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
