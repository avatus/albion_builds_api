const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2');

const battleSchema = Schema({
    id: { type: Number, index: true, unique: true, required: true},
    startTime: { type: Date },
    endTime: { type: Date },
    totalFame: { type: Number },
    totalKills: { type: Number },
    players: {
        players: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    alliances: {
        alliances: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    guilds: {
        guilds: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    highestDamagePlayer: {
        players: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    highestKillsPlayer: {
        players: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    highestHealingPlayer: {
        players: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    highestAssists: {
        players: { type: Array, default: []},
        list: { type: Array, default: []},
    },
    mostExpensiveDeath: {
        player: { type: Schema.Types.Mixed, default: null},
        participants: { type: Array, default: []},
    },
    history: { type: Array, default: [] },
}, { minimize: false })

battleSchema.plugin(mongoosePaginate);

const BattleClass = mongoose.model('Battle', battleSchema)

module.exports = BattleClass