const { MessageFlags } = require("discord.js");
const pool = require("../database/db");
const { criarMensagem } = require("../utils");

module.exports.run = async (client, message, args) => {
  if (!args[0]) {
    return message.channel.send({
      components: [criarMensagem("Uso incorreto", ["Use: `&ban <id>`"])],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  const [linhas] = await pool.query(
    `SELECT vrp_users.id, vrp_users.banned, vrp_users.ip, vrp_users.last_login,
            vrp_user_identities.user_id, vrp_user_identities.phone,
            vrp_user_identities.name, vrp_user_identities.firstname, vrp_user_identities.age
     FROM vrp_users, vrp_user_identities
     WHERE vrp_users.id = vrp_user_identities.user_id AND vrp_users.id = ?`,
    [args[0]]
  ).catch((err) => {
    console.log(err);
    return [[]];
  });

  const result = linhas[0];

  // O bot original quebrava aqui (Cannot read properties of undefined)
  // quando o ID não existia no banco, porque acessava result[0].banned
  // sem antes checar se o usuário foi encontrado.
  if (!result) {
    return message.react("❌").then(() =>
      message.channel.send({
        components: [criarMensagem("Usuário não encontrado", [`Não existe nenhum registro com o ID **${args[0]}**.`])],
        flags: MessageFlags.IsComponentsV2,
      })
    );
  }

  if (result.banned === 0) {
    const container = criarMensagem("Usuário Banido", [
      "Informações do usuário",
      `**Nome:** ${result.name} ${result.firstname} (${result.id})`,
      `**Último login:** ${result.last_login}`,
    ]);
    await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

    await pool.query("UPDATE vrp_users SET banned = 1 WHERE id = ?", [args[0]]).catch((err) => console.log(err));
    message.react("✅");
  } else {
    message.react("❌");
    message.channel.send({
      components: [criarMensagem("Aviso", ["❌ | Este usuário já está banido!"])],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
