import { REST, Routes, Client, Events, GatewayIntentBits, InteractionContextType, ApplicationIntegrationType, SlashCommandBuilder, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
import petPetGif from '@someaspy/pet-pet-gif';
import sharp from 'sharp';

dotenv.config({ quiet: true });
import express from 'express';
const router = express.Router();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;





const commands = [
	new SlashCommandBuilder()
		.setName('pet')
		.setDescription('Select a member and pet them.')
		.addUserOption((option) => option.setName('target').setDescription('The member to pet'))
		.addIntegerOption((option) => option.setName('frame_length').setDescription('The length of the petting animation in frames (default 20)').setMinValue(1).setMaxValue(100))
		.addBooleanOption((option) => option.setName('circle').setDescription('Whether to use a circular petting animation (default false)'))
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall)
		.setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]),

	new SlashCommandBuilder()
		.setName('pet-image')
		.setDescription('Provide an image url and pet it.')
		.addStringOption((option) => option.setName('url').setDescription('The url of the image to pet').setRequired(true))
		.addIntegerOption((option) => option.setName('frame_length').setDescription('The length of the petting animation in frames (default 20)').setMinValue(1).setMaxValue(100))
		.addBooleanOption((option) => option.setName('circle').setDescription('Whether to use a circular petting animation (default false)'))
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
	presence: {
		status: 'online',
		activities: [{
			name: 'Petting things :3',
			type: ActivityType.Custom,
			state: ''
		}],
	},
});

client.on(Events.ClientReady, readyClient => {
  	console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  	if (!interaction.isChatInputCommand()) return;

  	if (interaction.commandName === 'pet')
	{
		let urlOptions = '';
		if (interaction.options.getInteger('frame_length') || interaction.options.getBoolean('circle')) {
			urlOptions += '?';
			const params = [];
			if (interaction.options.getInteger('frame_length')) {
				params.push(`speed=${interaction.options.getInteger('frame_length')}`);
			}
			if (interaction.options.getBoolean('circle')) {
				params.push(`circle=true`);
			}
			urlOptions += params.join('&');
		}

		// Check if a user was provided
		if (interaction.options.getUser('target')) {
			const target = interaction.options.getUser('target');
			console.log(`[Discord] ${interaction.user.tag} is petting ${target.tag}`);
			await interaction.reply(process.env.WEBSITE_URL + 'discord/' + target.id + ".gif" + urlOptions);
		} else {
			console.log(`[Discord] ${interaction.user.tag} is petting themselves`);
			await interaction.reply(process.env.WEBSITE_URL + 'discord/' + interaction.user.id + ".gif" + urlOptions);
		}
		return;
  	}

	if (interaction.commandName === 'pet-image')
	{
		const url = interaction.options.getString('url');
		console.log(`[Discord] ${interaction.user.tag} is petting an image: ${url}`);

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
			const pettedImageBuffer = await petPetGif(
				imageBuffer,
				{
					frameLength: interaction.options.getInteger('frame_length') || 20,
					circle: interaction.options.getBoolean('circle') || false,
				}
			);

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
