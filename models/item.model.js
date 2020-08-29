const mongoose = require('mongoose')
const Schema = mongoose.Schema

const itemSchema = Schema({
    itemType: { type: String },
    uniqueName: { type: String, unique: true, index: true },
    categoryId: { type: String },
    categoryName: { type: String },
    activeSlots: { type: Schema.Types.Mixed },
    passiveSlots: { type: Schema.Types.Mixed },
    name: { type: String },
    desription: { type: String },
    slotType: { type: String },
}, { minimize: false })

const ItemClass = mongoose.model('Item', itemSchema)

module.exports = ItemClass