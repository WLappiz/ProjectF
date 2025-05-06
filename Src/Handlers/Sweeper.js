const { SnowflakeUtil, EmbedBuilder, WebhookClient } = require('discord.js');
const { isMainThread } = require('worker_threads');


const PROJECT_CODE_NAME = 'Project A';
const bbl = process.env.sweeperWH || "";
const memoryLogger = new WebhookClient({
    url: bbl || ""});

const SWEEP_INTERVAL = 10 * 60 * 1000; 
const THRESHOLD = 60 * 60 * 1000; 
const SUPPORT_GUILD_ID = '1180427110200905798'; 

class MemorySweeper {
    constructor(client) {
        this.client = client;
        this.task = null;
    }

    
    setup() {
        this.clearTask(); 
        this.run(); 
        this.task = setInterval(() => this.run(), SWEEP_INTERVAL); 
        console.log(`[INFO] Memory sweeper setup for ${PROJECT_CODE_NAME}.`);
    }


    clearTask() {
        if (this.task) {
            clearInterval(this.task);
            this.task = null;
            console.log('[INFO] Memory sweeper task cleared.');
        }
    }


    run() {
        const OLD_SNOWFLAKE = SnowflakeUtil.generate(Date.now() - THRESHOLD);
        let guildMembers = 0,
            lastMessages = 0,
            emojis = 0,
            voiceStates = 0,
            users = 0;

        const oldMemoryUsage = process.memoryUsage().heapUsed;


        for (const guild of this.client.guilds.cache.values()) {
            if (!guild.available) continue;

            for (const [id, member] of guild.members.cache) {
                if (member.id === this.client.user.id) continue;


                if (member.voice.channelId && member.user.bot) guild.voiceStates.cache.delete(id);
                if (member.lastMessageId && member.lastMessageId < OLD_SNOWFLAKE) guild.members.cache.delete(id);

                guildMembers++;
                voiceStates++;
            }


            if (guild.id !== SUPPORT_GUILD_ID) {
                emojis += guild.emojis.cache.size;
                guild.emojis.cache.clear();
            }
        }


        for (const channel of this.client.channels.cache.values()) {
            if (channel.lastMessageId) {
                channel.lastMessageId = null;
                lastMessages++;
            }
        }


        for (const user of this.client.users.cache.values()) {
            if (user.lastMessageId && user.lastMessageId < OLD_SNOWFLAKE) {
                this.client.users.cache.delete(user.id);
                users++;
            }
        }


        if (this.client.user.username !== PROJECT_CODE_NAME) return;


        const embed = new EmbedBuilder()
            .setTitle(`Memory Sweeper (${PROJECT_CODE_NAME})`)
            .setColor('#00AAFF')
            .setDescription(
                `**Cache swept:**\n` +
                `Guild Members: \`${guildMembers}\`\n` +
                `Users: \`${users}\`\n` +
                `Emojis: \`${emojis}\`\n` +
                `Voice States: \`${voiceStates}\`\n` +
                `Messages: \`${lastMessages}\``
            )
            .addFields(
                {
                    name: 'Memory Swept:',
                    value: `\`${this.formatBytes(process.memoryUsage().heapUsed - oldMemoryUsage)}\``,
                    inline: true,
                },
                {
                    name: 'Current Memory Usage:',
                    value: `\`${this.formatBytes(process.memoryUsage().heapUsed)}\``,
                    inline: true,
                }
            );

        memoryLogger.send({ embeds: [embed] }).catch(error => {
            console.error(`[ERROR] Failed to send memory sweeper logs (${PROJECT_CODE_NAME}):`, error);
        });
    }


    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024,
            dm = 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

module.exports = MemorySweeper;