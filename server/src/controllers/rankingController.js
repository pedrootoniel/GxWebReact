const CharacterModel = require('../models/character');
const GuildModel = require('../models/guild');

const RankingController = {
  async getPlayerRankings(req, res, next) {
    try {
      const { page = 1, limit = 20, className, search, serverCode } = req.query;
      const data = await CharacterModel.getRankings({
        page: parseInt(page),
        limit: Math.min(parseInt(limit) || 20, 100),
        className,
        search,
        serverCode: serverCode ? parseInt(serverCode) : undefined,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async getGuildRankings(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const data = await GuildModel.getRankings({
        page: parseInt(page),
        limit: Math.min(parseInt(limit) || 20, 100),
        search,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async getGuildMembers(req, res, next) {
    try {
      const { guildName } = req.params;
      if (!guildName) return res.status(400).json({ error: 'Guild name is required.' });
      const members = await GuildModel.getGuildMembers(guildName);
      res.json({ members });
    } catch (err) {
      next(err);
    }
  },

  async getTopPlayers(req, res, next) {
    try {
      const { limit = 5 } = req.query;
      const players = await CharacterModel.getTopPlayers(Math.min(parseInt(limit) || 5, 20));
      res.json({ players });
    } catch (err) {
      next(err);
    }
  },

  async getCharacterInfo(req, res, next) {
    try {
      const { name } = req.params;
      if (!name) return res.status(400).json({ error: 'Character name is required.' });
      const character = await CharacterModel.findByName(name);
      if (!character) return res.status(404).json({ error: 'Character not found.' });
      res.json(character);
    } catch (err) {
      next(err);
    }
  },

  async getCastleSiegeOwner(req, res, next) {
    try {
      const owner = await GuildModel.getCastleSiegeOwner();
      res.json({ owner: owner || 'None' });
    } catch (err) {
      next(err);
    }
  },

  async getOnlineCount(req, res, next) {
    try {
      const AccountModel = require('../models/account');
      const count = await AccountModel.getOnlineCount();
      res.json({ online: count });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = RankingController;
