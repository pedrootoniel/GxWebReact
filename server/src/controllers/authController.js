const AuthService = require('../services/authService');

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
      const AccountModel = require('../models/account');
      const CharacterModel = require('../models/character');

      const [info, characters, isOnline] = await Promise.all([
        AccountModel.getAccountInfo(req.user.username),
        CharacterModel.getCharactersByAccount(req.user.username),
        AccountModel.isOnline(req.user.username),
      ]);

      res.json({
        username: req.user.username,
        role: req.user.role,
        email: info?.email?.trim() || '',
        isOnline,
        serverName: info?.ServerName?.trim() || '',
        characters,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
