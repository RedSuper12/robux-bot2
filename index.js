 const { Client, Collection, MessageEmbed } = require('discord.js');
const client = new Client();
const config = require('./config');
const { readdirSync } = require('fs');
const express = require("express");
const app = express();

app.listen(() => console.log("Server started"));

app.use('/ping', (req, res) => {
  res.send(new Date());
});

client.commands = new Collection();
const cooldowns = new Collection();

const Start = require('./src/start');
const Help = require('./tools/help');

Start(client);

for (var file of readdirSync('commands')) {
  var files = readdirSync('commands/' + file).filter((cmd) => cmd.endsWith('.js'));
  for (var command of files) {
    let cmd = require('./commands/' + file + '/' + command);
    cmd.config[file.toString()] = true;
    client.commands.set(cmd.config.name, cmd);
  }
}
client.prefix = config.prefix;
/*
const status = require("discord.js/src/util/Constants.js");
status.DefaultOptions.ws.properties.$browser = "Discord Android";
*/
client.on("ready", async () => {
  console.log(`Logged in as '${client.user.tag}'`);
});

client.on('message', async (message) => {

  const { db } = client.data;
  let key = `${message.guild.id}`
  var data = db.get(key);
  if (data) {
    if (data.prefix !== null) {
      client.prefix = data.prefix;
    }
  } else client.prefix = config.prefix;

  if (message.author.bot) return;
  if (!message.content.startsWith(client.prefix)) return;
  const args = message.content.slice(client.prefix.length).trim().replace(/١/g, "1").replace(/٢/g, "2").replace(/٣/g, "3")
    .replace(/٤/g, "4").replace(/٥/g, "5").replace(/٦/g, "6")
    .replace(/٧/g, "7").replace(/٨/g, "8").replace(/٩/g, "9")
    .replace(/٠/g, "0").split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName) || client.commands.find((cmd) => cmd.config.aliases && cmd.config.aliases.includes(commandName));
  if (!command) return;
  let cmd = command.config;
  if (!cmd.dm && message.channel.type === "dm") return;
  if (cmd.owner && !config.owners.includes(message.author.id)) return;
  if (cmd.admin && !message.member.hasPermission([cmd.permissions])) return;
  if (cmd.admin && !message.guild.me.hasPermission([cmd.permissions_bot])) return message.channel.send(`**> ${config.emojis.err} عذراً ليس لدي الصلاحيات اللآزمة !**`);
  if (cmd.args && !args.length) return message.channel.send(Help(message, cmd.name, client));

  if (!cooldowns.has(cmd.name)) {
    cooldowns.set(cmd.name, new Collection());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(cmd.name);
  const cooldownAmount = (cmd.cooldown || 3) * 1000;
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.channel.send(`> **${config.emojis.err} - الرجاء الانتظار ${timeLeft.toFixed(1)} من الثواني.**`)
        .then(msg => {
          msg.delete({ timeout: 2500 })
          message.delete({ timeout: 2500 })
        });
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); 
  try {
    command.run(message, args, client);
  } catch (error) { }
});
client.on('nitroBoost', (booster) => {
  const { dbg } = client.data;
  var data = dbg.get(booster.guild.id);
  //if (data.getBoostRole !== null && data.getBoostRoom !== null){
  var embed = new MessageEmbed().setTitle(`مـشكور عـلى البـوست `).setColor("BLACK").setDescription(`خـصائـص الرتبه كـالـتالـي:\nـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ\nخصـم لـ روبوكس\n**1 Robux = ${Math.floor(parseInt(data.getPrice) - parseInt(data.getPrice) * (parseInt(data.getDiscount) / 100))}**\nالـقنوات الـخاصـه\nـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ\nأسـتمـتع بـخصائـصك`);
   var ro = booster.guild.roles.cache.sort((b,a) => b.position + a.position).find(r => r.id === data.getBoostRole);
   if (ro) booster.roles.add(booster.guild.roles.cache.find(a => a.id === ''))
    booster.guild.channels.cache.get(data.getBoostRoom).send(embed);
});



client.login(config.token);