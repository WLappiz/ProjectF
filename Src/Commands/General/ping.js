const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: ['pong'],
    description: "Display bot's latency!",
    usage: 'ping',
    category: 'essentials',
    botPermissions: ['EmbedLinks', 'SendMessages', 'AttachFiles', 'ReadMessageHistory'],
    userPermissions: [''],
    adminOnly: false,
    ownerOnly: false,
    devSev: false,
    devOnly: false,
    SVOnly: false,
    cooldown: 5,
    run: async (client, message, args) => {

        try {
            if (!message.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) {
                return message.reply('I lack permission to send `EmbedLinks`.');
            }

            const apiPing = Math.round(client.ws.ping);

            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setDescription(`📡 **Latency:** \`${apiPing} ms\``)
                .setColor(`#000000`)
                .addFields(
                    { name: 'Bot Latency', value: `\`${apiPing} ms\``, inline: true },
                    { name: 'WebSocket Status', value: '🟢 Online', inline: true },
                )
                .setTimestamp()
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL(),
                });

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply({
                content: 'There was an error while executing this command!',
            });
            console.error(error)
        }
    },
};