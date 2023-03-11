const fs = require('node:fs');
const path = require('node:path');
const ms = require('ms');
const wait = require('node:timers/promises').setTimeout;
const { Op } = require('sequelize');
const { Client, PermissionsBitField, codeBlock, Collection, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild, ChannelType} = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const { Users, CurrencyShop } = require('./dbObjects.js');
const currency = new Collection();
// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
var CronJob = require('cron').CronJob;
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}
client.on(Events.InteractionCreate, interaction => {
	console.log(interaction);
});
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});
const { REST, Routes } = require('discord.js');
const { url } = require('node:inspector');
const { channel } = require('node:diagnostics_channel');
const commands = [];
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);
		console.log(`primaryfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
client.once(Events.ClientReady, async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
	console.log(`Logged in as ${client.user.tag}!`);
});
async function addBalance(id, amount) {
	const user = currency.get(id);
	if (user) {
		user.balance += amount;
		return user.save();
	}
	const newUser = await Users.create({ user_id: id, balance: amount });
	currency.set(id, newUser);
	return newUser.save();
}
async function addStawka(id, amount) {
	const user = currency.get(id);
	if (user) {
		user.stawka = amount;
		return user.save();
	}
	const newUser = await Users.create({ user_id: id, stawka: amount });
	currency.set(id, newUser);
	return newUser.save();
}
async function addStawk(id, amount) {
	const user = currency.get(id);
	if (user) {
		user.stawk = amount;
		return user.save();
	}
	const newUser = await Users.create({ user_id: id, stawk: amount });
	currency.set(id, newUser);
	return newUser.save();
}
function getstawka(id) {
	const user = currency.get(id);
	return user ? user.stawka : 0;
}
function getstawk(id) {
	const user = currency.get(id);
	return user ? user.stawk : 0;
}
function getBalance(id) {
	const user = currency.get(id);
	return user ? user.balance : 0;
}
client.on(Events.MessageCreate, async message => {
	addBalance(message.author.id, 1);
});
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const { commandName } = interaction;
	if (commandName === 'balance') {
		const target = interaction.options.getUser('target') ?? interaction.user;
		const jb = new EmbedBuilder()
		.setColor('Random')
		.setTitle('$БАЛАНС$')
		.setDescription(`Баланс ${target} на данный момент: ${getBalance(target.id)}$`)
		.setTimestamp()
		interaction.reply({embeds: [jb], ephemeral: true});	
	}
});
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const { commandName } = interaction;
	if (commandName === 'add') {
		const k = interaction.options.getInteger('amount')
		const target = interaction.options.getUser('target')
		if(getBalance(target.id)<-k) {
			interaction.reply({content: 'вы не можете сделать пользователю отрицательный баланс', ephemeral: true})
			return
		}
		addBalance(target.id, k);
		const bnc = new EmbedBuilder()
		.setColor('Random')
		.setTitle('Изменение баланса')
		.setDescription(`${target} получил свои деньги: ${k}`)
		.setTimestamp()
		const bnb = new EmbedBuilder()
		.setColor('Random')
		.setTitle('Изменение баланса')
		.setDescription(`${target} потерял свои деньги: ${k}`)
		.setTimestamp()
		if(k>0) {
		interaction.reply({embeds: [bnc], ephemeral: true})
		}
		if(k<0) {
			interaction.reply({embeds: [bnb], ephemeral: true})
		}
	} 
	else if (commandName === 'auction') {
		let min = interaction.options.getNumber('min')
		const max = interaction.options.getNumber('max')
		const step = interaction.options.getNumber('step')
		var durations = interaction.options.getString('durations')
		const times = interaction.options.getNumber('time')
		const dfs = interaction.options.getString('lot')
		let time = times-3
		let lc = interaction.user
		const guild = interaction.guild	
		interaction.reply({content: `аукцион будет запущен в ${time-3} utc`, ephemeral: true})
		if(max<min) {
			interaction.reply({content: 'максимальная сумма не может быть меньше или равна минимальной', ephemeral: true})
			return
		}
		if(max-(step+min)<0) {
			interaction.reply({content: 'максимальная сумма не может быть меньше или равна шагу', ephemeral: true})
			return
		}
		const channel = guild.channels.cache.get(interaction.channel.id)
		let tt = new CronJob(`00 00 ${time} * * *`, () => {
		const j = new EmbedBuilder()
		.setColor('Random')
		.setTitle(`Лот аукциона: ${dfs}`)
		.setDescription(`
		Создатель: ${lc}
		Длительность: ${durations}
		Начальная ставка: ${min}
		Максимальная ставка: ${max}
		Шаг: ${step} `)
		.setTimestamp()
		const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('primary')
				.setLabel('Click me!')
				.setStyle(ButtonStyle.Success),
		);
		let fk = 0
		channel.send({embeds: [j], components: [row]} ).then(msg => {
		const collector = channel.createMessageComponentCollector()
		collector.on('collect', async i => {
			if (i.customId === 'primary') {
if(fk === client.users.cache.get(i.user.id).id) return
if(min >= max-step) {durations = '1s'}
					if(getBalance(i.user.id)<min+step) return
				min = min + step
				addStawka(i.user.id, min)
				fk=i.user.id
				const jk = new EmbedBuilder()
					.setColor('Random')
					.setTitle(`Лот аукциона: ${dfs}`)
					.setDescription(`
					Топ ставок: ${i.user.username}
					Длительность: ${durations}
					Ставка на данный момент: ${min}
					Максимальная ставка: ${max}
					Шаг: ${step}
					ТОП СТАВКИ
					${
						currency.sort((a, b) => b.stawka - a.stawka)
							.filter(user => client.users.cache.has(user.user_id))
							.first(15)
							.map((user, position) => `(${position+1}) ${client.users.cache.get(user.user_id)}: ${user.stawka}`)
							.join(`\n`)		
					}`)
					await wait(1000)
					await msg.edit({embeds: [jk], components: [row]})
					const lol = new EmbedBuilder()
				.setTitle('Победители аукциона')
				.setColor('Random')
				.setDescription(currency.sort((a, b) => b.stawka - a.stawka)
				.filter(user => client.users.cache.has(user.user_id))
				.first(15)
				.map((user, position) => `(${position+1}) ${client.users.cache.get(user.user_id).username} (${client.users.cache.get(user.user_id).id}) ставка: ${user.stawka}`)
				.join(`\n`))
					function end() {
					currency.sort((a, b) => b.stawka - a.stawka)
					.filter(user => client.users.cache.has(user.user_id))
					.first(15)
					.map((user) => {
						addBalance(user.user_id, -getstawka(user.user_id))
						addStawka(user.user_id, 0)
					})	
					client.users.send(lc, {embeds: [lol]})
					msg.delete()
				}
				setTimeout(() => end(), ms(durations))
			}
			})
		  }); 
		})
		tt.start()
	}
	else if (commandName === 'auc') {
		let min = interaction.options.getNumber('min')
		const max = interaction.options.getNumber('max')
		const step = interaction.options.getNumber('step')
		var durations = interaction.options.getString('durations')
		const guild = interaction.guild	
		const times = interaction.options.getNumber('time')
		const dfs = interaction.options.getString('lot')
		let lc = interaction.user
		let time = times-3
		if(max<min) {
			interaction.reply({content: 'максимальная сумма не может быть меньше или равна минимальной', ephemeral: true})
			return
		}
		if(max-(step+min)<0) {
			interaction.reply({content: 'максимальная сумма не может быть меньше или равна шагу', ephemeral: true})
			return
		}
		interaction.reply({content: `аукцион будет запущен в ${time-3} utc`, ephemeral: true})
		let tt = new CronJob(`00 00 ${time} * * *`, () => {
		guild.channels.create({
			name: 'Лот: ' + dfs 
		}).then(result => {
		const channel = guild.channels.cache.get(result.id)
		const j = new EmbedBuilder()
		.setColor('Random')
		.setTitle(`Лот аукциона: ${dfs}`)
		.setDescription(`
		Создатель: ${interaction.user}
		Длительность: ${durations}
		Начальная ставка: ${min}
		Максимальная ставка: ${max}
		Шаг: ${step} `)
		.setTimestamp()
		const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('primar')
				.setLabel('Click me!')
				.setStyle(ButtonStyle.Success),
		);
		let fk = 0
		channel.send({embeds: [j], components: [row]} ).then(msg => {
		const collector = channel.createMessageComponentCollector()
		collector.on('collect', async i => {
			if (i.customId === 'primar') {
if(fk === client.users.cache.get(i.user.id).id) return
if(min >= max-step) {durations = '1s'}
					if(getBalance(i.user.id)<min+step) return
				min = min + step
				addStawk(i.user.id, min)
				fk=i.user.id
				const jk = new EmbedBuilder()
					.setColor('Random')
					.setTitle(`Лот аукциона: ${dfs}`)
					.setDescription(`
					Топ ставок: ${i.user.username}
					Длительность: ${durations}
					Ставка на данный момент: ${min}
					Максимальная ставка: ${max}
					Шаг: ${step}
					ТОП СТАВКИ
					${
						currency.sort((a, b) => b.stawk - a.stawk)
							.filter(user => client.users.cache.has(user.user_id))
							.first(15)
							.map((user, position) => `(${position+1}) ${client.users.cache.get(user.user_id)}: ${user.stawk}`)
							.join(`\n`)	
					}`)
					await wait(1000)
					await msg.edit({embeds: [jk], components: [row]})
					const lol = new EmbedBuilder()
				.setTitle('Победители аукциона')
				.setColor('Random')
				.setDescription(currency.sort((a, b) => b.stawk - a.stawk)
				.filter(user => client.users.cache.has(user.user_id))
				.first(15)
				.map((user, position) => `(${position+1}) ${client.users.cache.get(user.user_id).username} (${client.users.cache.get(user.user_id).id}) ставка: ${user.stawk}`)
				.join(`\n`))
					function end() {
					currency.sort((a, b) => b.stawk - a.stawk)
					.filter(user => client.users.cache.has(user.user_id))
					.first(15)
					.map((user) => {
						addBalance(user.user_id, -getstawk(user.user_id))
						addStawk(user.user_id, 0)
					})	
					client.users.send(lc, {embeds: [lol]})
					msg.edit(`аукцион с лотом: ${dfs} окончен`)
					client.user.setActivity('В ожидании аукциона');
				}
				setTimeout(() => end(), ms(durations))
			}
		})	
	})	  
})
		})
		tt.start()
}
	})
client.login(token)
