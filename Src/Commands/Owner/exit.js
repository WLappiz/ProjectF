//! This is a basic structure for a prefix command in discoBase using discord.js

module.exports = {
    name: "shutdown",
    botPermissions: ['SendMessages'],
    userPermissions: ['ManageMessages'],
    adminOnly: false,
    ownerOnly: true,
    devSev: false,
    devOnly: false,
    SVOnly: false,
    cooldown: 10,
    run: async (client, message, args) => {


        if (args[0] === 'SNC@t031947') {
            await message.channel.send('Shutting down...');
            await client.destroy();
        } else {
            return;
        }


    }
};