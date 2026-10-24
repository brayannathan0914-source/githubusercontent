const { ChannelType, PermissionFlagsBits, MessageFlags } = require("discord.js");
const configuration = require("../configuration.json");
const pool = require("../database/db");
const { criarMensagem } = require("../utils");

const TEMPO_LIMITE = 120_000; // 2 minutos por pergunta

async function perguntar(channel, msg, autorId, titulo, texto) {
  await msg.edit({ components: [criarMensagem(titulo, [texto])], flags: MessageFlags.IsComponentsV2 });

  const coletadas = await channel.awaitMessages({
    filter: (m) => m.author.id === autorId,
    max: 1,
    time: TEMPO_LIMITE,
    errors: ["time"],
  });

  const resposta = coletadas.first();
  // O original tentava "message.channel.bulkDelete(1)" (e em outro ponto
  // "channel.bulkDelete(1)"), mas o Discord não permite bulkDelete com
  // menos de 2 mensagens — isso derrubava o comando com um erro toda vez.
  // Apagar a mensagem específica coletada resolve e mantém o canal limpo.
  await resposta.delete().catch(() => {});

  return resposta.content;
}

module.exports.run = async (client, message, args) => {
  await message.delete().catch(() => {});

  // O canal antigo era criado sem nenhuma permissão configurada, ou seja,
  // ficava visível pra qualquer pessoa do servidor durante a coleta dos
  // dados. Agora só o autor e o bot enxergam o canal.
  const channel = await message.guild.channels.create({
    name: `whitelist-${message.author.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: message.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: message.author.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
      },
    ],
  });

  const msg = await channel.send({
    components: [criarMensagem("Whitelist", ["Qual o seu nome?"])],
    flags: MessageFlags.IsComponentsV2,
  });

  let nome, sobrenome, idBruto;
  try {
    nome = await perguntar(channel, msg, message.author.id, "Whitelist", "Qual o seu nome?");
    sobrenome = await perguntar(channel, msg, message.author.id, "Whitelist", "Qual o seu sobrenome?");
    idBruto = await perguntar(channel, msg, message.author.id, "Whitelist", "Qual o seu id?");
  } catch {
    // Ninguém respondeu dentro do tempo — o bot antigo não tinha esse
    // limite e o canal ficava esperando pra sempre se a pessoa sumisse.
    await msg.edit({
      components: [criarMensagem("Tempo esgotado", ["Você demorou demais pra responder. Use o comando novamente."])],
      flags: MessageFlags.IsComponentsV2,
    });
    return setTimeout(() => channel.delete().catch(() => {}), 5000);
  }

  if (!/^\d+$/.test(idBruto)) {
    await msg.edit({
      components: [criarMensagem("ID inválido", ["O ID precisa conter apenas números. Use o comando novamente."])],
      flags: MessageFlags.IsComponentsV2,
    });
    return setTimeout(() => channel.delete().catch(() => {}), 5000);
  }
  const id = idBruto;

  const [linhas] = await pool
    .query("SELECT id FROM vrp_users WHERE id = ?", [id])
    .catch((err) => {
      console.log(err);
      return [[]];
    });

  if (linhas.length === 0) {
    await channel.send({
      components: [criarMensagem("Usuário não encontrado", ["Esse usuário não existe!"])],
      flags: MessageFlags.IsComponentsV2,
    });
    return setTimeout(() => channel.delete().catch(() => {}), 2000);
  }

  await pool.query("UPDATE vrp_users SET whitelisted = 1 WHERE id = ?", [id]).catch((err) => console.log(err));

  const avisos = [];

  try {
    await message.member.roles.add(configuration.id_cargo_whitelist);
  } catch (err) {
    console.log(err);
    avisos.push("Não consegui dar o cargo de whitelist — dê manualmente e confira as permissões do bot.");
  }

  try {
    await message.member.setNickname(`${nome} ${sobrenome} | ${id}`);
  } catch (err) {
    console.log(err);
    avisos.push("Não consegui alterar o apelido — provavelmente meu cargo está abaixo do da pessoa.");
  }

  await channel.send({
    components: [criarMensagem("Cargos setados", ["Setando cargos", ...avisos])],
    flags: MessageFlags.IsComponentsV2,
  });

  setTimeout(() => {
    channel.delete().catch(() => {});
  }, 2000);
};
