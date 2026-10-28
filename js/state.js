// Gerenciamento de estado da aplicação e salvamento automático

import {
  loadCharacter,
  saveCharacter,
  backupCharacter,
  loadRoster,
  getActiveCharacterId,
  setActiveCharacterId,
  createCharacterInRoster,
  duplicateCharacterInRoster,
  deleteCharacterFromRoster
} from "./storage.js";
import { createDefaultCharacter } from "./constants.js";
import { calculateDerivedStats } from "./rules.js";

class CharacterStore {
  constructor() {
    this.character = null;
    this.listeners = new Set();
    this.saveTimeout = null;
    this.isDirty = false;
    this.lastSaved = null;
  }

  init() {
    this.character = loadCharacter();
    this.notify();
    return this.character;
  }

  get() {
    return this.character;
  }

  getRoster() {
    return loadRoster();
  }

  getActiveId() {
    return this.character?.id || getActiveCharacterId();
  }

  getDerived() {
    return calculateDerivedStats(this.character);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(eventMeta = {}) {
    const derived = this.getDerived();
    for (const listener of this.listeners) {
      try {
        listener(this.character, derived, eventMeta);
      } catch (err) {
        console.error("Error in state subscriber:", err);
      }
    }
  }

  set(newCharData, triggerSave = true) {
    this.character = newCharData;
    this.notify({ type: "full_replace" });
    if (triggerSave) {
      this.triggerAutoSave();
    }
  }

  update(mutationFn, triggerSave = true, meta = { type: "mutation" }) {
    if (typeof mutationFn === "function") {
      mutationFn(this.character);
    }
    this.notify(meta);
    if (triggerSave) {
      this.triggerAutoSave();
    }
  }

  triggerAutoSave() {
    this.isDirty = true;
    this.notifySaveStatus("saving");

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      const res = saveCharacter(this.character);
      if (res.success) {
        this.isDirty = false;
        this.lastSaved = new Date();
        this.notifySaveStatus("saved");
      } else {
        this.notifySaveStatus("error");
      }
    }, 350); // Aguarda 350ms antes de salvar para não engasgar a digitação
  }

  forceSaveNow() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    const res = saveCharacter(this.character);
    if (res.success) {
      this.isDirty = false;
      this.lastSaved = new Date();
      this.notifySaveStatus("saved");
    } else {
      this.notifySaveStatus("error");
    }
    return res;
  }

  notifySaveStatus(status) {
    window.dispatchEvent(
      new CustomEvent("sr:savestatus", {
        detail: { status, timestamp: this.lastSaved }
      })
    );
  }

  // Troca a ficha ativa pelo ID
  switchCharacter(charId) {
    if (this.character && this.character.id === charId) {
      return this.character;
    }
    // Salva a ficha atual antes de trocar
    this.forceSaveNow();

    setActiveCharacterId(charId);
    this.character = loadCharacter();
    this.notify({ type: "switch_character", characterId: charId });
    return this.character;
  }

  // Cria uma nova ficha e define como ativa
  createCharacter(nameOrAlias = "Novo Runner") {
    // Salva a ficha atual primeiro
    this.forceSaveNow();

    const newChar = createCharacterInRoster(nameOrAlias);
    this.character = newChar;
    this.notify({ type: "roster_change", action: "create", characterId: newChar.id });
    return newChar;
  }

  // Duplica uma ficha e seleciona a cópia
  duplicateCharacter(charId, switchToCopy = true) {
    // Salva a ficha atual primeiro
    this.forceSaveNow();

    const targetId = charId || this.character?.id;
    const copy = duplicateCharacterInRoster(targetId);
    if (switchToCopy) {
      setActiveCharacterId(copy.id);
      this.character = copy;
      saveCharacter(copy);
    }
    this.notify({ type: "roster_change", action: "duplicate", characterId: copy.id });
    return copy;
  }

  // Remove uma ficha da lista
  deleteCharacter(charId) {
    const targetId = charId || this.character?.id;
    const result = deleteCharacterFromRoster(targetId);
    if (this.character && this.character.id === targetId) {
      this.character = loadCharacter();
    }
    this.notify({ type: "roster_change", action: "delete", characterId: targetId });
    return result;
  }

  resetToDefault() {
    if (this.character) {
      backupCharacter(this.character);
    }
    const fresh = createDefaultCharacter("Novo Runner");
    saveCharacter(fresh);
    this.character = fresh;
    this.notify({ type: "full_replace" });
    return fresh;
  }
}

export const store = new CharacterStore();
if (typeof window !== "undefined") {
  window.SRA_STORE = store;
  window.SRA_STATE = store;
}
