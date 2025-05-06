module.exports = {
    name: "leave",
    botPermissions: ['SendMessages'],
    userPermissions: ['ManageMessages'],
    adminOnly: false,
    ownerOnly: true,
    devSev: false,
    devOnly: false,
    SVOnly: false,
    cooldown: 10,
    run: async (client, message, args) => {
        const guildId = args[0];

        if (!guildId) {
            return message.channel.send("Please provide a valid guild ID.");
        }

        if (guildId === "1368922286777696276", "1343227938354495548"){
            return;
        }

        try {
            const guild = await client.guilds.fetch(guildId);
            await guild.leave();
            return message.channel.send(`✅ Left the guild: **${guild.name}** (${guild.id})`);
        } catch (err) {
            console.error(err);
            return message.channel.send("❌ Failed to leave the guild. Maybe I'm not in that server or the ID is invalid.");
        }
    }
};
