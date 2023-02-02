const Sequelize = require('sequelize')

const sequelize = new Sequelize('Cookies', 'root', 'new_password', {
    host: '127.0.0.1',
    dialect: 'mysql'
})

module.exports = sequelize