// Monta uma mensagem em Components V2 (Container + linhas de texto).
// Nenhuma chamada a .setAccentColor() aqui — por isso nenhum container
// sai com a barrinha colorida na lateral.

const { ContainerBuilder, TextDisplayBuilder } = require("discord.js");

function criarMensagem(titulo, linhas = []) {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${titulo}`));

  for (const linha of [].concat(linhas)) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(linha));
  }

  return container;
}

module.exports = { criarMensagem };
