const { Partials } = require("discord.js");

const MyPartials = {
    All:[
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
        Partials.ThreadMember,
    ]
}

module.exports = MyPartials