const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AccountModel = require('../models/account');

const SALT_ROUNDS = 10;

const AuthService = {
  async login(username, password) {
    const account = await AccountModel.findByUsername(username);
    if (!account) {
      return { error: 'Invalid username or password.' };
    }

    if (account.bloc_code === 1) {
      return { error: 'Account is blocked. Contact an administrator.' };
    }

    const storedPassword = account.memb__pwd;
    let passwordMatch = false;

    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, storedPassword);
    } else {
      passwordMatch = storedPassword === password;
      if (passwordMatch) {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await AccountModel.updatePassword(username, hashed);
      }
    }

    if (!passwordMatch) {
      return { error: 'Invalid username or password.' };
    }

    const isAdmin = account.ctl1_code === 1 || account.ctl1_code === 8 || account.ctl1_code === 32;
    const token = jwt.sign(
      { username: account.memb___id.trim(), role: isAdmin ? 'admin' : 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        username: account.memb___id.trim(),
        email: account.mail_addr?.trim() || '',
        role: isAdmin ? 'admin' : 'user',
      },
    };
  },

  async register(username, password, email) {
    if (!username || username.length < 4 || username.length > 10) {
      return { error: 'Username must be between 4 and 10 characters.' };
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return { error: 'Username must contain only letters and numbers.' };
    }

    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }

    const existing = await AccountModel.findByUsername(username);
    if (existing) {
      return { error: 'Username already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await AccountModel.create(username, hashedPassword, email || '');

    const token = jwt.sign(
      { username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: { username, email: email || '', role: 'user' },
    };
  },

  async changePassword(username, currentPassword, newPassword) {
    const account = await AccountModel.findByUsername(username);
    if (!account) return { error: 'Account not found.' };

    const storedPassword = account.memb__pwd;
    let passwordMatch = false;

    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      passwordMatch = storedPassword === currentPassword;
    }

    if (!passwordMatch) return { error: 'Current password is incorrect.' };
    if (!newPassword || newPassword.length < 6) return { error: 'New password must be at least 6 characters.' };

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await AccountModel.updatePassword(username, hashed);
    return { success: true };
  },
};

module.exports = AuthService;
