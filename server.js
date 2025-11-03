import express from 'express';
const app = express();
const port = 4001;
import './bots/discord.js';
import { client } from './bots/discord.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Use CJS build to avoid __dirname issues in ESM
import petPetGif from '@someaspy/pet-pet-gif';

app.get('/', (req, res) => {
    res.send('Welcome to the Pet Api Website!');
});

app.get('/bot', async (req, res) => {
    res.send(`Bot is logged in as ${client.user.tag}`);
});

app.get('/discord/:id.gif', async (req, res) => {
    const userId = req.params.id;
    const delay = req.query.delay ? parseInt(req.query.delay) : 20;
    const circle = req.query.circle === 'true';
    try {
        const user = await client.users.fetch(userId);
        console.log(`[Website] Fetched: discord user ${user.tag} (${user.id})`);

        // Now we pet their pfp
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
        console.log(`[Website] Debug: ${userId} | delay=${delay} | circle=${circle} | avatarUrl=${avatarUrl}`);
        const petGif = await petPetGif(avatarUrl, { resolution: 128, delay: delay, backgroundColor: null });

        // Now we respond with the gif
        res.setHeader('Content-Type', 'image/gif');
        res.send(petGif);
    } catch (error) {
        console.error(`[Website] Error fetching: Discord user (${userId})`, error);
        res.status(404).json({ error: 'User not found, probably...' });
        return;
    }
});


app.listen(port, () => {
    console.log(`Pet Api Website listening at https://localhost:${port}`)
})
