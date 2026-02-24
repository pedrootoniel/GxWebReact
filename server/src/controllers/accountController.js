const CharacterModel = require('../models/character');

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

      const RESET_LEVEL = 400;
      const RESET_COST = 0;

      const result = await CharacterModel.doReset(
        characterName.trim(),
        req.user.username,
        RESET_LEVEL,
        RESET_COST
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Character reset successfully!', newResets: result.newResets });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AccountController;
