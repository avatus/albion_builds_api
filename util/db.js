const mongoose = require('mongoose')
const chalk = require('chalk')

const options = { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useFindAndModify: false,
    useUnifiedTopology: true
}

module.exports = (URI) => {
    mongoose.connect(URI, options)
    .then(() => {console.log(`Database connected: ${chalk.magenta(URI)}`)})
    .catch(err => {console.log(`Database error: ${chalk.yellow(err.message)}`)})
}