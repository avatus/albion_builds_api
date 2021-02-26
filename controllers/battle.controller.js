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
                    console.log(`Failed ${battle.id}`)
                }
                else {
                    console.log(`Saved ${battle.id}`)
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

exports.getMultiLog = async (req, res) => {
    try {
        const ids = req.params.ids.split(',')
        let main = null
        let battles = []
        ;await (async function() {
            for (var i = 0; i < ids.length; i++) {
                const battleID = ids[i].trim()
                const battle = await Battle.findOne({ id: battleID }).select('-history')
                if (battle !== null) {
                    if (i === 0) {
                        main = battle
                    }
                    else {
                        battles.push(battle)
                    }
                }
            }
        })()

        if (main === null) {
            return res.status(400).json({message: 'invalid battle IDs'})
        }

        if (battles.length < 1) {
            return res.status(200).json(main)
        }


        let combinedalliances = {}
        let combinedguilds = {}
        let combinedplayers = {}

        main.alliances.alliances.forEach(a => {
            combinedalliances[a.id] = a
            combinedalliances[a.id].count = 1
            combinedalliances[a.id].totalPlayers = 0
        })

        main.guilds.guilds.forEach(g => {
            combinedguilds[g.id] = g
            combinedguilds[g.id].count = 1
            combinedguilds[g.id].totalPlayers = 0
        })

        main.players.players.forEach(p => {
            combinedplayers[p.id] = p
            combinedplayers[p.id].count = 1
        })

        battles.forEach(b => {
            main.totalKills += b.totalKills
            main.totalFame += b.totalFame
            b.alliances.alliances.forEach(a => {
                if (combinedalliances[a.id]) {
                    combinedalliances[a.id].count += 1
                    combinedalliances[a.id].kills += a.kills
                    combinedalliances[a.id].deaths += a.deaths
                    combinedalliances[a.id].killFame += a.killFame
                    combinedalliances[a.id].totalDamage += a.totalDamage
                    combinedalliances[a.id].totalHealing += a.totalHealing
                    combinedalliances[a.id].averageIp += a.averageIp
                }
                else {
                    combinedalliances[a.id] = a
                    combinedalliances[a.id].count = 1
                    combinedalliances[a.id].totalPlayers = 0
                }
            })

            b.guilds.guilds.forEach(g => {
                console.log(g)
                if (combinedguilds[g.id]) {
                    combinedguilds[g.id].count += 1
                    combinedguilds[g.id].kills += g.kills
                    combinedguilds[g.id].deaths += g.deaths
                    combinedguilds[g.id].killFame += g.killFame
                    combinedguilds[g.id].averageIp += g.averageIp
                }
                else {
                    combinedguilds[g.id] = g
                    combinedguilds[g.id].count = 1
                    combinedguilds[g.id].totalPlayers = 0
                }
            })
            b.players.players.forEach(p => {
                if (combinedplayers[p.id]) {
                    combinedplayers[p.id].count += 1
                    combinedplayers[p.id].kills += p.kills
                    combinedplayers[p.id].deaths += p.deaths
                    combinedplayers[p.id].killFame += p.killFame
                    combinedplayers[p.id].totalDamage += p.totalDamage
                    combinedplayers[p.id].totalHealing += p.totalHealing
                    combinedplayers[p.id].totalKillContribution += p.totalKillContribution
                    combinedplayers[p.id].ip += p.ip
                }
                else {
                    combinedplayers[p.id] = p
                }
            })

            if (b.highestDamagePlayer.players[0].totalDamage > main.highestDamagePlayer.players[0].totalDamage) {
                main.highestDamagePlayer = b.highestDamagePlayer
            }

            if (b.highestAssists.players[0].totalKillContribution > main.highestAssists.players[0].totalKillContribution) {
                main.highestAssists = b.highestAssists
            }

            if (b.highestHealingPlayer.players[0].totalHealing > main.highestHealingPlayer.players[0].totalHealing) {
                main.highestHealingPlayer = b.highestHealingPlayer
            }

            if (b.highestKillsPlayer.players[0].kills > main.highestKillsPlayer.players[0].kills) {
                main.highestKillsPlayer = b.highestKillsPlayer
            }

            if (b.mostExpensiveDeath.player.DeathFame > main.mostExpensiveDeath.player.DeathFame) {
                main.mostExpensiveDeath = b.mostExpensiveDeath
            }

        })

        main.alliances.alliances = []
        main.guilds.guilds = []
        main.players.players = []

        Object.keys(combinedplayers).forEach(pid => {
            combinedplayers[pid].ip = Math.round(combinedplayers[pid].ip/combinedplayers[pid].count)
            main.players.players.push(combinedplayers[pid])
        })

        main.players.players.forEach(p => {
            if (combinedalliances[p.allianceId]) {
                combinedalliances[p.allianceId].totalPlayers += 1
            }
            if (combinedguilds[p.guildId]) {
                combinedguilds[p.guildId].totalPlayers += 1
            }
        })

        Object.keys(combinedalliances).forEach(aid => {
            combinedalliances[aid].averageIp = Math.round(combinedalliances[aid].averageIp/combinedalliances[aid].count)
            main.alliances.alliances.push(combinedalliances[aid])
        })

        Object.keys(combinedguilds).forEach(gid => {
            combinedguilds[gid].averageIp = Math.round(combinedguilds[gid].averageIp/combinedguilds[gid].count)
            main.guilds.guilds.push(combinedguilds[gid])
        })


        main.totalPlayers = main.players.players.length
        return res.status(200).json(main)


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
            let gathered = 0
            let offset = 0
            while(gathered < 200) {
                console.log(`Gathering battles with offset: ${offset}`)
                const { data } = await axios.get(BATTLES_ENDPOINT, {
                    params: {
                        offset,
                        limit: BATTLES_LIMIT,
                        sort: BATTLES_SORT,
                        timestamp: moment().unix(),
                    },
                    timeout: 120000,
                });
                await (async function() {
                    for (var i = 0; i<data.length; i++) {
                        let battle = data[i]
                        const parsed = await Battle.findOne({id: battle.id })
                        if (parsed) {
                            // console.log(`Battle ${battle.id} already parsed`)
                            gathered += 1
                        }
                        else {
                            const queued = await BattleQueue.findOne({id: battle.id})
                            if (queued) {
                                // console.log(`Battle ${battle.id} already queued`)
                                gathered += 1
                            }
                            else {
                                console.log(`Battle ${battle.id} added to queue`)
                                let newQueue = new BattleQueue({id: battle.id})
                                await newQueue.save()
                            }
                        }
                    }
                })()
                offset += BATTLES_LIMIT
                if (offset > 200) {
                    console.log(`200 parse limit reached`)
                }
            }
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