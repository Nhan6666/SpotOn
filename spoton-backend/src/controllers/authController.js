// ============================================================
// AUTH CONTROLLER
// Xử lý: Đăng ký, Đăng nhập, Google OAuth, Refresh Token
// ============================================================
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc   Đăng ký tài khoản mới
// @route  POST /api/v1/auth/register
// @access Public
const register = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Đăng nhập bằng email & password
// @route  POST /api/v1/auth/login
// @access Public
const login = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Đăng nhập / Đăng ký bằng Google OAuth
// @route  POST /api/v1/auth/google
// @access Public
const googleAuth = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Lấy thông tin người dùng đang đăng nhập
// @route  GET /api/v1/auth/me
// @access Private
const getMe = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = { register, login, googleAuth, getMe };
