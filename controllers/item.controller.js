const Item = require('../models/item.model')

exports.getItem = async (req, res) => {
    const { id } = req.params
    try {
        const item = await Item.findOne({ uniqueName: id})

        if (item === null) {
            return res.status(404).json({message: 'item data not found'})
        }

        return res.status(200).json(item)

    } catch (err) {
        console.log(err)
        return res.status(500).json({message: err.message})
    }
}