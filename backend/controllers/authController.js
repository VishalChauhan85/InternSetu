const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const StudentProgress = require('../models/StudentProgress');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new PUBLIC user — always creates a `student` account
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    // SECURITY: We intentionally only read `name`, `email`, and `password`
    // from the request body. Any `role`, `companyName`, or `institutionName`
    // sent by the client is IGNORED — public sign-up can never create an
    // admin, educator, or industry account. Those are provisioned only by
    // an authenticated admin via `adminCreateUser` below.
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'student', // hardcoded — see security note above
    });

    // Auto-provision everything a new student needs from day one.
    await StudentProfile.create({ user: user._id });

    await StudentProgress.create({
      user: user._id,
      skill: 'Getting Started',
      proficiency: 0,
      totalPoints: 0,
      activityLog: [
        {
          action: 'account_created',
          description: 'Welcome to InternSetu! Your journey starts here.',
          pointsEarned: 0,
        },
      ],
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @desc    Login user (any role)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact support.',
      });
    }

    // `role` is optional now — the unified Auth.jsx login form no longer
    // asks for it. If a caller does pass it (e.g. a future admin tool),
    // we still enforce the match as a safety net.
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `No ${role} account found with these credentials`,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Logout (client-side token discard; endpoint provided for consistency)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    One-time bootstrap: create the master admin account if none exists
// @route   POST /api/auth/seed-admin
// @access  Secret-protected (NOT a JWT route — no admin exists yet the first
//          time this runs). Requires `x-seed-secret` header matching the
//          ADMIN_SEED_SECRET environment variable set on Render.
const seedAdmin = async (req, res) => {
  try {
    const expectedSecret = process.env.ADMIN_SEED_SECRET;
    const providedSecret = req.headers['x-seed-secret'];

    if (!expectedSecret) {
      // Fail closed: if the secret isn't configured on the server, refuse
      // to seed anything rather than silently allowing an open endpoint.
      return res.status(500).json({
        success: false,
        message: 'ADMIN_SEED_SECRET is not configured on the server',
      });
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing seed secret',
      });
    }

    const ADMIN_EMAIL = 'admin@internsetu.com';
    const ADMIN_PASSWORD = 'SuperSecretPassword123!';

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Admin account already exists. No action taken.',
      });
    }

    const admin = await User.create({
      name: 'InternSetu Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
    });

    return res.status(201).json({
      success: true,
      message:
        'Master admin account created. Log in and change this password immediately — it is a known default.',
      admin: admin.toSafeObject(),
    });
  } catch (error) {
    console.error('seedAdmin error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error seeding admin account' });
  }
};

// @desc    Admin-only: create an Educator or Industry account
// @route   POST /api/auth/admin/create-user
// @access  Private (admin) — protected via `protect` + `authorize('admin')`
const adminCreateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyName,
      institutionName,
      designation,
      phone,
    } = req.body;

    // Admins may only provision these two roles through this endpoint.
    // (Student accounts are self-service via /register; a second admin
    // account should be created directly in the database if ever needed.)
    const allowedRoles = ['educator', 'industry'];

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Admins can only create accounts with role: ${allowedRoles.join(' or ')}`,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    if (role === 'industry' && !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required for industry accounts',
      });
    }
    if (role === 'educator' && !institutionName) {
      return res.status(400).json({
        success: false,
        message: 'Institution name is required for educator accounts',
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      companyName: role === 'industry' ? companyName : undefined,
      institutionName: role === 'educator' ? institutionName : undefined,
      designation,
      phone,
      isVerified: true, // admin-provisioned accounts are pre-trusted
    });

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: newUser.toSafeObject(),
    });
  } catch (error) {
    console.error('adminCreateUser error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error creating user' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  seedAdmin,
  adminCreateUser,
};
