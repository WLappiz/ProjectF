require('dotenv').config();
const Jsconfig = require('./config.json');

const config = {
    bot: {
        token: process.env.BOT_TOKEN,
        id: process.env.BOT_ID || 'BOT_ID',
        admins: [process.env.ADMIN_1 || 'ADMIN_1', process.env.ADMIN_2 || 'ADMIN_2'],
        ownerId: process.env.BOT_OWNER_ID || '---',
        developerCommandsServerIds: [process.env.DEV_SERVER_ID || 'ONLY_DEV_COMMANDS_SERVER_IDS'],
        devIds: Jsconfig.devIds || ['DEV_ID_1', 'DEV_ID_2'],
        staff: Jsconfig.staff || ['STAFF_ID_1', 'STAFF_ID_2'],
        bff: Jsconfig.bff || ['BFF_ID_1', 'BFF_ID_2'],
        BetaTesters: Jsconfig.BetaTesters || ['BETA_TESTER_ID_1', 'BETA_TESTER_ID_2'],
        BetaServers: Jsconfig.BetaServers || ['BETA_SERVER_ID_1', 'BETA_SERVER_ID_2'],
        LinkPass: Jsconfig.LinkPass || 'YOUR_LINK_PASS',
    },
    database: {
        Data: process.env.MONGODB_URL || 'YOUR_MONGODB_URL1',
    },
    logging: {
        guildJoinLogsId: process.env.GUILD_JOIN_LOGS_CHANNEL_ID || 'GUILD_JOIN_LOGS_CHANNEL_ID',
        guildLeaveLogsId: process.env.GUILD_LEAVE_LOGS_CHANNEL_ID || 'GUILD_LEAVE_LOGS_CHANNEL_ID',
        commandLogsChannelId: process.env.COMMAND_LOGS_CHANNEL_ID || 'COMMAND_LOGS_CHANNEL_ID',
        errorLogs: process.env.ERROR_LOGS_WEBHOOK_URL || 'YOUR_WEBHOOK_URL',
        DmSupportChannelId: process.env.DM_SUPPORT_CHANNEL_ID || 'DM_SUPPORT_CHANNEL_ID',
    },
    prefix: {
        value: process.env.BOT_PREFIX || '!',
    },
};

module.exports = config;