const express = require('express')
// import * as CONTROLLER from '../controllers/item.controller'
const CONTROLLER = require('../controllers/item.controller')
const router = express.Router()

router.get('/:id', CONTROLLER.getItem)

module.exports = router