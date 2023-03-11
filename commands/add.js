const { SlashCommandBuilder, PermissionsBitField, messageLink, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('выдача монеток')
        .setDefaultMemberPermissions(0)
        .setDMPermission(false)
        
        .addIntegerOption(option =>
            option
            .setName('amount')
            .setDescription('сколько вы хотите выдать пользователю денег')
            .setRequired(true))
            .addUserOption(option => 
            option.setName('target')
            .setDescription('пользователь которому вы добавляете деньги')
            .setRequired(true)),
	async execute(interaction) {

    },
};