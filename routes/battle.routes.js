const express = require('express')
const CONTROLLER = require('../controllers/battle.controller')
const router = express.Router()

router.get('/:id', CONTROLLER.getBattle)
router.get('/', CONTROLLER.getBattles)
router.get('/multilog/:ids', CONTROLLER.getMultiLog)

module.exports = router