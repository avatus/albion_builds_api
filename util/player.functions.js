exports.getMostExpensiveDeath = (history) => {
    let player = null
    let participants = []
    history.forEach(e => {
        if (!player) {
            player = e.Victim
            participants = e.Participants
        }
        if (e.Victim.DeathFame > player.DeathFame) {
            player = e.Victim,
            participants = e.Participants
        }

    })
    return {player, participants}
}

exports.getHighestDamagePlayer = ({players}) => {
    let player = []
    players.forEach(p => {
        if (player.length <1) {
            player = [p]
        }
        if (p.totalDamage > player[0].totalDamage) {
            player = [p]
        }
        if (p.totalDamage === player[0].totalDamage && p.name !== player[0].name) {
            player.push(p)
        }
    })
    return {players: player, list: player.map(p => p.name)}
}

exports.getHighestKillsPlayer = ({players}) => {
    let player = []
    players.forEach(p => {
        if (player.length <1) {
            player = [p]
        }
        if (p.kills > player[0].kills) {
            player = [p]
        }
        if (p.kills === player[0].kills && p.name !== player[0].name) {
            player.push(p)
        }
    })
    return {players: player, list: player.map(p => p.name)}
}

exports.getHighestAssists = ({players}) => {
    let highest = []
    players.forEach(p => {
        if (highest.length < 1) {
            highest = [p]
        }
        if (p.totalKillContribution > highest[0].totalKillContribution) {
            highest = [p]
        }
        if (p.totalKillContribution === highest[0].totalKillContribution && p.name !== highest[0].name) {
            highest.push(p)
        }
    })
    return {players: highest, list: highest.map(p => p.name)}
}

exports.getHighestHealingPlayer = ({players}) => {
    let player = []
    players.forEach(p => {
        if (player.length < 1) {
            player = [p]
        }
        if (p.totalHealing > player[0].totalHealing) {
            player = [p]
        }
        if (p.totalHealing === player[0].totalHealing && p.name !== player[0].name) {
            player.push(p)
        }
    })
    return {players: player, list: player.map(p => p.name)}
}

const getEquipment = (equipment) => {
    const equipKeys = Object.keys(equipment)
    let eq = {}
    equipKeys.map(e => {
        if (equipment[e] && equipment[e].Type) {
            eq[e.toLowerCase()] = equipment[e].Type
        }
        else {
            eq[e.toLowerCase()] = null
        }
    })
    return eq
}

const playerArray = (history) => {
    let tracked = []
    let playerInfo = []
    history.forEach(e => {
        if (!tracked.includes(e.Victim.Name)) {
            if (e.Victim.AverageItemPower > 0) {
                playerInfo.push(e.Victim)
                tracked.push(e.Victim.Name)
            }
        }
        if (!tracked.includes(e.Killer.Name)) {
            if (e.Killer.AverageItemPower > 0) {
                playerInfo.push(e.Killer)
                tracked.push(e.Killer.Name)
            }
        }
        e.Participants.forEach(p => {
            if (!tracked.includes(p.Name)) {
                if (p.AverageItemPower > 0) {
                    playerInfo.push(p)
                    tracked.push(p.Name)
                }
            }
        })
        e.GroupMembers.forEach(p => {
            if (!tracked.includes(p.Name)) {
                playerInfo.push(p)
                tracked.push(p.Name)
            }
        })
    })
    return playerInfo
}

exports.playerArray = playerArray

const getStats = (player, participants) => {
    let totalDamage = 0
    let totalHealing = 0
    let totalAssists = 0
    participants.forEach(f => {
        if (f.Name === player.name) {
            totalAssists += 1
            totalDamage += f.DamageDone
            totalHealing += f.SupportHealingDone
        }
    })
    player.totalDamage = Math.round(totalDamage)
    player.totalHealing = Math.round(totalHealing)
    player.totalKillContribution = totalAssists
    return player
}

exports.formatPlayers = (battle, history) => {
    let players = []
    const playerIds = Object.keys(battle.players)
    const flatParticipants = history.flatMap(e => e.Participants)
    const playerInfo = playerArray(history)

    playerIds.forEach(p => {
        let player = battle.players[p]

        getStats(player, flatParticipants)

        playerInfo.forEach(f => {
            if (f.Name === player.name) {
                player.avatar = f.Avatar
                player.avatarRing = f.AvatarRing
                player.equipment = getEquipment(f.Equipment)
                player.inventory = f.Inventory.filter(i => i !== null)
                player.ip = Math.round(f.AverageItemPower)
            }
        })

        players.push(player)
    })

    players.sort((a, b) => b.kills - a.kills)
    return {players, list: players.map(p => p.name)}
}