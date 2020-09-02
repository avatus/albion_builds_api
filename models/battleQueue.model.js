const mongoose = require('mongoose')
const Schema = mongoose.Schema

const battleQueue = Schema({
    id: { type: String, required: true, unique: true, index: true },
    date_created: { type: Date, default: Date.now },
}, { minimize: false })

const BattleQueue = mongoose.model('BattleQueue', battleQueue)

module.exports = BattleQueue