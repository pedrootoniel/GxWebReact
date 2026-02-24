const CharacterModel = require('../models/character');
const AccountModel = require('../models/account');

const AccountController = {
  async getMyCharacters(req, res, next) {
    try {
      const characters = await CharacterModel.getCharactersByAccount(req.user.username);
      res.json({ characters });
    } catch (err) {
      next(err);
    }
  },

  async resetCharacter(req, res, next) {
    try {
      const { characterName } = req.body;
      if (!characterName) {
        return res.status(400).json({ error: 'Character name is required.' });
      }

      const result = await CharacterModel.doReset(characterName.trim(), req.user.username);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Character reset successfully!', newResets: result.newResets });
    } catch (err) {
      next(err);
    }
  },

  async addStats(req, res, next) {
    try {
      const { characterName, str, agi, vit, ene, cmd } = req.body;
      if (!characterName) {
        return res.status(400).json({ error: 'Character name is required.' });
      }

      const isOnline = await AccountModel.isOnline(req.user.username);
      if (isOnline) {
        return res.status(400).json({ error: 'You must be disconnected from the game.' });
      }

      await CharacterModel.addStats(characterName.trim(), req.user.username, str, agi, vit, ene, cmd);
      res.json({ message: 'Stats added successfully!' });
    } catch (err) {
      next(err);
    }
  },

  async clearPk(req, res, next) {
    try {
      const { characterName } = req.body;
      if (!characterName) {
        return res.status(400).json({ error: 'Character name is required.' });
      }

      const isOnline = await AccountModel.isOnline(req.user.username);
      if (isOnline) {
        return res.status(400).json({ error: 'You must be disconnected from the game.' });
      }

      await CharacterModel.clearPk(characterName.trim(), req.user.username);
      res.json({ message: 'PK status cleared successfully!' });
    } catch (err) {
      next(err);
    }
  },

  async unstick(req, res, next) {
    try {
      const { characterName } = req.body;
      if (!characterName) {
        return res.status(400).json({ error: 'Character name is required.' });
      }

      const isOnline = await AccountModel.isOnline(req.user.username);
      if (isOnline) {
        return res.status(400).json({ error: 'You must be disconnected from the game.' });
      }

      await CharacterModel.unstick(characterName.trim(), req.user.username);
      res.json({ message: 'Character unstuck successfully!' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AccountController;
