const axios = require('axios')
const { BATTLE_HISTORY_URL } = require('./constants')

async function getData(id, offset) {
    const { data: events } = await axios.get(`${BATTLE_HISTORY_URL}/${id}?limit=50&offset=${offset}`)
    return events
}

exports.getHistory = async (battle) => {
    let battleHistory = []
    let offset = 0
    let events = await getData(battle.id, offset)
    battleHistory = battleHistory.concat(events)
    while (events.length > 49) {
        offset += 50
        battleHistory = battleHistory.concat(events)
        events = await getData(battle.id, offset)
    }
    battleHistory.sort((a, b) => a.TimeStamp - b.TimeStamp)
    return battleHistory
}
// // let chunkSize = Math.round(moment(battle.endTime).diff(moment(battle.startTime), 'seconds')/10)

        // let battleEvents = []

        // // alliances.forEach(a => {
        // //     let series = {
        // //         name: a.name,
        // //         data: []
        // //     }
        // //     let offset = 0
        // //     for (var i = 0; i < 10; i++) {
        // //         let counter = 0
        // //         let start = moment.utc(battle.startTime).add(offset, 'seconds')
        // //         let end = start.clone().add(chunkSize, 'seconds')
        // //         history.forEach(e => {
        // //             if (e.Victim.AllianceName === a.name && moment.utc(e.TimeStamp).isBetween(start,end)) {
        // //                 counter += 1
        // //             }
        // //         })
        // //         series.data.push({
        // //             x: `chunk${i}`,
        // //             y: counter,
        // //         })
        // //         offset += chunkSize
        // //     }
        // //     battleEvents.push(series)
        // // })
