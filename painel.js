const fs = require("fs");
const readline = require("readline");
const path = require("path");

const configPath = path.join(__dirname, "config.json");
const memoriaDir = path.join(__dirname, "memoria");

let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

function salvarConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function mostrarPainel() {
  console.clear();
  const arquivos = fs.existsSync(memoriaDir) ? fs.readdirSync(memoriaDir).filter(f => f.endsWith(".txt")) : [];
  const ultimaResposta = fs.existsSync("ultima_resposta.txt")
    ? fs.readFileSync("ultima_resposta.txt", "utf-8").trim()
    : "nenhuma resposta ainda";

  console.log(`╭────── PAINEL DO DK 🧠💀`);
  console.log(`│ Status:           [${config.status ? "ONLINE" : "OFFLINE"}]`);
  console.log(`│ Modelo:           [${config.modelo}]`);
  console.log(`│ IA Ativa:         [${config.iaAtiva ? "SIM" : "NÃO"}]`);
  console.log(`│ Usuários memória: [${arquivos.length}]`);
  console.log(`│ Última resposta:  "${ultimaResposta.slice(0, 50)}"`);
  console.log(`│`);
  console.log(`│ Comandos:`);
  console.log(`│ [1] Ativar/Desativar IA`);
  console.log(`│ [2] Trocar modelo (Gemini/OpenRouter)`);
  console.log(`│ [3] Mostrar usuários com histórico`);
  console.log(`│ [4] Ver última resposta completa`);
  console.log(`│ [5] Sair`);
  console.log(`╰──────────────────────────────`);
}

function painel() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  function prompt() {
    mostrarPainel();
    rl.question("Escolha uma opção > ", (res) => {
      switch (res) {
        case "1":
          config.iaAtiva = !config.iaAtiva;
          salvarConfig();
          break;
        case "2":
          config.modelo = config.modelo === "openrouter" ? "gemini" : "openrouter";
          salvarConfig();
          break;
        case "3":
          console.clear();
          console.log("Usuários:");
          if (fs.existsSync(memoriaDir)) {
            fs.readdirSync(memoriaDir).forEach(file => console.log("- " + file.replace(".txt", "")));
          } else {
            console.log("nenhum usuário com histórico");
          }
          break;
        case "4":
          console.clear();
          if (fs.existsSync("ultima_resposta.txt")) {
            console.log("Última resposta completa:\n");
            console.log(fs.readFileSync("ultima_resposta.txt", "utf-8"));
          } else {
            console.log("nenhuma resposta ainda");
          }
          break;
        case "5":
          rl.close();
          return;
        default:
          break;
      }
      setTimeout(prompt, 1000);
    });
  }

  prompt();
}

painel();
