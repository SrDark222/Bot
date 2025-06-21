const { Client, GatewayIntentBits } = require('djs-selfbot');
const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// pasta pra memória de conversa por usuário
const memoriaDir = './memoria/';
if (!fs.existsSync(memoriaDir)) fs.mkdirSync(memoriaDir);

function getUserMemoryFile(id) {
  return `${memoriaDir}${id}.txt`;
}

function getMemory(id) {
  try {
    return fs.readFileSync(getUserMemoryFile(id), 'utf-8');
  } catch {
    return '';
  }
}

function saveMemory(id, text) {
  fs.writeFileSync(getUserMemoryFile(id), text);
}

// configuração do server invite e API key openrouter
const SERVER_INVITE = 'https://discord.gg/fjZRjEcpwV';
const OPENROUTER_API_KEY = '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';

function buildPrompt(userMessage, username, history) {
  return `
vc é um brother do chat que conversa normal sem parecer divulgação
sempre escreve tudo minúsculo com erros leves tipo "vamo la" "num sei" "da hora"
usa o nome do usuário ${username} no texto
conversa sobre varios assuntos mas vai puxando pro convite pro servidor ${SERVER_INVITE}
usa 100% de persuasão e técnicas de influencia pra convencer a pessoa entrar sem parecer propaganda
histórico: ${history}
usuario disse: ${userMessage}
responda curto simples e na moral
`;
}

async function chamarIA(prompt) {
  try {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'sk-or-v1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8
    }, {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
    });
    return res.data.choices[0].message.content;
  } catch {
    return 'deu ruim aqui tenta de novo depois';
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  checkUpdate: false
});

rl.question('digita o token do seu discord ai boss > ', token => {
  client.login(token).catch(() => {
    console.log('token inválido ou banido');
    process.exit();
  });
  rl.close();
});

client.on('ready', () => {
  console.clear();
  console.log(`👑 logado como: ${client.user.tag}`);
  console.log(`💀 pronto pra mandar o papo reto e chamar a galera`);
});

client.on('messageCreate', async message => {
  if (message.author.id === client.user.id) return;
  if (message.channel.type !== 1) return; // só DM

  const userId = message.author.id;
  const username = message.author.username.toLowerCase();
  const userMsg = message.content.toLowerCase();

  let history = getMemory(userId);
  history += `\nuser: ${userMsg}`;

  const prompt = buildPrompt(userMsg, username, history);
  const iaResponse = await chamarIA(prompt);

  history += `\nbot: ${iaResponse}`;
  saveMemory(userId, history);

  await sleep(1500);
  try {
    message.channel.send(iaResponse);
  } catch {}
});
