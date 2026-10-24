const { readFileSync } = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const configuration = require("./configuration.json");
require("dotenv").config();
const fs = require("fs");
const color = require("colors");

// Trocado o formato antigo de intents (strings tipo 'GUILD_MESSAGES') pelo
// formato do discord.js v14 (GatewayIntentBits), exigido para dar suporte
// a Components V2. GUILD_MESSAGE_REACTIONS, GUILD_INVITES, GUILD_VOICE_STATES
// e GUILD_PRESENCES nunca eram usados pelo bot — removidos. Em compensação,
// foi adicionado o MessageContent, que hoje é obrigatório pro Discord deixar
// o bot ler o conteúdo das mensagens (sem ele, os comandos por prefixo nem
// funcionariam mais, já que a API não entrega mais o texto sem essa intent).
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const config = require("./configuration.json");
client.config = config;

console.log(readFileSync("./assets/output.txt", "utf8").toString());

console.log(color.green("[BOT_WHITELIST] -"), color.blue("by zTralha"));
console.log(color.green("[VERSÃO] -") + `BETA`);
console.log(color.green("[CREDITS] -") + `Créditos : zTralha`);
console.log(color.yellow("[WARN] -") + ` Teste tirar os créditos e veja !`);

fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});

client.commands = new Collection();

fs.readdir("./commands/", (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    let props = require(`./commands/${file}`);
    let commandName = file.split(".")[0];
    console.log(color.green("[COMANDO] -" + ` ${commandName} carregado`));
    client.commands.set(commandName, props);
  });
});

console.log(color.green("[DEVELOPER] -") + "zTralha");
client.login(process.env.TOKEN);
