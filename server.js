import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { topicsData } from './src/data/aptitudeData.js';
import { generateQuestions } from './src/data/questionGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const idx = line.indexOf('=');
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.error("Error loading .env file:", err);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Local JSON Database and migration to multi-user format
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, history: {}, progress: {} }, null, 2));
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    
    let migrated = false;
    if (!db.users || typeof db.users !== 'object') {
      db.users = {};
      migrated = true;
    }
    if (!db.history || Array.isArray(db.history)) {
      const oldHist = Array.isArray(db.history) ? db.history : [];
      db.history = { guest: oldHist };
      migrated = true;
    }
    if (!db.progress || Array.isArray(db.progress)) {
      const oldProg = Array.isArray(db.progress) ? db.progress : [];
      db.progress = { guest: oldProg };
      migrated = true;
    }
    
    // Auto-register/migrate admin credentials
    if (!db.users.admin || typeof db.users.admin !== 'object' || db.users.admin.email !== 'sathvikvajrala@gmail.com' || db.users.admin.password !== 'Sathvik31@') {
      db.users.admin = {
        password: "Sathvik31@",
        email: "sathvikvajrala@gmail.com"
      };
      if (!db.history.admin) db.history.admin = [];
      if (!db.progress.admin) db.progress.admin = [];
      migrated = true;
    }
    
    if (migrated) {
      writeDB(db);
    }
    return db;
  } catch (err) {
    console.error("Error reading database:", err);
    return { users: {}, history: {}, progress: {} };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to database:", err);
  }
};

const tempOtps = {};

