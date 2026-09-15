require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const industryRoutes = require('./routes/industryRoutes');
const educatorRoutes = require('./routes/educatorRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ---------- CORS ----------
// CLIENT_URL supports a comma-separated list so you can allow both your
// production Vercel URL and localhost during development, e.g.:
//   CLIENT_URL=https://internsetu.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools with no Origin header (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Always allow Vercel preview deployments (e.g. project-git-branch.vercel.app)
      // so PR previews work without manually updating CLIENT_URL every time.
      try {
        if (/\.vercel\.app$/i.test(new URL(origin).hostname)) {
          return callback(null, true);
        }
      } catch {
        // Malformed origin header — fall through to rejection below.
      }

      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ---------- Health Check ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'InternSetu API is running',
    timestamp: new Date().toISOString(),
  });
});

// ---------- Mount Routes (ALL prefixed with /api) ----------
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/ai', aiRoutes);

// ---------- 404 Handler ----------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ---------- Global Error Handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);

  // CORS rejections thrown from the origin callback above land here too
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Not allowed by CORS' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 InternSetu API server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
  );
});

module.exports = app;
