const { playerArray } = require('./player.functions')

const getLowParticipation = (a, battle) => {
    let bk = false
    let bf = false
    if (a.kills / battle.totalKills < 0.01) {
        bk = true
    }
    if (a.killFame / battle.totalFame < 0.01) {
        bf = true
    }
    return bk && bf
}

exports.formatGuilds = (battle, history, {players}) => {
    let guilds = []
    const flatParticipants = playerArray(history)
    const guildIds = Object.keys(battle.guilds)
    let guildPlayerCount = {}
    players.forEach(p => {
        if (guildPlayerCount[p.guildName]) {
            guildPlayerCount[p.guildName] += 1
        }
        else {
            guildPlayerCount[p.guildName] = 1
        }
    })
    guildIds.forEach(g => {
        let guild = battle.guilds[g]
        let totalDamage = 0
        let totalHealing = 0
        let got = []
        let ipTotal = 0
        let ipCounter = 0
        flatParticipants.forEach(f => {
            if (f.GuildName === guild.name) {
                if (!got.includes(f.Name)) {
                    got.push(f.Name)
                    if (f.AverageItemPower > 0) {
                        ipTotal += f.AverageItemPower
                        ipCounter += 1
                    }
                }
                totalDamage += f.DamageDone
                totalHealing += f.SupportHealingDone
            }
        })

        if (guildIds.length > 5) {
            guild.low = getLowParticipation(guild, battle)
        }

        guild.totalDamage = totalDamage
        guild.totalHealing = totalHealing
        guild.totalPlayers = guildPlayerCount[guild.name]
        guild.averageIp = Math.round(ipTotal/ipCounter)
        guilds.push(guild)
    })

    guilds.sort((a, b) => b.killFame - a.killFame)
    return {guilds, list: guilds.map(g => g.name)}
}