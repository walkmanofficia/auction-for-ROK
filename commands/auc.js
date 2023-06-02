const { SlashCommandBuilder, messageLink, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auc')
		.setDescription('Аукцион')
        .setDefaultMemberPermissions(0)
		.addNumberOption(option =>
			option
				.setName('min')
				.setDescription('минимальная ставка на лот')
				.setRequired(true))
		.addNumberOption(option =>
			option
			.setName('max')
			.setDescription('max, больше этой суммы поставить никто не сможет')
			.setRequired(true)
			)
		.addNumberOption(option =>
			option
			.setName('step')
			.setDescription('шаг ставки')
			.setRequired(true)
			)
				.addStringOption(option =>
					option
					.setName('durations')
					.setDescription('длительность к примеру 20h, 20s,20m')
					.setRequired(true))
						.addStringOption(option => 
							option
							.setName('lot')
							.setDescription('лот данного аукциона')
							.setRequired(true))
							.addNumberOption(option =>
								option
								.setName('time')
								.setDescription('начало аукциона по мск')
								.setRequired(true)
								),
	async execute(interaction) {
		
	},
};