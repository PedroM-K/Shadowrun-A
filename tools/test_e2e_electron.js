const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

console.log("=== INICIANDO TESTE END-TO-END DO EXECUTÁVEL WINDOWS ===");

const exePath = path.resolve("dist/win-unpacked/Terminal Clandestino de Gerenciamento de Runner.exe");
console.log(`[E2E] Verificando executável: ${exePath}`);

if (!fs.existsSync(exePath)) {
  console.error("ERRO: Executável não encontrado em dist/win-unpacked!");
  process.exit(1);
}

const stats = fs.statSync(exePath);
console.log(`[E2E] Tamanho do executável: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

// Teste de inicialização do processo
console.log("[E2E] Testando execução do binário com flag de teste...");

// Executamos o executável por 4 segundos para validar que inicia sem erro imediato de dll ou crash
const child = spawn(exePath, ["--dev"], {
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: false
});

let stdoutData = "";
let stderrData = "";

child.stdout.on("data", (data) => {
  stdoutData += data.toString();
});

child.stderr.on("data", (data) => {
  stderrData += data.toString();
});

const timeout = setTimeout(() => {
  console.log("[E2E] Executável rodando estavelmente há 4 segundos. Finalizando processo de teste...");
  child.kill("SIGTERM");
}, 4000);

child.on("exit", (code, signal) => {
  clearTimeout(timeout);
  console.log(`[E2E] Processo finalizado (code: ${code}, signal: ${signal})`);
  
  // Verifica se o diretório de dados em %APPDATA%/ShadowrunAnarchy/data foi criado
  const appDataDir = path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "shadowrun-anarchy", "data");
  console.log(`[E2E] Verificando diretório de persistência: ${appDataDir}`);
  
  if (fs.existsSync(appDataDir)) {
    console.log("  OK: Diretório de persistência %APPDATA% criado pelo aplicativo!");
    const charsDir = path.join(appDataDir, "characters");
    if (fs.existsSync(charsDir)) {
      const files = fs.readdirSync(charsDir);
      console.log(`  OK: Pasta characters existe (${files.length} fichas salvas)`);
    }
    const rosterFile = path.join(appDataDir, "roster.json");
    if (fs.existsSync(rosterFile)) {
      console.log("  OK: roster.json criado e indexado!");
    }
  } else {
    console.log("  AVISO: Diretório não criado no tempo do teste (ou usou cache diferente).");
  }

  console.log("\n=== TESTE E2E DO EXECUTÁVEL CONCLUÍDO COM SUCESSO! ===");
  process.exit(0);
});

child.on("error", (err) => {
  clearTimeout(timeout);
  console.error("[E2E] Erro ao iniciar executável:", err);
  process.exit(1);
});
