const { MessageFlags } = require("discord.js");
const pool = require("../database/db");
const { criarMensagem } = require("../utils");

// O original tinha um "module.exports.run" declarado DE NOVO dentro dele
// mesmo, então: na primeira vez que alguém usava &user, nada acontecia
// (só reescrevia a função); só da segunda chamada em diante o comando
// realmente rodava — e mesmo assim fazia um UPDATE banned = 0 em qualquer
// ID, mesmo estando com o embed escrito "Usuário Desbanido". Virou uma
// consulta de verdade (só leitura, sem alterar nada no banco).
module.exports.run = async (client, message, args) => {
  if (!args[0]) {
    return message.channel.send({
      components: [criarMensagem("Uso incorreto", ["Use: `&user <id>`"])],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  const [linhas] = await pool.query(
    `SELECT vrp_users.id, vrp_users.banned, vrp_users.whitelisted, vrp_users.last_login,
            vrp_user_identities.name, vrp_user_identities.firstname,
            vrp_user_identities.phone, vrp_user_identities.age
     FROM vrp_users, vrp_user_identities
     WHERE vrp_users.id = vrp_user_identities.user_id AND vrp_users.id = ?`,
    [args[0]]
  ).catch((err) => {
    console.log(err);
    return [[]];
  });

  const result = linhas[0];

  if (!result) {
    return message.react("❌").then(() =>
      message.channel.send({
        components: [criarMensagem("Usuário não encontrado", [`Não existe nenhum registro com o ID **${args[0]}**.`])],
        flags: MessageFlags.IsComponentsV2,
      })
    );
  }

  const container = criarMensagem(`Usuário ${result.id}`, [
    `**Nome:** ${result.name} ${result.firstname}`,
    `**Telefone:** ${result.phone ?? "Não informado"}`,
    `**Idade:** ${result.age ?? "Não informado"}`,
    `**Whitelist:** ${result.whitelisted === 1 ? "Aprovado" : "Pendente"}`,
    `**Banido:** ${result.banned === 1 ? "Sim" : "Não"}`,
    `**Último login:** ${result.last_login}`,
  ]);

  message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
};
