const AuthService = require('../services/authService');
const AccountModel = require('../models/account');
const CharacterModel = require('../models/character');

const AuthController = {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }
      const result = await AuthService.login(username.trim(), password);
      if (result.error) {
        return res.status(401).json({ error: result.error });
      }

      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
      try {
        await AccountModel.updateLastLogin(result.user.username, ip, 'BR');
      } catch { /* empty */ }

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const { username, password, email } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }
      const result = await AuthService.register(username.trim(), password, email?.trim());
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required.' });
      }
      const result = await AuthService.changePassword(req.user.username, currentPassword, newPassword);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const [account, characters, isOnline, credits, vipInfo] = await Promise.all([
        AccountModel.findByUsername(req.user.username),
        CharacterModel.getCharactersByAccount(req.user.username),
        AccountModel.isOnline(req.user.username),
        AccountModel.getCredits(req.user.username),
        AccountModel.getVipInfo(req.user.username),
      ]);

      let connectionInfo = null;
      try {
        connectionInfo = await AccountModel.getConnectionStatus(req.user.username);
      } catch { /* empty */ }

      res.json({
        username: req.user.username,
        role: req.user.role,
        email: account?.mail_addr?.trim() || '',
        isOnline,
        serverName: connectionInfo?.ServerName?.trim() || '',
        credits: credits.credits || 0,
        credits2: credits.credits2 || 0,
        credits3: credits.credits3 || 0,
        vipType: vipInfo?.viptype || 0,
        vipTime: vipInfo?.viptime || null,
        characters,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
