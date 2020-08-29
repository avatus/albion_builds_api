require('dotenv').config()
const chalk = require('chalk')
const db = require('./util/db')
const app = require('./api.routes')

db(process.env.MONGO_URI)

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {console.log(`Server listening on port ${chalk.green(PORT)}`)})