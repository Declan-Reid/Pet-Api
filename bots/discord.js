import { REST, Routes, Client, Events, GatewayIntentBits, InteractionContextType, ApplicationIntegrationType, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
const router = express.Router();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;





const commands = [
	new SlashCommandBuilder()
		.setName('pet')
		.setDescription('Select a member and pet them.')
		.addUserOption((option) => option.setName('target').setDescription('The member to pet'))
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.PrivateChannel),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}


const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    
});

client.on(Events.ClientReady, readyClient => {
  	console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  	if (!interaction.isChatInputCommand()) return;

  	if (interaction.commandName === 'pet') {
		// Check if a user was provided
		if (interaction.options.getUser('target')) {
			const target = interaction.options.getUser('target');
			await interaction.reply(process.env.WEBSITE_URL + 'discord/' + target.id);
		} else {
			await interaction.reply(process.env.WEBSITE_URL + 'discord/' + interaction.user.id);
		}
  	}
});



export { client };
client.login(TOKEN);
