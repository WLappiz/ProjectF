//! This is a basic structure for a prefix command in discoBase using discord.js

module.exports = {
    name: "test",
    description: "cmd description.",
    aliases: ['aliases'],
    botPermissions: ['SendMessages'],
    userPermissions: ['ManageMessages'],
    adminOnly: false,
    ownerOnly: false,
    devSev: false,
    devOnly: false,
    SVOnly: false,
    cooldown: 10,
    run: async (client, message, args) => {

       message.reply('Test Done')

    },
};