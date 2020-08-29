const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/items', require('./routes/item.routes'))
app.use('/battles', require('./routes/battle.routes'))

module.exports = app