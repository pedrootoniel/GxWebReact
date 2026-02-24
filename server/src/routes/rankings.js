const { Router } = require('express');
const RankingController = require('../controllers/rankingController');

const router = Router();

router.get('/players', RankingController.getPlayerRankings);
router.get('/guilds', RankingController.getGuildRankings);
router.get('/guilds/:guildName/members', RankingController.getGuildMembers);
router.get('/top', RankingController.getTopPlayers);
router.get('/character/:name', RankingController.getCharacterInfo);
router.get('/castle-siege', RankingController.getCastleSiegeOwner);
router.get('/online', RankingController.getOnlineCount);
router.get('/stats', RankingController.getStats);

module.exports = router;
