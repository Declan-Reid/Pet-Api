import { REST, Routes, Client, Events, GatewayIntentBits, InteractionContextType, ApplicationIntegrationType, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import petPetGif from '@someaspy/pet-pet-gif';
import sharp from 'sharp';

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
		.setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),

	new SlashCommandBuilder()
		.setName('pet-image')
		.setDescription('Provide an image url and pet it.')
		.addStringOption((option) => option.setName('url').setDescription('The url of the image to pet').setRequired(true))
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall)
		.setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
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

  	if (interaction.commandName === 'pet')
	{
		// Check if a user was provided
		if (interaction.options.getUser('target')) {
			const target = interaction.options.getUser('target');
			await interaction.reply(process.env.WEBSITE_URL + 'discord/' + target.id + ".gif");
		} else {
			await interaction.reply(process.env.WEBSITE_URL + 'discord/' + interaction.user.id + ".gif");
		}
		return;
  	}

	if (interaction.commandName === 'pet-image')
	{
		console.log('pet-image command invoked');
		const url = interaction.options.getString('url');

		// Fetch the image and convert it to a PNG buffer to ensure canvas supports it
		let imageBuffer;
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
			}
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Use sharp to convert to PNG (first frame if animated) which canvas supports
			try {
				// Allow sharp to handle animated images and extract the first frame as PNG
				imageBuffer = await sharp(buffer, { animated: true }).png().toBuffer();
			} catch (convErr) {
				// Fallback in case the animated flag isn't supported for this input
				imageBuffer = await sharp(buffer).png().toBuffer();
			}
		} catch (error) {
			console.error('Error fetching or processing the image:', error);
			await interaction.reply({ content: 'Error fetching or processing the image. Please ensure the URL is valid and points to a supported image format (png/jpg/gif/webp).' });
			return;
		}

			// Reply with the petted image as an attachment
		try {
			const pettedImageBuffer = await petPetGif(imageBuffer);

			// Reply with the petted image as an attachment
			await interaction.reply({
				files: [{
					attachment: pettedImageBuffer,
					name: 'petted.gif'
				}]
			});
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'Error processing the image.' });
		}
		return;
	}
});

export { client };
client.login(TOKEN);
