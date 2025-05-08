const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "ban",
    botPermissions: [PermissionFlagsBits.BanMembers],
    userPermissions: [PermissionFlagsBits.BanMembers],
    adminOnly: false,
    ownerOnly: false,
    devSev: false,
    devOnly: false,
    SVOnly: false,
    cooldown: 5,
    run: async (client, message, args) => {

        const target = args[0]

    },
};