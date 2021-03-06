// Import librairies
const Discord = require('discord.js')
const enmap = require('enmap')
const config = require('./config.json')

// Create the client
const client = new Discord.Client({
	presence: {
		status: "idle",
		activities: [{
			type: "COMPETING",
			name: "se reveiller"
		}],
	},
	intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_INTEGRATIONS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES"]
})

// Initiate de DATABASE
client.data = new enmap({name: "BirthDayBot_DATABASE"})

client.presenceCount = 2

// EVENT - on bot start
client.on('ready', () => {
	// Assurance que la base de donnΓ©es est valide
	client.data.ensure("annivs", [])
	// Initiation de l'interval pour le status
	setInterval(() => {
		let annivs = client.data.get('annivs')
		let today = annivs.filter(anniv => anniv.day == new Date().getDate() && anniv.month == new Date().getMonth()+1)
		if(today.length >= 1){
			let anniv = today[Math.round(Math.random()*(today.length-1))]
			client.user.setPresence({
				status: "online",
				activities: [{
					type: "LISTENING", 
					name: client.users.cache.find(user => user.id == anniv.user).tag+" ππ"
				}]
			})
		} else {
			if(client.presenceCount == 0){
				client.user.setPresence({
					status: "online",
					activities: [{
						type: "WATCHING", 
						name: client.users.cache.size+" utilisateurs π"
					}]
				})
			} else if(client.presenceCount == 1) {
				client.user.setPresence({
					status: "online",
					activities: [{
						type: "WATCHING", 
						name: client.guilds.cache.size+" serveurs π"
					}]
				})
			} else if(client.presenceCount == 2){
				client.user.setPresence({
					status: "online",
					activities: [{
						type: "LISTENING",
						name: "le dev β LeThom#7848"
					}]
				})
			}
			client.presenceCount = client.presenceCount+1
			if(client.presenceCount >= 3){
				client.presenceCount = 0
			}
		}
	}, 10*1000)

	setInterval(() => {
		if(new Date().getHours >= 8){
			let annivs = client.data.get('annivs')
			let todayAnnivs = annivs.find(anniv => anniv.month == new Date().getMonth+1 && anniv.day == new Date().getDate())
			if(todayAnnivs.length >= 1){
				todayAnnivs.forEach(anniv => {
					if(!anniv.lastYear || anniv.lastYear < new Date().getFullYear()){
						client.guilds.cache.forEach(guild => {
							let chann;
							if(guild.members.cache.find(member => member.user.id == anniv.user)){
								let dataChan = client.data.get(`${guild.id}`, "channel")
								if(dataChan){
									chann = guild.channels.cache.find(channel => channel.id == dataChan && channel.type == "GUILD_TEXT")
								}
							}
							if(!chann){
								chann = guild.channels.cache.find(channel => channel.type == "GUILD_TEXT")
							}
							chann.send({
								embeds: [{
									color: "GREEN",
									description: "Joyeux Anniversaire "+`${client.users.cache.find(user => user.id == anniv.user)}`+" πππ"
								}]
							})
						})
						anniv.lastYear = new Date().getFullYear()
					}
				})
			}
			client.data.set('annivs', annivs)
		}
	}, 1000)



	// Update/crΓ©ation de la commande intΓ©grΓ©e Γ  discord
	client.application.commands.create({
		name: "register", 
		description: "Enregistre ta date d'anniversaire ou celle d'un de tes amis",
		options: [{
			type: "USER",
			name: "utilisateur",
			description: "Pour qui es-tu en train d'enregistrer la date d'anniversaire ?",
			required: true,
		},{
			type: "INTEGER",
			name: "mois",
			description: "Le mois de la date d'anniversaire",
			choices: [{
				name: "Janvier",
				value: 1
			},{
				name: "FΓ©vrier",
				value: 2
			},{
				name: "Mars",
				value: 3
			},{
				name: "Avril",
				value: 4
			},{
				name: "Mai",
				value: 5
			},{
				name: "Juin",
				value: 6
			},{
				name: "Juillet",
				value: 7
			},{
				name: "AoΓ»t",
				value: 8
			},{
				name: "Septembre",
				value: 9
			},{
				name: "Octobre",
				value: 10
			},{
				name: "Novembre",
				value: 11
			},{
				name: "DΓ©cembre",
				value: 12
			}],
			required: true,
		},{
			type: "INTEGER",
			name: "jour",
			description: "Le jour de la date d'anniversaire (entre 1 et 31)",
			required: true,
		}]
	})
})

