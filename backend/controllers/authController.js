const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
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

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    const validRoles = ['student', 'industry', 'educator', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Role-specific required fields
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

    const user = await User.create({
      name,
      email,
      password,
      role,
      companyName: role === 'industry' ? companyName : undefined,
      institutionName: role === 'educator' ? institutionName : undefined,
      designation,
      phone,
    });

    // Auto-create a StudentProfile for student role
    if (role === 'student') {
      await StudentProfile.create({ user: user._id });
    }

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

// @desc    Login user
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

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

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

    // Optional: enforce role match if the frontend sends the selected role
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
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    return res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
    });
  }
};

// @desc    Logout (client-side token discard; endpoint provided for consistency)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = { registerUser, loginUser, getMe, logoutUser };
