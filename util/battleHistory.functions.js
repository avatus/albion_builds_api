const axios = require('axios')
const { BATTLE_HISTORY_URL } = require('./constants')

exports.getHistory = async (battle) => {
    const { data: battleHistory } = await axios.get(`${BATTLE_HISTORY_URL}/${battle.id}`, {
        timeout: 120000,
    })
    battleHistory.sort((a, b) => a.TimeStamp - b.TimeStamp)
    return battleHistory
}