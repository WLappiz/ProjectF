const Fortyra = require("./core/Client");
const config = require('./core/configurations/config')
const path = require('path')

const { eventsHandler } = require('./Handlers/EventHandler.js');
const { handleCommands } = require('./Handlers/SlashHandler.js');
const { prefixHandler } = require('./Handlers/PrefixHandler.js');

const { antiCrash } = require('./Handlers/antiCrash.js');

const startWatchers = require('./Handlers/watchFolder.js');

antiCrash();
startWatchers();

const client = new Fortyra({});


(async () => {

    await client.MongoConnect(client)

    await eventsHandler(client, path.join(__dirname, 'Events'));

    const prefixCommandsPath = path.join(__dirname, 'Commands');
    await prefixHandler(client, prefixCommandsPath);

    const commandsPath = path.join(__dirname, 'Commands-slash');
    await handleCommands(client, commandsPath);

    await client.login(config.bot.token).catch((error) => {
        console.error(chalk.red.bold('ERROR: ') + 'Failed to login!');
        console.error(chalk.red(error));
    });

})();