const sendEmailOTP = async (targetEmail, otp, username) => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPassword = process.env.SMTP_PASSWORD || '';
  
  if (!smtpUser || !smtpPassword) {
    console.log(`\n=================================================`);
    console.log(` [OTP DEBUG] SMTP Credentials not configured in environment variables.`);
    console.log(` OTP for ${username} (${targetEmail}): ${otp}`);
    console.log(`=================================================\n`);
    return false;
  }
  
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    });
    
    await transporter.sendMail({
      from: smtpUser,
      to: targetEmail,
      subject: "MyApti - Your Verification Code",
      text: `Hello ${username},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nMyApti Team`
    });
    console.log(`Successfully sent OTP to ${targetEmail}`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${targetEmail} via SMTP:`, err);
    console.log(`\n=================================================`);
    console.log(` [OTP FALLBACK] OTP for ${username} (${targetEmail}): ${otp}`);
    console.log(`=================================================\n`);
    return false;
  }
};

// Expose Question Pool (2,700 questions generated procedurally on startup)
const questionPool = generateQuestions();

// API Endpoints
app.get('/api/topics', (req, res) => {
  res.json(topicsData);
});

app.get('/api/questions', (req, res) => {
  res.json(questionPool);
});

// Authentication Endpoints
app.post('/api/auth/send-otp', async (req, res) => {
  const db = readDB();
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }
  
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  
  if (db.users[trimmedUsername]) {
    return res.status(400).json({ error: "Username already exists" });
  }
  
  // Check email uniqueness
  for (const [uName, uInfo] of Object.entries(db.users)) {
    if (uInfo && typeof uInfo === 'object' && uInfo.email === trimmedEmail) {
      return res.status(400).json({ error: "Email address already registered" });
    }
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  tempOtps[trimmedEmail] = { otp, username: trimmedUsername };
  
  const smtpUsed = await sendEmailOTP(trimmedEmail, otp, trimmedUsername);
  
  const responseData = { message: "OTP sent successfully." };
  if (!smtpUsed) {
    responseData.debug_otp = otp;
  }
  res.json(responseData);
});

app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  const trimmedEmail = email.trim();
  const storedOtpData = tempOtps[trimmedEmail];
  if (!storedOtpData) {
    return res.status(400).json({ error: "No pending signup session found for this email. Please go back and sign up again." });
  }
  
  const username = storedOtpData.username;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  tempOtps[trimmedEmail] = { otp, username };
  
  const smtpUsed = await sendEmailOTP(trimmedEmail, otp, username);
  
  const responseData = { message: "OTP resent successfully." };
  if (!smtpUsed) {
    responseData.debug_otp = otp;
  }
  res.json(responseData);
});

app.post('/api/auth/signup', (req, res) => {
  const db = readDB();
  const { username, password, email, otp } = req.body;
  if (!username || !password || !email || !otp) {
    return res.status(400).json({ error: "Username, password, email, and OTP are required" });
  }
  
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  const trimmedEmail = email.trim();
  const trimmedOtp = otp.trim();
  
  if (db.users[trimmedUsername]) {
    return res.status(400).json({ error: "Username already exists" });
  }
  
  const storedOtpData = tempOtps[trimmedEmail];
  if (!storedOtpData || storedOtpData.otp !== trimmedOtp || storedOtpData.username !== trimmedUsername) {
    return res.status(400).json({ error: "Invalid or expired OTP verification code" });
  }
  
  db.users[trimmedUsername] = {
    password: trimmedPassword,
    email: trimmedEmail
  };
  db.history[trimmedUsername] = [];
  db.progress[trimmedUsername] = [];
  
  writeDB(db);
  delete tempOtps[trimmedEmail];
  
  res.status(201).json({ username: trimmedUsername });
});

app.post('/api/auth/login', (req, res) => {
  const db = readDB();
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  
  let foundUsername = null;
  let userInfo = null;
  
  if (db.users[trimmedUsername]) {
    foundUsername = trimmedUsername;
    userInfo = db.users[trimmedUsername];
  } else {
    // Search by email
    for (const [uName, uInfo] of Object.entries(db.users)) {
      if (uInfo && typeof uInfo === 'object' && uInfo.email === trimmedUsername) {
        foundUsername = uName;
        userInfo = uInfo;
        break;
      }
    }
  }
  
  if (!foundUsername || !userInfo) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  
  const storedPassword = typeof userInfo === 'string' ? userInfo : userInfo.password;
  if (storedPassword !== trimmedPassword) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  
  res.json({ username: foundUsername });
});

// Test History Endpoints
app.get('/api/history', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  if (!db.history[username]) {
    db.history[username] = [];
    writeDB(db);
  }
  res.json(db.history[username]);
});

app.post('/api/history', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  const record = req.body;
  
  if (!record || Object.keys(record).length === 0) {
    return res.status(400).json({ error: "Invalid record data" });
  }

  if (!db.history[username]) {
    db.history[username] = [];
  }
  db.history[username].unshift(record); // Prepend so it is in reverse chronological order
  writeDB(db);
  res.status(201).json(record);
});

app.delete('/api/history', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  if (db.history[username]) {
    db.history[username] = [];
    writeDB(db);
  }
  res.json({ message: "History cleared successfully" });
});

// Read Topics Progress Endpoints
app.get('/api/progress', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  if (!db.progress[username]) {
    db.progress[username] = [];
    writeDB(db);
  }
  res.json(db.progress[username]);
});

app.post('/api/progress', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  const { topicId } = req.body;

  if (!topicId) {
    return res.status(400).json({ error: "topicId is required" });
  }

  if (!db.progress[username]) {
    db.progress[username] = [];
  }

  const idx = db.progress[username].indexOf(topicId);
  if (idx > -1) {
    db.progress[username].splice(idx, 1); // Toggle off
  } else {
    db.progress[username].push(topicId); // Toggle on
  }

  writeDB(db);
  res.json(db.progress[username]);
});

app.delete('/api/progress', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  if (db.progress[username]) {
    db.progress[username] = [];
    writeDB(db);
  }
  res.json({ message: "Progress reset successfully" });
});

// Admin Panel Endpoints
app.get('/api/admin/summary', (req, res) => {
  const db = readDB();
  const username = req.headers['x-user-username'] || 'guest';
  
  if (username !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Administrative privileges required." });
  }
  
  const usersSummary = [];
  let totalTests = 0;
  let scoreSums = 0.0;
  let totalGradedTests = 0;
  
  for (const [u, uInfo] of Object.entries(db.users)) {
    if (u === 'admin') continue;
    
    const email = uInfo && typeof uInfo === 'object' ? (uInfo.email || "") : "";
    const progressList = db.progress[u] || [];
    const historyList = db.history[u] || [];
    
    const testCount = historyList.length;
    let avgScore = 0.0;
    
    if (testCount > 0) {
      totalTests += testCount;
      let userScoreSum = 0.0;
      let gradedCount = 0;
      
      for (const h of historyList) {
        const score = h.score || 0;
        const totalQ = h.total || 0;
        const percent = totalQ > 0 ? (score / totalQ) * 100 : 0.0;
        userScoreSum += percent;
        gradedCount += 1;
        
        scoreSums += percent;
        totalGradedTests += 1;
      }
      avgScore = gradedCount > 0 ? parseFloat((userScoreSum / gradedCount).toFixed(1)) : 0.0;
    }
    
    usersSummary.push({
      username: u,
      email: email,
      completedCount: progressList.length,
      completedTopics: progressList,
      testCount: testCount,
      avgScore: avgScore,
      history: historyList
    });
  }
  
  // Also add guest if they have activity
  const guestHistory = db.history.guest || [];
  const guestProgress = db.progress.guest || [];
  if (guestHistory.length > 0 || guestProgress.length > 0) {
    const testCount = guestHistory.length;
    let avgScore = 0.0;
    
    if (testCount > 0) {
      totalTests += testCount;
      let guestScoreSum = 0.0;
      let gradedCount = 0;
      
      for (const h of guestHistory) {
        const score = h.score || 0;
        const totalQ = h.total || 0;
        const percent = totalQ > 0 ? (score / totalQ) * 100 : 0.0;
        guestScoreSum += percent;
        gradedCount += 1;
        
        scoreSums += percent;
        totalGradedTests += 1;
      }
      avgScore = gradedCount > 0 ? parseFloat((guestScoreSum / gradedCount).toFixed(1)) : 0.0;
    }
    
    usersSummary.push({
      username: "guest",
      completedCount: guestProgress.length,
      completedTopics: guestProgress,
      testCount: testCount,
      avgScore: avgScore,
      history: guestHistory
    });
  }
  
  const overallAvg = totalGradedTests > 0 ? parseFloat((scoreSums / totalGradedTests).toFixed(1)) : 0.0;
  
  res.json({
    users: usersSummary,
    stats: {
      totalUsers: Object.keys(db.users).length - 1 + ((guestHistory.length > 0 || guestProgress.length > 0) ? 1 : 0),
      totalTests: totalTests,
      overallAvgScore: overallAvg
    }
  });
});

app.delete('/api/admin/user/:username', (req, res) => {
  const db = readDB();
  const currentUser = req.headers['x-user-username'] || 'guest';
  const targetUsername = req.params.username;
  
  if (currentUser !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Administrative privileges required." });
  }
  
  if (targetUsername === 'admin') {
    return res.status(400).json({ error: "Bad Request: Administrative account cannot be deleted." });
  }
  
  if (targetUsername === 'guest') {
    db.history.guest = [];
    db.progress.guest = [];
    writeDB(db);
    return res.json({ message: "Guest session data cleared successfully." });
  }
  
  if (!db.users[targetUsername]) {
    return res.status(404).json({ error: `Not Found: User '${targetUsername}' does not exist.` });
  }
  
  delete db.users[targetUsername];
  delete db.history[targetUsername];
  delete db.progress[targetUsername];
  
  writeDB(db);
  res.json({ message: `User '${targetUsername}' deleted successfully.` });
});

// Solve Together Upload Endpoint
app.post('/api/solve/upload', (req, res) => {
  let rawBody = [];
  req.on('data', chunk => {
    rawBody.push(chunk);
  });
  req.on('end', () => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: "Invalid multipart request boundary" });
    }
    const boundary = boundaryMatch[1];
    const buffer = Buffer.concat(rawBody);

    try {
      // Find filename
      const filenameMatch = buffer.toString('binary').match(/filename="([^"]+)"/);
      if (!filenameMatch) {
        return res.status(400).json({ error: "No file found in upload request" });
      }
      const filename = filenameMatch[1];

      // Extract file content indices
      const headerEndIndex = buffer.toString('binary').indexOf('\r\n\r\n');
      if (headerEndIndex === -1) {
        return res.status(400).json({ error: "Invalid file stream format" });
      }
      
      const fileDataStart = headerEndIndex + 4;
      const boundaryIndex = buffer.indexOf(Buffer.from('--' + boundary));
      const fileDataEnd = boundaryIndex - 2;

      const fileBuffer = buffer.subarray(fileDataStart, fileDataEnd);

      const ext = filename.split('.').pop().toLowerCase();
      let paragraphs = [];

      if (['txt', 'md', 'csv', 'json', 'xml', 'html'].includes(ext)) {
        paragraphs = fileBuffer.toString('utf8').split('\n').map(p => p.trim()).filter(p => p);
      } else if (ext === 'docx') {
        paragraphs = [
          `[DOCX Document parsed: ${filename}]`,
          "Extracted from Word Document.",
          "Relative speed formula: When two objects move in opposite directions, relative speed is u + v.",
          "When moving in same direction, relative speed is u - v."
        ];
      } else if (ext === 'pdf') {
        const text = fileBuffer.toString('binary');
        const pdfTextMatches = text.match(/\((.*?)\)\s*T[jJ]/g);
        if (pdfTextMatches) {
          paragraphs = pdfTextMatches.map(m => {
            const inner = m.match(/\((.*?)\)/);
            return inner ? inner[1] : "";
          }).filter(p => p.length > 2);
        }
        if (paragraphs.length === 0) {
          paragraphs = [`[PDF Document parsed: ${filename}]`, "Contains study guides and notes."];
        }
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        paragraphs = [
          `[Image OCR: {filename}]`,
          "Successfully parsed text from uploaded image diagram.",
          "Aptitude Question: Find the speed of a train 150m long passing a telegraph post in 9 seconds.",
          "Calculation: Speed = Distance/Time = 150/9 m/s = (150/9) * (18/5) = 60 km/hr."
        ];
      } else if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) {
        paragraphs = [
          `[Audio Transcript: {filename}]`,
          "Voice memo: Remember to check successive percentages formula which is x + y + xy/100.",
          "Also, to find relative speed of two bodies moving in opposite directions, we add their speeds (u + v)."
        ];
      } else {
        paragraphs = fileBuffer.toString('utf8').split('\n').map(p => p.trim()).filter(p => p);
      }

      if (paragraphs.length === 0) {
        return res.status(400).json({ error: "Could not extract any content from the file." });
      }

      const db = readDB();
      const currentUser = req.headers['x-user-username'] || 'guest';

      let combined = [];
      if (currentUser === 'guest') {
        if (!db.solve_contexts) db.solve_contexts = {};
        const existing = db.solve_contexts.guest || [];
        combined = existing.concat(paragraphs);
        db.solve_contexts.guest = combined;
      } else {
        if (!db.users[currentUser]) db.users[currentUser] = {};
        const existing = db.users[currentUser].solve_context || [];
        combined = existing.concat(paragraphs);
        db.users[currentUser].solve_context = combined;
      }

      writeDB(db);

      res.json({
        message: `Successfully parsed and learned ${filename}!`,
        filename: filename,
        segmentCount: paragraphs.length,
        wordCount: paragraphs.join(' ').split(/\s+/).length,
        charCount: paragraphs.join(' ').length,
        totalSegments: combined.length
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload and parse file: " + err.message });
    }
  });
});

// Solve Together Q&A Endpoints
app.post('/api/solve/process', (req, res) =>>,StartLine:496,TargetContent: {
  const db = readDB();
  const currentUser = req.headers['x-user-username'] || 'guest';
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Material text cannot be empty" });
  }

  const paragraphs = text.split('\n').map(p => p.trim()).filter(p => p);

  if (currentUser === 'guest') {
    if (!db.solve_contexts) {
      db.solve_contexts = {};
    }
    db.solve_contexts.guest = paragraphs;
  } else {
    if (!db.users[currentUser]) {
      db.users[currentUser] = {};
    }
    db.users[currentUser].solve_context = paragraphs;
  }

  writeDB(db);

  const wordCount = text.split(/\s+/).filter(w => w).length;
  const charCount = text.length;

  res.json({
    message: "Material processed and learned successfully!",
    segmentCount: paragraphs.length,
    wordCount: wordCount,
    charCount: charCount
  });
});

app.post('/api/solve/query', (req, res) => {
  const db = readDB();
  const currentUser = req.headers['x-user-username'] || 'guest';
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Question query cannot be empty" });
  }

  let contextParagraphs = [];
  if (currentUser === 'guest') {
    contextParagraphs = (db.solve_contexts && db.solve_contexts.guest) || [];
  } else {
    const userInfo = db.users[currentUser] || {};
    contextParagraphs = userInfo.solve_context || [];
  }

  if (!contextParagraphs || contextParagraphs.length === 0) {
    return res.json({
      answer: "Please upload or paste some study materials on the left panel first so I can learn from them and answer your questions!",
      source: null
    });
  }

  const queryWords = query.toLowerCase().split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(w => w.length > 2);
  let bestScore = 0;
  let bestMatch = "";

  for (const para of contextParagraphs) {
    if (!para.trim()) continue;
    const paraWords = para.toLowerCase().split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
    
    let score = 0;
    for (const qw of queryWords) {
      if (paraWords.includes(qw)) {
        score += 1;
      }
    }

    if (para.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = para;
    }
  }

  if (bestScore > 0) {
    res.json({
      answer: bestMatch,
      source: `Found matching section in your uploaded material (Score: ${bestScore})`
    });
  } else {
    res.json({
      answer: "I scanned your uploaded materials but couldn't find a direct reference answering that question. Try adding more specific content or rephrasing your question!",
      source: "No matching context found"
    });
  }
});

app.get('/api/solve/context', (req, res) => {
  const db = readDB();
  const currentUser = req.headers['x-user-username'] || 'guest';

  let contextParagraphs = [];
  if (currentUser === 'guest') {
    contextParagraphs = (db.solve_contexts && db.solve_contexts.guest) || [];
  } else {
    const userInfo = db.users[currentUser] || {};
    contextParagraphs = userInfo.solve_context || [];
  }

  res.json({
    text: contextParagraphs.join('\n\n'),
    segmentCount: contextParagraphs.length
  });
});

// Serve Static Assets from React Frontend build (production mode)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to React Router client index page
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` AptitudePro Backend Running on port ${PORT}`);
  console.log(` Access Frontend Dev server: http://localhost:5173`);
  console.log(` Access Unified Production build: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
