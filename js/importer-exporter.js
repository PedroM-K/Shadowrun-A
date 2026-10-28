// Importação e exportação de fichas em formato JSON

import { SCHEMA_VERSION, SYSTEM_NAME, createDefaultCharacter, normalizeCharacterSkills } from "./constants.js";

// Valida se o objeto importado é uma ficha compatível
export function validateCharacterData(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["O arquivo JSON não contém um objeto de dados válido."] };
  }

  // Verifica versão do esquema
  if (typeof data.version !== "number") {
    errors.push("Campo obrigatório 'version' ausente ou inválido.");
  }

  // Verifica campos de identidade
  if (!data.character || typeof data.character !== "object") {
    errors.push("Estrutura 'character' ausente ou corrompida.");
  }

  // Verifica campos de atributos
  if (!data.attributes || typeof data.attributes !== "object") {
    errors.push("Estrutura 'attributes' ausente ou corrompida.");
  }

  // Verifica listas de dados
  const expectedArrays = ["skills", "shadowAmps", "qualities", "weapons", "gear", "contacts"];
  for (const arrKey of expectedArrays) {
    if (data[arrKey] && !Array.isArray(data[arrKey])) {
      errors.push(`O campo '${arrKey}' deve ser uma lista (array).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Ajusta dados caso venham de versões antigas
export function migrateCharacterData(rawData) {
  const defaultTemplate = createDefaultCharacter();
  const currentVersion = rawData.version || 1;

  // Clona o objeto
  const migrated = JSON.parse(JSON.stringify(rawData));

  // Garante identificador do sistema
  migrated.system = migrated.system || SYSTEM_NAME;

  // Preenche campos ausentes com valores padrão
  migrated.character = {
    ...defaultTemplate.character,
    ...(migrated.character || {})
  };

  migrated.attributes = {
    ...defaultTemplate.attributes,
    ...(migrated.attributes || {})
  };

  for (const key of ["str", "agi", "wil", "log", "cha", "edg"]) {
    if (!migrated.attributes[key]) {
      migrated.attributes[key] = { base: 1, mod: 0 };
    } else {
      migrated.attributes[key].base = Number(migrated.attributes[key].base) || 1;
      migrated.attributes[key].mod = Number(migrated.attributes[key].mod) || 0;
    }
  }

  migrated.condition = {
    ...defaultTemplate.condition,
    ...(migrated.condition || {})
  };

  // Lances e disposições
  migrated.cues = Array.isArray(migrated.cues) ? migrated.cues : defaultTemplate.cues;
  migrated.dispositions = Array.isArray(migrated.dispositions) ? migrated.dispositions : defaultTemplate.dispositions;

  migrated.skills = Array.isArray(migrated.skills) ? migrated.skills : defaultTemplate.skills;
  normalizeCharacterSkills(migrated);
  migrated.knowledgeSkills = Array.isArray(migrated.knowledgeSkills) ? migrated.knowledgeSkills : [];
  migrated.shadowAmps = Array.isArray(migrated.shadowAmps) ? migrated.shadowAmps : defaultTemplate.shadowAmps;
  migrated.qualities = Array.isArray(migrated.qualities) ? migrated.qualities : [];
  migrated.weapons = Array.isArray(migrated.weapons) ? migrated.weapons : [];
  migrated.armor = Array.isArray(migrated.armor) ? migrated.armor : [];
  migrated.gear = Array.isArray(migrated.gear) ? migrated.gear : [];
  migrated.contacts = Array.isArray(migrated.contacts) ? migrated.contacts : [];
  migrated.vehicles = Array.isArray(migrated.vehicles) ? migrated.vehicles : [];
  migrated.notes = typeof migrated.notes === "string" ? migrated.notes : "";

  migrated.version = SCHEMA_VERSION;

  return migrated;
}

// Inicia o download do arquivo JSON no navegador
export function exportCharacterToFile(charData) {
  try {
    const charName = charData?.character?.alias || charData?.character?.name || "anarchy-runner";
    const safeFilename = charName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const filename = `${safeFilename || "runner"}.json`;
    const jsonString = JSON.stringify(charData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err) {
    console.error("Export failed:", err);
    return { success: false, error: err.message };
  }
}

// Lê o arquivo JSON selecionado pelo usuário
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("Nenhum arquivo selecionado."));
    }

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      return reject(new Error("Formato inválido. Por favor selecione um arquivo '.json'."));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const validation = validateCharacterData(parsed);

        if (!validation.valid) {
          return reject(new Error("Arquivo JSON incompatível com a ficha:\n" + validation.errors.join("\n")));
        }

        const migrated = migrateCharacterData(parsed);
        resolve(migrated);
      } catch (err) {
        reject(new Error("Erro ao interpretar arquivo JSON. Verifique se o arquivo está corrompido: " + err.message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo no navegador."));
    };

    reader.readAsText(file, "UTF-8");
  });
}
