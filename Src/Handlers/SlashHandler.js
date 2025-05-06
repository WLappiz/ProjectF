const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const { default: chalk } = require('chalk');
const config = require('../core/configurations/config');
const path = require('path');
const chokidar = require('chokidar');

// Add debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const activities = [];
const addActivity = (action, filePath) => {
    const timestamp = new Date().toISOString();
    activities.push({ action, filePath, timestamp });
};

const getActivities = () => activities;

const log = (message, type = 'INFO') => {
    const colors = {
        INFO: chalk.blue.bold('INFO:'),
        SUCCESS: chalk.green.bold('SUCCESS:'),
        ERROR: chalk.red.bold('ERROR:'),
        WARNING: chalk.yellow.bold('WARNING:'),
    };
    console.log(colors[type] + ' ' + message);
};

const errorsDir = path.join(__dirname, '../../logs/errors');

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

function logErrorToFile(error) {
    ensureErrorDirectoryExists();

    // Convert the error object into a string, including the stack trace
    const errorMessage = `${error.name}: ${error.message}\n${error.stack}`;

    const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const filePath = path.join(errorsDir, fileName);

    fs.writeFileSync(filePath, errorMessage, 'utf8');
}

const formatFilePath = (filePath) => {
    return path.relative(process.cwd(), filePath);
};

const isConfigIncomplete = (key, value, placeholderTokens) => {
    return !value || placeholderTokens.includes(value);
};

const getAllCommandFiles = (dirPath, arrayOfFiles = []) => {
    log(`Searching for slash commands in: ${chalk.cyan(dirPath)}`, 'INFO');
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllCommandFiles(filePath, arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(filePath);
        }
    });
    return arrayOfFiles;
};

const loadCommand = (client, filePath) => {
    try {
        if (filePath.includes('models')) {
            log(`Ignoring schema file: ${formatFilePath(filePath)}`, 'WARNING');
            return null;
        }

        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        log(`Loaded slash command file: ${chalk.cyan(formatFilePath(filePath))}`, 'INFO');

        if (!command.data || !command.data.name || typeof command.data.name !== 'string') {
            log(
                `The command file "${formatFilePath(filePath)}" is missing a valid name property.`,
                'ERROR',
            );
            return null;
        }

        client.slashCommands.set(command.data.name, command);
        return command;
    } catch (error) {
        log(`Failed to load command from "${formatFilePath(filePath)}".`, 'ERROR');
        console.error(error);
        logErrorToFile(error);
        return null;
    }
};

const loadCommands = (client, commandsPath) => {
    log(`Loading slash commands from: ${chalk.cyan(commandsPath)}`, 'INFO');
    const globalCommandArray = [];
    const devCommandArray = [];

    const commandFiles = getAllCommandFiles(commandsPath);

    for (const filePath of commandFiles) {
        try {
            const command = loadCommand(client, filePath);
            if (command) {
                if (command.devSev) {
                    devCommandArray.push(command.data.toJSON());
                    log(`Added to dev commands: ${chalk.green(command.data.name)}`, 'INFO');
                } else {
                    globalCommandArray.push(command.data.toJSON());
                    log(`Added to global commands: ${chalk.green(command.data.name)}`, 'INFO');
                }
            }
        } catch (error) {
            log(`Error loading command from "${formatFilePath(filePath)}".`, 'ERROR');
            console.error(error);
            logErrorToFile(error);
        }
    }

    log(
        `Loaded ${chalk.green(globalCommandArray.length)} global commands and ${chalk.green(
            devCommandArray.length,
        )} dev commands`,
        'INFO',
    );
    return { globalCommandArray, devCommandArray };
};

const unregisterCommand = async (commandName, rest, config, devCommandArray) => {
    try {
        // Unregister from global commands
        await rest.delete(Routes.applicationCommand(config.bot.id, commandName));
       

        // Unregister from dev guilds
        for (const guildId of config.bot.developerCommandsServerIds) {
            try {
                await rest.delete(
                    Routes.applicationGuildCommand(config.bot.id, guildId, commandName),
                );
                log(
                    `Unregistered dev command from guild ${chalk.yellow(guildId)}: ${chalk.red(
                        commandName,
                    )}`,
                    'SUCCESS',
                );
            } catch (error) {
                log(
                    `Failed to unregister dev command from guild ${chalk.yellow(
                        guildId,
                    )}: ${chalk.red(commandName)}`,
                    'ERROR',
                );
                console.error(error);
            }
        }
    } catch (error) {
        log(`Failed to unregister command: ${chalk.red(commandName)}`, 'ERROR');
        console.error(error);
    }
};

