const Battle = require('../models/battle.model')
const BattleQueue = require('../models/battleQueue.model')
const axios = require('axios')
const schedule = require('node-schedule');
const moment = require('moment')
const { formatAlliances } = require('../util/alliance.functions')
const { formatGuilds } = require('../util/guild.functions')
const {
    formatPlayers,
    getHighestDamagePlayer,
    getHighestHealingPlayer,
    getHighestKillsPlayer,
    getHighestAssists,
    getMostExpensiveDeath,
} = require('../util/player.functions')
const { getHistory } = require('../util/battleHistory.functions')

const BATTLES_ENDPOINT = "https://gameinfo.albiononline.com/api/gameinfo/battles";
const BATTLES_LIMIT = 50;
const BATTLES_SORT = "recent";

const {
    BATTLE_ROOT_URL,
} = require('../util/constants')

exports.getBattles = async (req, res) => {
    const query = req.query
    let queryOptions = {}

    if (query && query.largeOnly === "true") {
        queryOptions.totalKills = {$gte: 20}
        queryOptions.totalFame = {$gte: 1000000}
    }

    if (query && query.search !== '') {
        queryOptions['$or'] = [
            { 'alliances.list': { '$regex' : query.search, $options: '-i' } },
            { 'guilds.list': { '$regex' : query.search, $options: '-i' } },
            { 'players.list': { '$regex' : query.search, $options: '-i' } },
        ]

        if (!Number.isNaN(parseInt(query.search))) {
            queryOptions['$or'].push(
                { 'id':  parseInt(query.search)}
            )
        }
    }

    try {
        let battles = await Battle.paginate(queryOptions,{
            select: 'id startTime endTime totalKills alliances.list totalFame players.list',
            sort: {startTime: 'desc'},
            limit: 20,
            offset: parseInt(query.offset)
        })

        return res.status(200).json(battles)

    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: err.message })
    }
}

const saveBattle = async (bid) => {
    try {
        const battleId = await Battle.findOne({id: bid})
        if (battleId == null) {
            console.log(`${moment.utc()}: Gathering ${bid}`)
            let { data: battle } = await axios.get(`${BATTLE_ROOT_URL}/${bid}`)
            const history = await getHistory(battle)
            const players = formatPlayers(battle, history)
            const alliances = formatAlliances(battle, history, players)
            const guilds = formatGuilds(battle, history, players)


            const highestDamagePlayer = getHighestDamagePlayer(players)
            const highestHealingPlayer = getHighestHealingPlayer(players)
            const highestAssists = getHighestAssists(players)
            const highestKillsPlayer = getHighestKillsPlayer(players)
            const mostExpensiveDeath = getMostExpensiveDeath(history)

            battle.players = players
            battle.alliances = alliances
            battle.guilds = guilds
            battle.highestDamagePlayer = highestDamagePlayer
            battle.highestKillsPlayer = highestKillsPlayer
            battle.highestHealingPlayer = highestHealingPlayer
            battle.highestAssists = highestAssists
            battle.mostExpensiveDeath = mostExpensiveDeath
            battle.date_created = Date.now()

            let newBattle = new Battle(battle)

            newBattle.save((err) => {
                if (err) {
                    console.log(`${moment.utc()}: Failed ${battle.id}`)
                }
                else {
                    console.log(`${moment.utc()}: Saved ${battle.id}`)
                    BattleQueue.findOneAndRemove({id: battle.id}).then(() => {
                        console.log(`Removed ${battle.id} from queue.`)
                    })
                }
            })
            return newBattle
        }
        else {
            return false
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.getBattle = async (req, res) => {
    try {
        const battleID = req.params.id
        const battleDB = await Battle.findOne({ id: battleID }).select('-history')
        if (battleDB !== null) {
            return res.status(200).json(battleDB)
        }
        else {
            const battle = await saveBattle(req.params.id)
            return res.status(200).json(battle)
        }

    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

if (process.env.NODE_ENV !== 'dev') {
    schedule.scheduleJob('* * * * *', async function () {
        let queued = await BattleQueue.find().sort('date_created')
        ; await (async function() {
            for (var i = 0; i < queued.length; i++) {
                const battle = queued[i]
                let savedBattle = await Battle.findOne({id: battle.id}).select('id')
                if (!savedBattle) {
                    await saveBattle(battle.id)
                }
                else {
                    BattleQueue.findOneAndRemove({id: battle.id}).then(() => {
                        console.log(`Removed ${battle.id} from queue.`)
                    })
                }
            }
        })()
    })

    schedule.scheduleJob('*/2 * * * *', async function () {
        try {
            const { data } = await axios.get(BATTLES_ENDPOINT, {
                params: {
                    offset: 0,
                    limit: BATTLES_LIMIT,
                    sort: BATTLES_SORT,
                    timestamp: moment().unix(),
                },
                timeout: 120000,
            });
            data.forEach(async b => {
                let battle = await Battle.findOne({id: b.id})
                if (!battle) {
                    BattleQueue.findOne({id: b.id})
                    .then(queued => {
                        if (!queued) {
                            let newQueue = new BattleQueue({id: b.id})
                            newQueue.save((err) => {
                                if (err) {
                                    console.log(`Failed to queue: ${b.id}`)
                                }
                                else {
                                    console.log(`Queued: ${b.id}`)
                                }
                            })
                        }
                    })
                    .catch(err => {
                        console.log(err.message)
                    })
                }
            })
        } catch (err) {
            console.log(err.message)
        }
    });

    schedule.scheduleJob('*/20 * * * *', async function () {
        const mydate = moment().subtract(7, 'days')
        try {
            await Battle.deleteMany().where('date_created').lte(mydate)
        } catch (err) {
            console.log(err.message)
        }
    });
}