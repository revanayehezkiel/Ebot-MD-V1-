const { WAConnection } = require('@adiwajshing/baileys');
const fs = require('fs');
const settings = require('./settings');

async function loadFeatures() {
    const data = fs.readFileSync('./casefitur.json');
    return JSON.parse(data);
}

async function startBot() {
    const conn = new WAConnection();
    conn.autoReconnect = true;

    try {
        conn.loadAuthInfo('./session.json');
    } catch (err) {
        console.log('No auth info found, please pair first.');
    }

    const features = await loadFeatures();

    conn.on('open', () => {
        console.log(`${settings.botName} is connected!`);
        fs.writeFileSync('./session.json', JSON.stringify(conn.base64EncodedAuthInfo(), null, '\t'));
    });

    conn.on('chat-update', async (chatUpdate) => {
        if (!chatUpdate.hasNewMessage) return;
        const message = chatUpdate.messages.all()[0];
        if (message.key.fromMe) return;

        const sender = message.key.remoteJid;
        const body = message.message.conversation;

        const feature = features.features.find(f => f.command.toLowerCase() === body.toLowerCase());
        if (feature) {
            await conn.sendMessage(sender, { text: feature.response });
        } else {
            await conn.sendMessage(sender, { text: settings.welcomeMessage }); // Pesan sambutan
        }
    });

    conn.on('close', ({ reason, isReconnecting }) => {
        console.log(`Connection closed: ${reason}. Reconnecting: ${isReconnecting}`);
    });

    conn.on('reconnecting', () => {
        console.log('Reconnecting to WhatsApp...');
    });

    conn.on('reconnect', () => {
        console.log('Successfully reconnected to WhatsApp!');
    });

    await conn.connect({ timeoutMs: 30 * 1000 });
}

startBot().catch(err => console.error(err));