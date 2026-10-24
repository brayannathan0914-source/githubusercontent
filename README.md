# Bot_Whitelist_FiveM

Mesma estrutura da source original — 4 comandos por prefixo (`&wl`, `&ban`,
`&desban`, `&user`) — só com os erros corrigidos e as mensagens em
**Components V2**, sem cor na borda dos containers.

# Requisitos

- Node.js >= 18
- Servidor MySQL

# Como usar

1. `npm install`
2. Abra o `.env` e preencha `TOKEN`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_DATABASE`
3. Abra `configuration.json` e preencha `id_cargo_whitelist` com o ID do cargo
4. No Developer Portal, em Bot → Privileged Gateway Intents, ative **Server Members Intent** e **Message Content Intent**
5. `node index.js`

# Comandos

- `&wl` — cria um canal privado (só você e o bot veem), pergunta nome/sobrenome/id e libera a whitelist
- `&ban <id>` — bane um usuário pelo ID
- `&desban <id>` — remove o banimento de um usuário pelo ID
- `&user <id>` — consulta os dados de um usuário (whitelist, banimento, etc.)

# O que foi corrigido

- **`user.js` tinha um `module.exports.run` declarado de novo dentro de si
  mesmo** — o comando não fazia nada na primeira vez que era usado, e da
  segunda chamada em diante dava `UPDATE banned = 0` em qualquer ID, mesmo
  com o texto dizendo "Usuário Desbanido". Agora é uma consulta de verdade,
  só leitura.
- **`&ban` e `&desban` quebravam com `Cannot read properties of undefined`**
  quando o ID informado não existia no banco — faltava checar se a consulta
  retornou algum resultado.
- **`&wl` usava `bulkDelete(1)`**, que o Discord não aceita (mínimo de 2
  mensagens) — o comando quebrava no meio da primeira pergunta. Trocado por
  apagar a mensagem específica coletada.
- **O canal criado pelo `&wl` não tinha nenhuma permissão configurada** —
  ficava visível pra qualquer pessoa do servidor durante a coleta de nome,
  sobrenome e ID. Agora só o autor e o bot enxergam o canal.
- **Nenhuma pergunta do `&wl` tinha limite de tempo** — se a pessoa
  sumisse, o canal ficava esperando pra sempre. Agora há um limite de 2
  minutos por pergunta, com aviso e limpeza automática do canal.
- **ID da whitelist não era validado** — agora precisa ser só números antes
  de consultar o banco.
- **Conexão única com o MySQL (`mysql.createConnection`), uma por
  comando** — se o banco caísse, todos os comandos paravam até reiniciar o
  bot. Trocado por um único pool (`mysql2`), que reconecta sozinho e também
  resolve a incompatibilidade do pacote `mysql` antigo com MySQL 8.
- **Adição de cargo e alteração de apelido no `&wl` sem tratamento de
  erro** — se o bot não tivesse permissão, o comando quebrava no meio.
  Agora avisa no canal em vez de travar.
- Intents atualizadas pro formato do discord.js v14 (necessário pra usar
  Components V2); removidas as que não eram usadas (reações, convites, voz,
  presença) e adicionado o `MessageContent`, hoje obrigatório para o bot
  conseguir ler os comandos por prefixo.
- Embeds com `setColor('BLACK')` trocados por Containers em Components V2,
  sem `setAccentColor` — sem barra colorida na lateral, como pedido.

Créditos: © Tralha Community, zTralha : discord.gg/tralhacommunity
