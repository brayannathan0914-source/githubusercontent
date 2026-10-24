const { MessageFlags } = require("discord.js");
const pool = require("../database/db");
const { criarMensagem } = require("../utils");

module.exports.run = async (client, message, args) => {
  if (!args[0]) {
    return message.channel.send({
      components: [criarMensagem("Uso incorreto", ["Use: `&desban <id>`"])],
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

  // Mesmo bug do ban.js: sem essa checagem, ID inexistente derrubava o comando.
  if (!result) {
    return message.react("❌").then(() =>
      message.channel.send({
        components: [criarMensagem("Usuário não encontrado", [`Não existe nenhum registro com o ID **${args[0]}**.`])],
        flags: MessageFlags.IsComponentsV2,
      })
    );
  }

  if (result.banned === 0) {
    message.react("❌");
    message.channel.send({
      components: [criarMensagem("Aviso", ["❌ | Este usuário não está banido!"])],
      flags: MessageFlags.IsComponentsV2,
    });
  } else {
    const container = criarMensagem("Usuário Desbanido", [
      "Informações do usuário",
      `**Nome:** ${result.name} ${result.firstname} (${result.id})`,
      `**Último login:** ${result.last_login}`,
    ]);
    message.react("✅");
    await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

    await pool.query("UPDATE vrp_users SET banned = 0 WHERE id = ?", [args[0]]).catch((err) => console.log(err));
  }
};
