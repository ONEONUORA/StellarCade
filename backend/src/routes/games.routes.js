const express = require('express');
const { getGames, getRecentGames, playSimpleGame } = require('../controllers/games.controller');
const auth = require('../middleware/auth.middleware');
const idempotency = require('../middleware/idempotency.middleware');

const router = express.Router();

router.get('/', getGames);
router.get('/recent', getRecentGames);
router.post('/play', auth, idempotency, playSimpleGame);

module.exports = router;
