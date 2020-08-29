const { playerArray } = require('./player.functions')

const getLowParticipation = (a, battle) => {
    let bk = false
    let bf = false
    if (a.kills / battle.totalKills < 0.05) {
        bk = true
    }
    if (a.killFame / battle.totalFame < 0.05) {
        bf = true
    }
    return bk && bf
}

exports.formatAlliances = (battle, history, {players}) => {
    let alliances = []
    const flatParticipants = playerArray(history)
    const killParticipants = history.flatMap(e => e.Participants)
    const allianceIds = Object.keys(battle.alliances)
    let alliancePlayerCount = {}

    players.forEach(p => {
        if (alliancePlayerCount[p.allianceName]) {
            alliancePlayerCount[p.allianceName] += 1
        }
        else {
            alliancePlayerCount[p.allianceName] = 1
        }
    })

    allianceIds.forEach(a => {
        let alliance = battle.alliances[a]
        let totalDamage = 0
        let totalHealing = 0
        let got = []
        let ipTotal = 0
        let ipCounter = 0
        killParticipants.forEach(f => {
            if (f.AllianceName === alliance.name) {
                totalDamage += f.DamageDone
                totalHealing += f.SupportHealingDone
            }
        })
        flatParticipants.forEach(f => {
            if (f.AllianceName === alliance.name) {
                if (!got.includes(f.Name)) {
                    got.push(f.Name)
                    if (f.AverageItemPower > 0) {
                        ipTotal += f.AverageItemPower
                        ipCounter += 1
                    }
                }
            }
        })

        if (allianceIds.length > 5) {
            alliance.low = getLowParticipation(alliance, battle)
        }

        alliance.totalDamage = Math.round(totalDamage)
        alliance.totalHealing = Math.round(totalHealing)
        alliance.totalPlayers = alliancePlayerCount[alliance.name]
        alliance.averageIp = Math.round(ipTotal/ipCounter)
        alliances.push(alliance)
    })

    alliances.sort((a, b) => b.killFame - a.killFame)
    return {alliances, list: alliances.map(a => a.name)}
}