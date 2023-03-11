const { SlashCommandBuilder, messageLink, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Баланс')
		.addUserOption(option => 
            option.setName('target')
            .setDescription('пользователь которому вы добавляете деньги')
            .setRequired(false)	
                ),
	async execute(interaction) {

    },
};