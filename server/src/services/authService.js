const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AccountModel = require('../models/account');

const MD5_MODE = parseInt(process.env.MD5_MODE || '0');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

const AuthService = {
  async login(username, password) {
    const account = await AccountModel.findByUsername(username);
    if (!account) {
      return { error: 'Invalid username or password.' };
    }

    if (account.bloc_code === 1) {
      return { error: 'Account is blocked. Contact an administrator.' };
    }

    const storedPassword = account.memb__pwd?.trim();
    let passwordMatch = false;

    if (MD5_MODE === 0) {
      passwordMatch = storedPassword === password;
    } else if (MD5_MODE === 1) {
      passwordMatch = storedPassword === password;
    } else if (MD5_MODE === 2) {
      passwordMatch = storedPassword === md5(password);
    } else {
      passwordMatch = storedPassword === password;
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

    if (!password || password.length < 4) {
      return { error: 'Password must be at least 4 characters.' };
    }

    const existsUsername = await AccountModel.checkDuplicateUsername(username);
    if (existsUsername) {
      return { error: 'Username already exists.' };
    }

    if (email) {
      const existsEmail = await AccountModel.checkDuplicateEmail(email);
      if (existsEmail) {
        return { error: 'Email already in use.' };
      }
    }

    let storedPassword = password;
    if (MD5_MODE === 2) {
      storedPassword = md5(password);
    }

    await AccountModel.create(username, storedPassword, email || '');

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

    const storedPassword = account.memb__pwd?.trim();
    let passwordMatch = false;

    if (MD5_MODE === 0 || MD5_MODE === 1) {
      passwordMatch = storedPassword === currentPassword;
    } else if (MD5_MODE === 2) {
      passwordMatch = storedPassword === md5(currentPassword);
    } else {
      passwordMatch = storedPassword === currentPassword;
    }

    if (!passwordMatch) return { error: 'Current password is incorrect.' };
    if (!newPassword || newPassword.length < 4) return { error: 'New password must be at least 4 characters.' };

    let newStored = newPassword;
    if (MD5_MODE === 2) {
      newStored = md5(newPassword);
    }

    await AccountModel.updatePassword(username, newStored);
    return { success: true };
  },
};

module.exports = AuthService;
