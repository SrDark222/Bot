const { Client, GatewayIntentBits } = require('discord.js-selfbot-v13');
const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// CONFIGURA AQUI SEU OPENROUTER API KEY e invite do server
const OPENROUTER_API_KEY = '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';
const SERVER_INVITE = 'https://discord.gg/fjZRjEcpwV';

const client = new Client({
  checkUpdate: false,
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages]
});

// memória simples em arquivo, por usuário
const memoriaDir = './memoria/';
if (!fs.existsSync(memoriaDir)) fs.mkdirSync(memoriaDir);

function getUserMemoryFile(id) {
  return `${memoriaDir}${id}.txt`;
}

async function getMemory(id) {
  try {
    return fs.readFileSync(getUserMemoryFile(id), 'utf-8');
  } catch {
    return '';
  }
}

async function saveMemory(id, text) {
  fs.writeFileSync(getUserMemoryFile(id), text);
}

// prompt de persuasão para IA
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

// chama OpenRouter API com prompt
async function chamarIA(prompt) {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'sk-or-v1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8
    }, {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
    });
    return response.data.choices[0].message.content;
  } catch (e) {
    return 'deu ruim aqui tenta de novo depois';
  }
}

client.on('ready', () => {
  console.clear();
  console.log(`👑 logado como: ${client.user.tag}`);
  console.log(`💀 pronto pra mandar o papo reto e chamar a galera`);
});

client.on('messageCreate', async message => {
  if (message.author.id === client.user.id) return; // não responde a si mesmo
  if (message.channel.type !== 1) return; // só DM

  const userId = message.author.id;
  const username = message.author.username.toLowerCase();
  const userMsg = message.content.toLowerCase();

  let history = await getMemory(userId);
  history += `\nuser: ${userMsg}`;

  const prompt = buildPrompt(userMsg, username, history);
  const iaResponse = await chamarIA(prompt);

  history += `\nbot: ${iaResponse}`;
  await saveMemory(userId, history);

  // responde com delay pra parecer natural
  await sleep(1500);
  message.channel.send(iaResponse);
});

// lê token via terminal (sem deixar salvo no arquivo)
rl.question('digita teu token do discord aqui boss > ', token => {
  client.login(token).catch(() => {
    console.log('token invalido ou banido ou erro de login');
    process.exit();
  });
  rl.close();
});
