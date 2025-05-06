const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    WebhookClient,
    PermissionFlagsBits,
} = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

function logErrorToFile(error) {
    ensureErrorDirectoryExists();

    const errorMessage = `${error.name}: ${error.message}\n${error.stack}`;

    const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const filePath = path.join(errorsDir, fileName);

    fs.writeFileSync(filePath, errorMessage, 'utf8');
}

const config = require('../../core/configurations/config');

const botOwners = ['1203931944421949533', '1277996795225575515', '1237649310141906965'];
const webhookUrl =
    'https://discord.com/api/webhooks/1331111171205370017/Ci1_ahW1No9AiWWz7yo-kxn9rHsgLDqzwdeNGjmmeISBbJ3fWF3rwpGJOxzGdzIHVgW3';

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message || !message.author || message.author.bot || !message.content.trim()) return;

        let command;
        let args = [];

        const commandName = args[0]?.toLowerCase(); // Example of initializing `commandName`

        const DefaultPrefix = client.config.prefix.value;

        const prefixes = [DefaultPrefix, `<@${client.user.id}>`, `<@!${client.user.id}>`];

        const isMentioned = prefixes.some((prefix) => message.content.startsWith(prefix));

        // Prefix Holder
        if (message.content.startsWith(DefaultPrefix)) {
            const withoutPrefix = message.content.slice(DefaultPrefix.length).trim();
            if (withoutPrefix.length === 0) return;
            const messageArray = withoutPrefix.split(/ +/);
            command = messageArray[0].toLowerCase();
            args = messageArray.slice(1);
        } else if (isMentioned) {
            const withoutMention = message.content.slice(message.content.indexOf(' ') + 1).trim();
            if (withoutMention.length === 0) return;
            const messageArray = withoutMention.split(/ +/);
            command = messageArray[0].toLowerCase();
            args = messageArray.slice(1);
        }  else {
            return;
        }

        // Command Catch
        const prefixcmd = client.commands.get(command) || client.aliases.get(command);
        const commands = prefixcmd;
        if (command.includes('&') || command.length === 0) return;

        //Essential Checks
        if (message.guild) {
            if (!message.guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
                const embed = new EmbedBuilder()
                    .setColor(client.color.DANGER)
                    .setDescription(
                        `${client.emote.utility.cross} | I lack the necessary permissions to send messages in this server\n` +
                            `Server Name: ${message.guild.name}.`,
                    )
                    .setTimestamp();

                message.guild
                    .fetchOwner()
                    .then((owner) => {
                        owner.user
                            .send({ embeds: [embed] })
                            .then(() => console.log('DM sent successfully'))
                            .catch((error) =>
                                console.error('Failed to send DM to the owner:', error),
                            );
                    })
                    .catch((error) => {
                        console.error('Failed to fetch the guild owner:', error);
                    });
                return;
            }
        }

        // Command Check
        if (!prefixcmd) {
                return 
        }

        //Cooldown Value
        const now = Date.now();
        const cooldownAmount = (command.cooldown || 3) * 1000;

        //Cooldown functions
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }

        const timestamps = client.cooldowns.get(command.name);

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(
                        `\`❌\` | Please wait **${timeLeft.toFixed(
                            1,
                        )}** more second(s) before reusing the \`${command}\` command.`,
                    );

                return message.reply({
                    embeds: [embed],
                });
            }
        }

        timestamps.set(message.author.id, now);

        //Command Check DeveloperServer
        if (commands.devSev) {
            if (!config.bot.developerCommandsServerIds.includes(message.guild?.id)) {
                return;
            }
        }
        //Command Check Developeronly
        if (commands.devOnly) {
            if (!config.bot.devIds.includes(message.author.id)) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setDescription(
                        `❌ | This command is developer-only. You cannot run this command.`,
                    )
                    .addField('Developer Server', `https://discord.gg/${config.bot.LinkPass}`);
                return await message.reply({
                    embeds: [embed],
                });
            }
        }

        //Command Check Server Only
        if (commands.SVOnly && !message.guild) {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(
                    `❌ | This command is server-only. You cannot run this command in a DM channel.`,
                );
            return await message.reply({
                embeds: [embed],
            });
        } else {
            true;
        }

        //command Check Bot Admin Only
        if (commands.adminOnly && !config.bot.admins.includes(message.author.id)) {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(
                    `\`❌\` | This command is admin-only. You cannot run this command.`,
                );

            return message.reply({
                embeds: [embed],
            });
        }

        // Command Check Author Only
        if (commands.ownerOnly && message.author.id !== config.bot.ownerId) {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(
                    `\`❌\` | This command is owner-only. You cannot run this command.`,
                );

            return await message.reply({
                embeds: [embed],
            });
        }

        //Command Check Nessasry Permissions
        if (message.guild) {
            if (commands.userPermissions) {
                const memberPermissions = message.member.permissions;
                const missingPermissions = commands.userPermissions.filter(
                    (perm) => !memberPermissions.has(perm),
                );
                if (missingPermissions.length) {
                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(
                            `\`❌\` | You lack the necessary permissions to execute this command: \`\`\`${missingPermissions.join(
                                ', ',
                            )}\`\`\``,
                        );

                    return message.reply({
                        embeds: [embed],
                    });
                }
            }

            if (commands.botPermissions) {
                const botPermissions = message.guild.members.me.permissions;
                const missingBotPermissions = commands.botPermissions.filter(
                    (perm) => !botPermissions.has(perm),
                );
                if (missingBotPermissions.length) {
                    const embed = new EmbedBuilder()
                        .setColor('Blue')
                        .setDescription(
                            `\`❌\` | I lack the necessary permissions to execute this command: \`\`\`${missingBotPermissions.join(
                                ', ',
                            )}\`\`\``,
                        );

                    return message.reply({
                        embeds: [embed],
                    });
                }
            }
        } else {
            true;
        }

        //Execute Functions
        try {
            if (prefixcmd.execute) {
                await command.execute(message, args);
            } else if (prefixcmd.run) {
                await prefixcmd.run(client, message, args);
            } else {
                return;
            }
            const embed = new EmbedBuilder()
                .setColor(`#000000`)
                .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setDescription(
                    `Executed command: \`${commands.name}\`\n` +
                        `Command ran in: \`${message.guild.name}\`\n` +
                        `Channel ran in channel: \`${message.channel.name}\`\n` +
                        `User: \`${message.author.tag}\`\n` +
                        `Guild ID: \`${message.guild.id}\`\n` +
                        `Guild Owner: \`${message.guild.ownerId}\`\n` +
                        `User ID: \`${message.author.id}\``,
                )

                .setThumbnail(message.member.displayAvatarURL())
                .setTitle('Command Executed')
                .setTimestamp();
            const meow = new WebhookClient({
                id: `1363413926590546060`,
                token: `QbLPivPAsiC9583ziruZmissZq8yPbwYfmIzYFpP4frZD4Ww2gD7TQdTAlxCpaJigRIM`,
            });
           // await meow.send({ embeds: [embed] });
        } catch (error) {
            console.log(
                chalk.default.red.bold('ERROR: ') + `Failed to execute command "${command}".`,
            );
            console.error(error);
            message.reply({
                content: 'There was an error while executing this command!',
            });
            logErrorToFile(error);
        }
    },
};