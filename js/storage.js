// Gerenciamento de salvamento local e lista de fichas no navegador e desktop (%APPDATA%)

import {
  STORAGE_KEY,
  STORAGE_ROSTER_KEY,
  STORAGE_ACTIVE_ID_KEY,
  STORAGE_BACKUP_PREFIX,
  STORAGE_THEME_KEY,
  DEFAULT_THEME_ID,
  createDefaultCharacter,
  normalizeCharacterSkills
} from "./constants.js";

// Helper para detectar ambiente desktop seguro (Electron)
function getElectronAPI() {
  if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.isDesktop) {
    return window.electronAPI;
  }
  return null;
}

// Helper para clonagem profunda segura (descongela objetos IPC do Electron)
function deepClone(obj) {
  if (!obj) return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

// Cache local em memória sincronizado com %APPDATA%
let desktopRosterCache = null;

// Carrega todas as fichas salvas
export function loadRoster() {
  const electron = getElectronAPI();

  // Se estiver no Desktop Windows (Electron)
  if (electron) {
    if (desktopRosterCache && Array.isArray(desktopRosterCache) && desktopRosterCache.length > 0) {
      return deepClone(desktopRosterCache).map(c => normalizeCharacterSkills(c));
    }

    if (electron.initialState && Array.isArray(electron.initialState.roster) && electron.initialState.roster.length > 0) {
      desktopRosterCache = deepClone(electron.initialState.roster).map(c => normalizeCharacterSkills(c));
      try {
        localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(desktopRosterCache));
      } catch {}
      return deepClone(desktopRosterCache);
    }

    // Se o banco desktop estiver vazio pela primeira vez, migra do localStorage (se existir)
    try {
      const localRoster = localStorage.getItem(STORAGE_ROSTER_KEY);
      if (localRoster) {
        const parsed = JSON.parse(localRoster);
        if (Array.isArray(parsed) && parsed.length > 0) {
          desktopRosterCache = deepClone(parsed).map(c => normalizeCharacterSkills(c));
          electron.saveRoster(desktopRosterCache).catch(console.error);
          return deepClone(desktopRosterCache);
        }
      }
    } catch {}

    // Cria ficha padrão inicial no Desktop
    const initialChar = createDefaultCharacter("");
    desktopRosterCache = [initialChar];
    electron.saveCharacter(initialChar).catch(console.error);
    electron.saveRoster(desktopRosterCache).catch(console.error);
    setActiveCharacterId(initialChar.id);
    return deepClone(desktopRosterCache);
  }

  // Ambiente Web padrão (localStorage)
  try {
    const rawRoster = localStorage.getItem(STORAGE_ROSTER_KEY);
    if (rawRoster) {
      const parsed = JSON.parse(rawRoster);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(c => {
          if (!c.id) {
            c.id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          }
          return normalizeCharacterSkills(c);
        });
      }
    }

    // Migração: busca ficha antiga salva individualmente
    const rawSingle = localStorage.getItem(STORAGE_KEY);
    if (rawSingle) {
      const singleChar = JSON.parse(rawSingle);
      if (typeof singleChar === "object" && singleChar !== null) {
        if (!singleChar.id) {
          singleChar.id = `char_migrated_${Date.now()}`;
        }
        const normalized = normalizeCharacterSkills(singleChar);
        const roster = [normalized];
        saveRoster(roster);
        setActiveCharacterId(normalized.id);
        return roster;
      }
    }

    // Cria uma ficha padrão se ainda não houver nenhuma salva
    const initialChar = createDefaultCharacter("");
    const initialRoster = [initialChar];
    saveRoster(initialRoster);
    setActiveCharacterId(initialChar.id);
    return initialRoster;
  } catch (err) {
    console.error("Failed to load character roster from localStorage:", err);
    const fallback = [createDefaultCharacter("")];
    return fallback;
  }
}

// Salva a lista completa de personagens no armazenamento local
export function saveRoster(roster) {
  try {
    if (!Array.isArray(roster)) {
      throw new Error("Invalid roster array provided to saveRoster.");
    }
    desktopRosterCache = roster;
    try {
      localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(roster));
    } catch {}

    const electron = getElectronAPI();
    if (electron) {
      electron.saveRoster(roster).catch(err => {
        console.error("[Storage] Native saveRoster failed:", err);
      });
    }

    return true;
  } catch (err) {
    console.error("Failed to save roster to localStorage:", err);
    return false;
  }
}

let currentActiveId = null;

// Retorna o ID da ficha ativa no momento
export function getActiveCharacterId() {
  if (currentActiveId) return currentActiveId;
  const electron = getElectronAPI();
  if (electron && electron.initialState && electron.initialState.activeId) {
    currentActiveId = electron.initialState.activeId;
    return currentActiveId;
  }
  try {
    const roster = loadRoster();
    const storedId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (storedId && roster.some(c => c.id === storedId)) {
      currentActiveId = storedId;
      return storedId;
    }
    if (roster.length > 0) {
      const defaultId = roster[0].id;
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, defaultId);
      currentActiveId = defaultId;
      return defaultId;
    }
    return null;
  } catch {
    return null;
  }
}

// Define qual ficha está ativa
export function setActiveCharacterId(id) {
  try {
    if (id) {
      currentActiveId = id;
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
      const electron = getElectronAPI();
      if (electron) {
        electron.setActiveId(id).catch(console.error);
      }
    }
  } catch (err) {
    console.warn("Could not set active character ID:", err);
  }
}

