const fs = require("fs");
const path = require("path");

class StorageService {
  constructor(app) {
    this.app = app;
    this.userData = app.getPath("userData");
    this.dataDir = path.join(this.userData, "data");
    this.charsDir = path.join(this.dataDir, "characters");
    this.backupsDir = path.join(this.dataDir, "backups");
    this.rosterFile = path.join(this.dataDir, "roster.json");
    this.settingsFile = path.join(this.dataDir, "settings.json");
    this.maxBackups = 20;

    this.initDirectories();
  }

  initDirectories() {
    try {
      if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
      if (!fs.existsSync(this.charsDir)) fs.mkdirSync(this.charsDir, { recursive: true });
      if (!fs.existsSync(this.backupsDir)) fs.mkdirSync(this.backupsDir, { recursive: true });
    } catch (err) {
      console.error("[StorageService] Error initializing directories:", err);
    }
  }

  // Gravação atômica com arquivo temporário para evitar corrupção de dados
  atomicWriteJson(filePath, data) {
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(tmpPath, jsonString, "utf8");
      // No Windows, se houver bloqueio temporário no arquivo, tenta copiar e remover o temporário
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        fs.renameSync(tmpPath, filePath);
      } catch (renameErr) {
        fs.copyFileSync(tmpPath, filePath);
        fs.unlinkSync(tmpPath);
      }
      return true;
    } catch (err) {
      console.error(`[StorageService] Failed atomic write to ${filePath}:`, err);
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
      throw err;
    }
  }

  safeReadJson(filePath, fallback = null) {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const content = fs.readFileSync(filePath, "utf8");
      if (!content || !content.trim()) return fallback;
      return JSON.parse(content);
    } catch (err) {
      console.error(`[StorageService] Error reading JSON from ${filePath}:`, err);
      return fallback;
    }
  }

  // Configurações
  loadSettings() {
    return this.safeReadJson(this.settingsFile, {
      activeCharacterId: null,
      themeId: "matrix",
      themeCustomHex: null,
      windowBounds: null,
      crtScanlines: true,
      matrixRain: true
    });
  }

  saveSettings(updates) {
    try {
      const current = this.loadSettings();
      const updated = { ...current, ...updates };
      this.atomicWriteJson(this.settingsFile, updated);
      return updated;
    } catch (err) {
      console.error("[StorageService] Failed to save settings:", err);
      return null;
    }
  }

  // ID do personagem ativo
  getActiveCharacterId() {
    const settings = this.loadSettings();
    if (settings && settings.activeCharacterId) {
      return settings.activeCharacterId;
    }
    const roster = this.loadRoster();
    if (roster && roster.length > 0) {
      return roster[0].id;
    }
    return null;
  }

  setActiveCharacterId(id) {
    return this.saveSettings({ activeCharacterId: id });
  }

  // Carrega todas as fichas salvas
  loadRoster() {
    try {
      const rosterIndex = this.safeReadJson(this.rosterFile, null);
      const chars = [];

      if (Array.isArray(rosterIndex) && rosterIndex.length > 0) {
        for (const item of rosterIndex) {
          const charId = typeof item === "string" ? item : item.id;
          if (!charId) continue;
          const charFile = path.join(this.charsDir, `${charId}.json`);
          const charData = this.safeReadJson(charFile, null);
          if (charData) {
            chars.push(charData);
          }
        }
      }

      // Se o índice estiver vazio, lê os arquivos .json encontrados na pasta
      if (chars.length === 0 && fs.existsSync(this.charsDir)) {
        const files = fs.readdirSync(this.charsDir).filter(f => f.endsWith(".json"));
        for (const file of files) {
          const fullPath = path.join(this.charsDir, file);
          const charData = this.safeReadJson(fullPath, null);
          if (charData && charData.id) {
            chars.push(charData);
          }
        }
      }

      return chars;
    } catch (err) {
      console.error("[StorageService] Error loading roster:", err);
      return [];
    }
  }

  // Salva uma ficha e atualiza o índice
  saveCharacter(charData) {
    try {
      if (!charData || typeof charData !== "object") {
        throw new Error("Invalid character object provided to saveCharacter.");
      }

      if (!charData.id) {
        charData.id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      charData.updatedAt = new Date().toISOString();
      const charFilePath = path.join(this.charsDir, `${charData.id}.json`);

      // Grava o arquivo da ficha
      this.atomicWriteJson(charFilePath, charData);

      // Atualiza o índice do elenco
      const rosterIndex = this.safeReadJson(this.rosterFile, []) || [];
      const index = rosterIndex.findIndex(c => (typeof c === "string" ? c : c.id) === charData.id);
      const summary = {
        id: charData.id,
        alias: charData.character?.alias || charData.character?.name || "Runner",
        name: charData.character?.name || "",
        metatype: charData.character?.metatype || "Human",
        archetype: charData.character?.archetype || "",
        updatedAt: charData.updatedAt
      };

      if (index >= 0) {
        rosterIndex[index] = summary;
      } else {
        rosterIndex.push(summary);
      }

      this.atomicWriteJson(this.rosterFile, rosterIndex);
      this.setActiveCharacterId(charData.id);

      return { success: true, timestamp: charData.updatedAt, id: charData.id };
    } catch (err) {
      console.error("[StorageService] Error saving character:", err);
      return { success: false, error: err.message };
    }
  }

  // Salva todas as fichas do elenco
  saveRoster(rosterArray) {
    try {
      if (!Array.isArray(rosterArray)) {
        throw new Error("Roster must be an array.");
      }

      const summaries = [];
      for (const charData of rosterArray) {
        if (!charData.id) {
          charData.id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
        charData.updatedAt = charData.updatedAt || new Date().toISOString();
        const charFilePath = path.join(this.charsDir, `${charData.id}.json`);
        this.atomicWriteJson(charFilePath, charData);

        summaries.push({
          id: charData.id,
          alias: charData.character?.alias || charData.character?.name || "Runner",
          name: charData.character?.name || "",
          metatype: charData.character?.metatype || "Human",
          archetype: charData.character?.archetype || "",
          updatedAt: charData.updatedAt
        });
      }

      this.atomicWriteJson(this.rosterFile, summaries);
      return { success: true, count: rosterArray.length };
    } catch (err) {
      console.error("[StorageService] Error saving roster:", err);
      return { success: false, error: err.message };
    }
  }

  // Exclui uma ficha e remove do índice
  deleteCharacter(charId) {
    try {
      const charFilePath = path.join(this.charsDir, `${charId}.json`);
      if (fs.existsSync(charFilePath)) {
        fs.unlinkSync(charFilePath);
      }

      let rosterIndex = this.safeReadJson(this.rosterFile, []) || [];
      rosterIndex = rosterIndex.filter(c => (typeof c === "string" ? c : c.id) !== charId);
      this.atomicWriteJson(this.rosterFile, rosterIndex);

      const activeId = this.getActiveCharacterId();
      let newActiveId = activeId;
      if (activeId === charId) {
        newActiveId = rosterIndex.length > 0 ? (rosterIndex[0].id || rosterIndex[0]) : null;
        this.setActiveCharacterId(newActiveId);
      }

      return { success: true, deletedId: charId, activeId: newActiveId };
    } catch (err) {
      console.error("[StorageService] Error deleting character:", err);
      return { success: false, error: err.message };
    }
  }

  // Cria backup automático rotativo em data/backups/
  createAutoBackup(tag = "snapshot") {
    try {
      const roster = this.loadRoster();
      const settings = this.loadSettings();
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFilename = `backup_${tag}_${dateStr}.json`;
      const backupPath = path.join(this.backupsDir, backupFilename);

      const bundle = {
        schema: "sra-desktop-backup",
        version: 1,
        createdAt: new Date().toISOString(),
        settings,
        roster
      };

      this.atomicWriteJson(backupPath, bundle);

      // Mantém apenas os backups mais recentes
      this.pruneOldBackups();

      return { success: true, filename: backupFilename, path: backupPath };
    } catch (err) {
      console.warn("[StorageService] Auto-backup warning:", err);
      return { success: false, error: err.message };
    }
  }

  pruneOldBackups() {
    try {
      const files = fs.readdirSync(this.backupsDir)
        .filter(f => f.startsWith("backup_") && f.endsWith(".json"))
        .map(f => ({
          name: f,
          path: path.join(this.backupsDir, f),
          time: fs.statSync(path.join(this.backupsDir, f)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups);
        for (const file of toDelete) {
          try { fs.unlinkSync(file.path); } catch {}
        }
      }
    } catch (err) {
      console.warn("[StorageService] Failed to prune old backups:", err);
    }
  }

  // Exporta backup completo das fichas
  exportFullBackup(destPath) {
    try {
      const roster = this.loadRoster();
      const settings = this.loadSettings();
      const bundle = {
        schema: "sra-desktop-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        roster
      };
      this.atomicWriteJson(destPath, bundle);
      return { success: true, path: destPath, count: roster.length };
    } catch (err) {
      console.error("[StorageService] Failed to export backup:", err);
      return { success: false, error: err.message };
    }
  }

  // Restaura backup a partir de um arquivo
  restoreFullBackup(sourcePath) {
    try {
      const raw = fs.readFileSync(sourcePath, "utf8");
      const bundle = JSON.parse(raw);

      if (!bundle || (!Array.isArray(bundle.roster) && !Array.isArray(bundle))) {
        throw new Error("Formato de backup inválido. Não foi possível encontrar a lista de fichas.");
      }

      // Cria cópia de segurança antes de restaurar
      this.createAutoBackup("pre-restore-safety");

      const rosterToRestore = Array.isArray(bundle.roster) ? bundle.roster : bundle;
      this.saveRoster(rosterToRestore);

      if (bundle.settings) {
        this.saveSettings(bundle.settings);
      }

      return { success: true, count: rosterToRestore.length };
    } catch (err) {
      console.error("[StorageService] Failed to restore backup:", err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = StorageService;