const registerCommands = async (globalCommandArray, devCommandArray, rest, config) => {
    try {
        log(
            `Attempting to register ${chalk.cyan(
                globalCommandArray.length,
            )} global commands and ${chalk.cyan(devCommandArray.length)} dev commands`,
            'INFO',
        );

        // Register global commands
        if (globalCommandArray.length > 0) {
            log(
                `Registering global commands: ${chalk.cyan(
                    globalCommandArray.map((cmd) => cmd.name).join(', '),
                )}`,
                'INFO',
            );
            await rest.put(
                Routes.applicationGuildCommands(
                    config.bot.id,
                    config.bot.developerCommandsServerIds,
                ),
                { body: globalCommandArray },
            );
            log(`Registered ${chalk.green(globalCommandArray.length)} global commands.`, 'SUCCESS');
        } else {
            log('No global commands to register.', 'WARNING');
        }

        // Register dev commands
        if (devCommandArray.length > 0 && config.bot.developerCommandsServerIds.length > 0) {
            log(
                `Registering dev commands to ${chalk.cyan(
                    config.bot.developerCommandsServerIds.length,
                )} guilds`,
                'INFO',
            );
            const promises = config.bot.developerCommandsServerIds.map(async (guildId) => {
                try {
                    await rest.put(Routes.applicationGuildCommands(config.bot.id, guildId), {
                        body: devCommandArray,
                    });
                    log(
                        `Registered ${chalk.green(
                            devCommandArray.length,
                        )} dev commands to guild ${chalk.yellow(guildId)}.`,
                        'SUCCESS',
                    );
                } catch (error) {
                    log(
                        `Failed to register dev commands to guild ${chalk.yellow(guildId)}.`,
                        'ERROR',
                    );
                    console.error(error);
                }
            });

            await Promise.all(promises);
        } else {
            log(
                'No developer guild server IDs provided, or no developer commands to register.',
                'WARNING',
            );
        }
    } catch (error) {
        log('Failed to register commands.', 'ERROR');
        console.error(error);
        logErrorToFile(error);
    }
};

const handleCommands = async (client, commandsPath) => {
    log(`Starting slash command handler for path: ${chalk.cyan(commandsPath)}`, 'INFO');
    const placeholderTokens = [
        'YOUR_BOT_TOKEN',
        'YOUR_MONGODB_URL',
        'YOUR_BOT_ID',
        'YOUR_DEVELOPER_GUILD_ID',
        'YOUR_BOT_OWNER_ID',
        'YOUR_DEVELOPER_COMMANDS_SERVER_ID_1',
        'YOUR_DEVELOPER_COMMANDS_SERVER_ID_2',
        'YOUR_GUILD_JOIN_LOGS_CHANNEL_ID',
        'YOUR_GUILD_LEAVE_LOGS_CHANNEL_ID',
        'YOUR_COMMAND_LOGS_CHANNEL_ID',
    ];

    if (
        isConfigIncomplete('botid', config.bot.id, placeholderTokens) ||
        isConfigIncomplete('bottoken', config.bot.token, placeholderTokens)
    ) {
        log('Missing or incorrect critical configuration.', 'ERROR');
        if (isConfigIncomplete('botid', config.bot.id, placeholderTokens)) {
            log(
                "Bot ID is missing or incorrect. Please replace 'YOUR_BOT_ID' with your actual bot ID in config.json.",
                'ERROR',
            );
        }
        if (isConfigIncomplete('bottoken', config.bot.token, placeholderTokens)) {
            log(
                "Bot token is missing or incorrect. Please replace 'YOUR_BOT_TOKEN' with your actual bot token in config.json.",
                'ERROR',
            );
        }
        process.exit(1);
    }

    if (!client.slashCommands) {
        client.slashCommands = new Collection();
        log(`Initialized commands collection`, 'INFO');
    }

    const rest = new REST({ version: '10' }).setToken(config.bot.token);
    log(
        `Created REST client with token: ${chalk.cyan(config.bot.token.substring(0, 10))}...`,
        'INFO',
    );

    const { globalCommandArray, devCommandArray } = loadCommands(client, commandsPath);
    log(
        `Loaded ${chalk.green(globalCommandArray.length)} global commands and ${chalk.green(
            devCommandArray.length,
        )} dev commands`,
        'INFO',
    );

    await registerCommands(globalCommandArray, devCommandArray, rest, config);

    const watcher = chokidar.watch([commandsPath, './src/functions', './src/models'], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
        depth: 99, // Allow deep directory watching
    });

    let timeout;

    const registerDebouncedCommands = async () => {
        const { globalCommandArray, devCommandArray } = loadCommands(client, commandsPath);
        await registerCommands(globalCommandArray, devCommandArray, rest, config);
    };

    const debouncedRegisterCommands = debounce(registerDebouncedCommands, 1000);

    watcher
        .on('add', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`New command file added: ${chalk.green(formatFilePath(filePath))}`, 'SUCCESS');
                debouncedRegisterCommands();
            }
        })
        .on('change', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`Command file changed: ${chalk.blue(formatFilePath(filePath))}`, 'INFO');
                debouncedRegisterCommands();
            }
        })
        .on('unlink', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`Command file removed: ${chalk.red(formatFilePath(filePath))}`, 'ERROR');
                debouncedRegisterCommands();
            }
        });
};

module.exports = { handleCommands };