client.on('interactionCreate', interaction => {
	if(interaction.isCommand() && interaction.command.name == "register"){
		//interaction.deferReply()
		let annivs = client.data.get('annivs')
		var anniv = annivs.find(anniv => anniv.user == interaction.options.getUser('utilisateur').id)
		if(interaction.options.getInteger('jour') <= 0 || interaction.options.getInteger('jour') >= 32){
			interaction.reply({
				embeds: [{
					title: "ERREUR - Jour inconnu",
					description: "Bien que je puisse me tromper... Il me semble qu'Γͺtre nΓ© le "+interaction.options.getInteger('jour')+"/"+interaction.options.getInteger('mois')+" est impossible π. Veuillez rΓ©essayer avec une date valide",
					color: "RED"
				}]
			})
			return
		}
		console.log(annivs)
		if(anniv && anniv.user != interaction.user.id){
			let annivUser = client.users.cache.find(user => user.id == anniv.user)
			interaction.reply({
				ephemeral: true,
				embeds: [{
					title: "Erreur - Action Impossible",
					color: "RED",
					description: `${annivUser} a dΓ©jΓ  une date d'anniversaire d'enregistrΓ©e. Par consΓ©quent, seul ${annivUser} Γ  l'autorisation de modifier cette information.`
				}]
			})
		} else if(interaction.user.id != interaction.options.getUser('utilisateur').id) {
			anniv = {
				user: interaction.options.getUser('utilisateur').id,
				month: interaction.options.getInteger('mois'),
				day: interaction.options.getInteger('jour'),
				OwnRegistery: false
			}
			//annivs.push(anniv)
			interaction.reply({
				content: `${interaction.options.getUser('utilisateur')}`,
				embeds: [{
					title: "Nouvelle date enregistrΓ©e",
					color: "GREEN",
					description: `${interaction.user}, vous venez d'enregistrer la date d'anniversaire de ${interaction.options.getUser('utilisateur')}.\n> Par prΓ©caution, ${interaction.options.getUser('utilisateur')} Γ  Γ©tΓ© mentionnΓ© et sera contactΓ© (si possible) en privΓ© pour confirmer sa date d'anniversaire.`,
					footer: {
						text: "Date d'anniversaire enregistrΓ©e : "+anniv.day+"/"+anniv.month,
						iconURL: interaction.options.getUser('utilisateur').displayAvatarURL()
					}
				}]
			})
			client.users.cache.find(user => user.id == interaction.options.getUser('utilisateur').id).send({
				embeds: [{
					title: "Votre date d'anniversaire Γ  Γ©tΓ© enregistrΓ©e par un de vos amis",
					color: "GOLD",
					description: `Bonjour ${interaction.options.getUser('utilisateur')},\n> Votre date d'anniversaire Γ  Γ©tΓ© enregistrΓ©e par ${interaction.user} (sur le serveur ${interaction.guild.name}).\n> Veuillez vΓ©rifier la date d'anniversaire enregistrΓ©e ci-dessous et cliquer sur le bouton "CONFIRMER" si cette information est bonne. Vous pouvez Γ  tout moment modifier votre date d'anniversaire avec la commande \`/register\`.`,
					footer: {
						text: "Date d'anniversaire enregistrΓ©e : "+anniv.day+"/"+anniv.month
					}
				}],
				components: [{
					type: "ACTION_ROW",
					components: [{
						type: "BUTTON",
						customId: "confirm-date",
						label: "CONFIRMER",
						style: "PRIMARY",
					}]
				}]
			}).catch(() => {})
		} else {
			anniv = {
				user: interaction.options.getUser('utilisateur').id,
				month: interaction.options.getInteger('mois'),
				day: interaction.options.getInteger('jour'),
				OwnRegistery: true
			}
			//annivs.push(anniv)
			interaction.reply({
				embeds: [{
					title: "Nouvelle date enregistrΓ©e",
					color: "GREEN",
					description: `${interaction.user}, votre date d'anniversaire Γ  Γ©tΓ© enregistrΓ©e ^^\n> En attendant le fameux jour tant attendu je te souhaite une bonne journΓ©e π`,
					footer: {
						text: "Date d'anniversaire enregistrΓ©e : "+anniv.day+"/"+anniv.month,
						iconURL: interaction.user.displayAvatarURL()
					}
				}]
			})
		}
		console.log(anniv)
		let found = false
		for(i=0; i < annivs.length; i++){
			if(annivs[i].user == anniv.user){
				annivs[i] = anniv
				found = true
			}
		}
		if(!found){
			annivs.push(anniv)
		}
		console.log(annivs)
		client.data.set('annivs', annivs)
		console.log(interaction)
	} else if(interaction.isButton()){
		if(interaction.customId == "confirm-date"){
			let annivs = client.data.get('annivs')
			for(i=0; i<annivs.length; i++){
				if(annivs[i].user == interaction.user.id){
					annivs[i] = {
						user: annivs[i].user,
						month: annivs[i].month,
						day: annivs[i].day,
						OwnRegistery: true
					}
				}
			}
			client.data.set('annivs', annivs)
			interaction.deferUpdate()
			interaction.user.send({
				embeds: [{
					footer: {
						text: "Date d'anniversaire confirmΓ©e !"
					},
					color: 'GREEN',
				}]
			})
		}
	}
})

// Log the vlient into the discord bot user
client.login(config.token)