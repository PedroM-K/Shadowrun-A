const fs = require("fs");
const path = require("path");
const os = require("os");
const vm = require("vm");

console.log("=== INICIANDO BATERIA DE TESTES DO SISTEMA DESKTOP ===");

// 1. Teste de Integridade dos Arquivos Estáticos
console.log("\n[TESTE 1] Verificação de integridade de arquivos estáticos...");
const requiredFiles = [
  "index.html",
  "manifest.json",
  "css/theme.css",
  "css/fonts.css",
  "css/animations.css",
  "css/layout.css",
  "css/components.css",
  "js/bundle.js",
  "icons/icon.svg",
  "icons/icon.png",
  "icons/icon.ico",
  "electron/main.js",
  "electron/preload.js",
  "electron/storage-service.js",
  "LICENSE.md",
  "THIRD-PARTY-NOTICES.md",
  "package.json"
];

for (const file of requiredFiles) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) {
    console.error(`ERRO: Arquivo obrigatório não encontrado: ${file}`);
    process.exit(1);
  }
  const size = fs.statSync(fullPath).size;
  if (size === 0) {
    console.error(`ERRO: Arquivo vazio: ${file}`);
    process.exit(1);
  }
  console.log(`  OK: ${file} (${size} bytes)`);
}

// 2. Teste de Sintaxe JS
console.log("\n[TESTE 2] Validação de sintaxe JavaScript...");
const jsFilesToValidate = [
  "electron/storage-service.js",
  "electron/preload.js",
  "electron/main.js",
  "js/bundle.js"
];

for (const file of jsFilesToValidate) {
  const fullPath = path.resolve(file);
  const code = fs.readFileSync(fullPath, "utf8");
  try {
    new vm.Script(code);
    console.log(`  OK: Sintaxe válida em ${file}`);
  } catch (err) {
    console.error(`ERRO de sintaxe em ${file}:`, err.message);
    process.exit(1);
  }
}

// 3. Teste Unitário do StorageService (Persistência, Atomicidade e Backups)
console.log("\n[TESTE 3] Teste unitário do StorageService...");
const StorageService = require("../electron/storage-service");

const testDir = path.join(os.tmpdir(), "sra_test_userdata_" + Date.now());
fs.mkdirSync(testDir, { recursive: true });

const mockApp = {
  getPath: (name) => {
    if (name === "userData") return testDir;
    return testDir;
  }
};

const storage = new StorageService(mockApp);

// Teste 3.1: Diretórios criados
if (!fs.existsSync(storage.dataDir) || !fs.existsSync(storage.charsDir) || !fs.existsSync(storage.backupsDir)) {
  console.error("ERRO: Diretórios de armazenamento não foram criados corretamente.");
  process.exit(1);
}
console.log("  OK: Diretórios criados em", storage.dataDir);

// Teste 3.2: Salvar personagem
const testChar = {
  id: "char_test_001",
  version: 1,
  character: {
    alias: "Kage-Test",
    name: "Kage Shiranui",
    metatype: "Elf",
    archetype: "Infiltrator"
  },
  attributes: {
    str: { base: 2, mod: 0 },
    agi: { base: 5, mod: 0 }
  }
};

const saveRes = storage.saveCharacter(testChar);
if (!saveRes.success) {
  console.error("ERRO ao salvar personagem:", saveRes);
  process.exit(1);
}
console.log("  OK: saveCharacter executado com sucesso.");

// Teste 3.3: Carregar Roster
const roster = storage.loadRoster();
if (!Array.isArray(roster) || roster.length !== 1 || roster[0].id !== "char_test_001") {
  console.error("ERRO ao carregar roster:", roster);
  process.exit(1);
}
console.log(`  OK: loadRoster retornou ${roster.length} personagem(ns) válido(s).`);

// Teste 3.4: Salvar Roster completo com múltiplos personagens
const testChar2 = {
  id: "char_test_002",
  version: 1,
  character: {
    alias: "Chrome-Samurai",
    name: "Hanz",
    metatype: "Ork",
    archetype: "Street Samurai"
  }
};

const saveRosterRes = storage.saveRoster([testChar, testChar2]);
if (!saveRosterRes.success || saveRosterRes.count !== 2) {
  console.error("ERRO ao salvar roster completo:", saveRosterRes);
  process.exit(1);
}
const updatedRoster = storage.loadRoster();
if (updatedRoster.length !== 2) {
  console.error("ERRO: Roster deveria ter 2 personagens, tem:", updatedRoster.length);
  process.exit(1);
}
console.log("  OK: saveRoster salvou múltiplos personagens com sucesso.");

// Teste 3.5: Auto-Backup
const backupRes = storage.createAutoBackup("unit-test");
if (!backupRes.success || !fs.existsSync(backupRes.path)) {
  console.error("ERRO ao gerar auto-backup:", backupRes);
  process.exit(1);
}
console.log("  OK: Auto-backup gerado com sucesso:", backupRes.filename);

// Teste 3.6: Exportar e Restaurar Backup completo
const exportPath = path.join(testDir, "exported-backup.json");
const exportRes = storage.exportFullBackup(exportPath);
if (!exportRes.success || !fs.existsSync(exportPath)) {
  console.error("ERRO ao exportar backup:", exportRes);
  process.exit(1);
}
console.log("  OK: exportFullBackup gerou arquivo em:", exportPath);

// Deletar um personagem para testar restauração
storage.deleteCharacter("char_test_002");
if (storage.loadRoster().length !== 1) {
  console.error("ERRO ao deletar personagem.");
  process.exit(1);
}
console.log("  OK: deleteCharacter funcionou perfeitamente.");

// Restaurar do arquivo exportado
const restoreRes = storage.restoreFullBackup(exportPath);
if (!restoreRes.success || restoreRes.count !== 2 || storage.loadRoster().length !== 2) {
  console.error("ERRO ao restaurar backup:", restoreRes);
  process.exit(1);
}
console.log("  OK: restoreFullBackup restaurou as 2 fichas com sucesso.");

// Teste 3.7: Settings
storage.saveSettings({ themeId: "crimson", themeCustomHex: "#ff0000" });
const loadedSettings = storage.loadSettings();
if (loadedSettings.themeId !== "crimson") {
  console.error("ERRO ao salvar/carregar settings:", loadedSettings);
  process.exit(1);
}
console.log("  OK: Settings gravadas e restauradas com sucesso.");

// Limpeza da pasta de testes
try {
  fs.rmSync(testDir, { recursive: true, force: true });
} catch {}

console.log("\n=== TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! ===");