// Carrega os dados da ficha ativa
export function loadCharacter() {
  try {
    const roster = loadRoster();
    const activeId = getActiveCharacterId();
    const activeChar = roster.find(c => c.id === activeId) || roster[0];
    if (activeChar) {
      return normalizeCharacterSkills(deepClone(activeChar));
    }
    const fresh = createDefaultCharacter("");
    saveCharacter(fresh);
    return deepClone(fresh);
  } catch (err) {
    console.error("Failed to load active character:", err);
    return createDefaultCharacter("");
  }
}

// Salva os dados da ficha atual no roster
export function saveCharacter(charData) {
  try {
    if (!charData || typeof charData !== "object") {
      throw new Error("Invalid character object provided to saveCharacter.");
    }

    if (!charData.id) {
      charData.id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    charData.updatedAt = new Date().toISOString();
    const roster = loadRoster();
    const index = roster.findIndex(c => c.id === charData.id);

    if (index >= 0) {
      roster[index] = charData;
    } else {
      roster.push(charData);
    }

    saveRoster(roster);
    setActiveCharacterId(charData.id);

    // Salva também na chave legada por compatibilidade
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charData));
    } catch {}

    const electron = getElectronAPI();
    if (electron) {
      electron.saveCharacter(charData).catch(err => {
        console.error("[Storage] Native saveCharacter error:", err);
      });
    }

    return { success: true, timestamp: charData.updatedAt };
  } catch (err) {
    console.error("Failed to save character to localStorage:", err);
    return { success: false, error: err.message };
  }
}

// Cria uma nova ficha na lista
export function createCharacterInRoster(nameOrAlias) {
  const newChar = createDefaultCharacter(nameOrAlias || "Novo Runner");
  const roster = loadRoster();
  roster.push(newChar);
  saveRoster(roster);
  setActiveCharacterId(newChar.id);
  saveCharacter(newChar);
  return newChar;
}

// Duplica uma ficha existente com um novo ID
export function duplicateCharacterInRoster(charId) {
  const roster = loadRoster();
  const source = roster.find(c => c.id === charId);
  if (!source) {
    throw new Error("Ficha de origem não encontrada para duplicação.");
  }

  // Cópia profunda dos dados
  const copy = JSON.parse(JSON.stringify(source));
  copy.id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const currentAlias = copy.character?.alias || copy.character?.name || "Runner";
  copy.character.alias = `${currentAlias} (Cópia)`;
  copy.character.name = copy.character.alias;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();

  // Gera novos IDs para as qualidades da cópia
  if (Array.isArray(copy.qualities)) {
    copy.qualities = copy.qualities.map((q, i) => ({
      ...q,
      id: `q_dup_${Date.now()}_${i}`
    }));
  }

  roster.push(copy);
  saveRoster(roster);
  return copy;
}

// Remove uma ficha da lista pelo ID
export function deleteCharacterFromRoster(charId) {
  let roster = loadRoster();
  const activeId = getActiveCharacterId();
  
  roster = roster.filter(c => c.id !== charId);

  if (roster.length === 0) {
    const fresh = createDefaultCharacter("Novo Runner");
    roster.push(fresh);
  }

  saveRoster(roster);

  const electron = getElectronAPI();
  if (electron) {
    electron.deleteCharacter(charId).catch(console.error);
  }

  let newActiveId = activeId;
  if (activeId === charId) {
    newActiveId = roster[0].id;
    setActiveCharacterId(newActiveId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster[0]));
    } catch {}
  }

  return {
    success: true,
    deletedId: charId,
    activeId: newActiveId,
    roster
  };
}

// Cria uma cópia de segurança antes de alterações grandes
export function backupCharacter(charData) {
  try {
    const name = (charData?.character?.alias || charData?.character?.name || "runner")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");
    const key = `${STORAGE_BACKUP_PREFIX}${name}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(charData));
    return key;
  } catch (err) {
    console.warn("Could not save backup snapshot:", err);
    return null;
  }
}

// Limpa os dados de fichas do localStorage
export function clearLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_ROSTER_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
    desktopRosterCache = null;
    currentActiveId = null;
    return true;
  } catch (err) {
    console.error("Failed to clear local storage:", err);
    return false;
  }
}

// Verifica se existem dados salvos no navegador
export function hasSavedData() {
  try {
    return !!(localStorage.getItem(STORAGE_ROSTER_KEY) || localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

// Carrega o tema salvo do localStorage ou do Desktop
export function loadSavedTheme() {
  const electron = getElectronAPI();
  if (electron && electron.initialState && electron.initialState.settings) {
    const s = electron.initialState.settings;
    if (s.themeId) {
      return {
        id: s.themeId || DEFAULT_THEME_ID,
        customHex: s.themeCustomHex || null
      };
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_THEME_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        return {
          id: data.id || DEFAULT_THEME_ID,
          customHex: data.customHex || null
        };
      }
    }
  } catch (err) {
    console.error("Failed to load saved theme:", err);
  }
  return { id: DEFAULT_THEME_ID, customHex: null };
}

// Salva o tema escolhido no localStorage e no Desktop
export function saveThemeSetting(themeId, customHex = null) {
  try {
    const data = { id: themeId, customHex };
    localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(data));

    const electron = getElectronAPI();
    if (electron) {
      electron.saveSettings({ themeId, themeCustomHex: customHex }).catch(console.error);
    }
  } catch (err) {
    console.error("Failed to save theme:", err);
  }
}
