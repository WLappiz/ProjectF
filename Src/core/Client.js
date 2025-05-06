const { Client, Collection } = require('discord.js')
const Intents = require('./configurations/Intents')
const MyPartials = require('./configurations/Partials')
const config = require('./configurations/config')
const { mongoose } = require('mongoose')

class Fortyra extends Client {
    constructor(options) {
        super({
            intents: Intents.All,
            partials: MyPartials.All,
            presence: {
                status: 'online'
            },
            allowedMentions: {
                repliedUser: false,
                parse: [
                    'roles', 'users'
                ]
            }
        })
        this.config = config;
        this.cooldowns = new Collection();

    }

    async MongoConnect(client) {
        console.log('Connecting to MongoDB')

        try {
            mongoose.connect(config.database.Data)
            console.log('Sucessfully Connected to MongoDB')
        } catch (err) {
            console.error(err)
        }

    }
}

module.exports = Fortyra;