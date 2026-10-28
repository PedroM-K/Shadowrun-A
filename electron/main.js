const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const StorageService = require("./storage-service");

// Ambiente de execução (desenvolvimento ou produção)
const isDev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";

let mainWindow = null;
let storageService = null;

function createWindow() {
  try {
    const customUserData = path.join(app.getPath("appData"), "Shadowrun Anarchy");
    app.setPath("userData", customUserData);
  } catch (err) {
    console.warn("Could not set custom userData path:", err);
  }

  storageService = new StorageService(app);

  const settings = storageService.loadSettings();
  const savedBounds = settings.windowBounds || {};

  const windowOptions = {
    width: savedBounds.width || 1280,
    height: savedBounds.height || 840,
    x: savedBounds.x !== undefined ? savedBounds.x : undefined,
    y: savedBounds.y !== undefined ? savedBounds.y : undefined,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#060a08",
    title: "TERMINAL CLANDESTINO DE GERENCIAMENTO DE RUNNER — Shadowrun: Anarchy",
    icon: path.join(__dirname, "..", "icons", "icon.ico"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Permite comunicação síncrona na inicialização
      devTools: isDev,
      webSecurity: true
    }
  };

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.removeMenu();
  mainWindow.setMenu(null);
  Menu.setApplicationMenu(null);

  if (savedBounds.isMaximized) {
    mainWindow.maximize();
  }

  // Exibe a janela apenas quando o conteúdo estiver pronto
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Salva tamanho e posição da janela
  const saveBounds = () => {
    if (!mainWindow) return;
    try {
      const isMaximized = mainWindow.isMaximized();
      if (!isMaximized) {
        const bounds = mainWindow.getBounds();
        storageService.saveSettings({
          windowBounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            isMaximized: false
          }
        });
      } else {
        storageService.saveSettings({
          windowBounds: { isMaximized: true }
        });
      }
    } catch (err) {
      console.warn("[Main] Failed to save window bounds:", err);
    }
  };

  mainWindow.on("resize", saveBounds);
  mainWindow.on("move", saveBounds);
  mainWindow.on("close", saveBounds);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Impede navegação para links externos dentro da janela principal
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Carrega a página principal
  const indexPath = path.join(__dirname, "..", "index.html");
  mainWindow.loadFile(indexPath);

  setupApplicationMenu();
}

function setupApplicationMenu() {
  const isMac = process.platform === "darwin";

  if (!isMac) {
    Menu.setApplicationMenu(null);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeMenu();
      mainWindow.setMenu(null);
    }
    setupKeyboardShortcuts();
    return;
  }

  const template = [
    { role: "appMenu" },
    {
      label: "Arquivo",
      submenu: [
        {
          label: "Nova Ficha",
          accelerator: "CmdOrCtrl+N",
          click: () => sendActionToRenderer("new-sheet")
        },
        {
          label: "Salvar Ficha",
          accelerator: "CmdOrCtrl+S",
          click: () => sendActionToRenderer("save-sheet")
        },
        {
          label: "Gerenciar Fichas",
          accelerator: "CmdOrCtrl+M",
          click: () => sendActionToRenderer("manage-sheets")
        },
        { type: "separator" },
        {
          label: "Exportar Ficha JSON...",
          accelerator: "CmdOrCtrl+E",
          click: () => sendActionToRenderer("export-sheet")
        },
        {
          label: "Importar Ficha JSON...",
          accelerator: "CmdOrCtrl+O",
          click: () => sendActionToRenderer("import-sheet")
        },
        {
          label: "Exportar Ficha para PDF / Imprimir...",
          accelerator: "CmdOrCtrl+P",
          click: () => handlePrintToPDF()
        },
        { type: "separator" },
        {
          label: "Backup Completo do Terminal...",
          accelerator: "CmdOrCtrl+Shift+B",
          click: () => handleExportBackup()
        },
        {
          label: "Restaurar Backup...",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => handleRestoreBackup()
        },
        {
          label: "Abrir Pasta de Dados...",
          click: () => handleOpenAppDataFolder()
        },
        { type: "separator" },
        { role: "close", label: "Sair" }
      ]
    },
    {
      label: "Matriz",
      submenu: [
        {
          label: "Rolar D6 Matrix",
          accelerator: "CmdOrCtrl+D",
          click: () => sendActionToRenderer("roll-dice")
        },
        {
          label: "Calibragem Cromática (Tema)",
          accelerator: "CmdOrCtrl+T",
          click: () => sendActionToRenderer("open-theme")
        }
      ]
    },
    {
      label: "Visualizar",
      submenu: [
        { role: "reload", label: "Recarregar Terminal" },
        { role: "forceReload", label: "Forçar Recarga" },
        ...(isDev ? [{ role: "toggleDevTools", label: "Ferramentas de Desenvolvedor" }] : []),
        { type: "separator" },
        { role: "resetZoom", label: "Tamanho Padrão (100%)" },
        { role: "zoomIn", label: "Aumentar Zoom" },
        { role: "zoomOut", label: "Diminuir Zoom" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Alternar Tela Cheia" }
      ]
    },
    {
      label: "Ajuda",
      submenu: [
        {
          label: "Pasta de Armazenamento Local",
          click: () => handleOpenAppDataFolder()
        },
        {
          label: "Sobre Terminal Clandestino de Gerenciamento de Runner",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Terminal Clandestino de Gerenciamento de Runner",
              message: "Terminal Clandestino de Gerenciamento de Runner\nShadowrun: Anarchy — Gerenciador de Fichas",
              detail: `Versão Desktop: 1.0.0\nDesenvolvido por Pedro Moreira de Souza\n© 2026 Pedro Moreira de Souza. Direitos reservados aos respectivos titulares.\n\nNode: ${process.versions.node} | Electron: ${process.versions.electron}\nArmazenamento Local: ${storageService.dataDir}\n\nProjeto amador independente sem fins comerciais de apoio ao RPG.\nShadowrun é marca registrada de The Topps Company, Inc. e Catalyst Game Labs.\nConsulte LICENSE.md e THIRD-PARTY-NOTICES.md para termos de uso e licenças de terceiros.`,
              buttons: ["OK"]
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupKeyboardShortcuts() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    const isCtrl = !!(input.control || input.meta);
    const key = (input.key || "").toLowerCase();

    if (isCtrl && key === "s") {
      event.preventDefault();
      sendActionToRenderer("save-sheet");
    } else if (isCtrl && key === "n") {
      event.preventDefault();
      sendActionToRenderer("new-sheet");
    } else if (isCtrl && key === "m") {
      event.preventDefault();
      sendActionToRenderer("manage-sheets");
    } else if (isCtrl && key === "e") {
      event.preventDefault();
      sendActionToRenderer("export-sheet");
    } else if (isCtrl && key === "o") {
      event.preventDefault();
      sendActionToRenderer("import-sheet");
    } else if (isCtrl && key === "d") {
      event.preventDefault();
      sendActionToRenderer("roll-dice");
    } else if (isCtrl && key === "t") {
      event.preventDefault();
      sendActionToRenderer("open-theme");
    } else if (isCtrl && key === "p") {
      event.preventDefault();
      handlePrintToPDF();
    } else if (input.key === "F11") {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    } else if (input.key === "F5" || (isCtrl && key === "r")) {
      event.preventDefault();
      mainWindow.reload();
    } else if (isDev && ((isCtrl && input.shift && key === "i") || input.key === "F12")) {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
    }
  });
}

function sendActionToRenderer(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("menu:action", action);
  }
}

// Caixas de diálogo nativas
async function handleExportCharacter(charData) {
  if (!mainWindow) return { success: false, error: "No window" };
  const alias = charData?.character?.alias || charData?.character?.name || "runner";
  const safeFilename = alias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-");

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Exportar Ficha de Runner (JSON)",
    defaultPath: `${safeFilename || "runner"}.json`,
    filters: [
      { name: "Arquivo JSON de Ficha", extensions: ["json"] },
      { name: "Todos os Arquivos", extensions: ["*"] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    storageService.atomicWriteJson(filePath, charData);
    return { success: true, filePath, filename: path.basename(filePath) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleImportCharacter() {
  if (!mainWindow) return { success: false, error: "No window" };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Importar Ficha de Runner (JSON)",
    properties: ["openFile"],
    filters: [
      { name: "Arquivos JSON", extensions: ["json"] },
      { name: "Todos os Arquivos", extensions: ["*"] }
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const raw = fs.readFileSync(filePaths[0], "utf8");
    const parsed = JSON.parse(raw);
    return { success: true, data: parsed, filename: path.basename(filePaths[0]) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleExportBackup() {
  if (!mainWindow) return { success: false, error: "No window" };
  const dateStr = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Criar Backup Completo — Terminal Clandestino (JSON)",
    defaultPath: `shadowrun-anarchy-backup-${dateStr}.json`,
    filters: [
      { name: "Backup de Fichas JSON", extensions: ["json"] },
      { name: "Todos os Arquivos", extensions: ["*"] }
    ]
  });

  if (canceled || !filePath) return { success: false, canceled: true };
  return storageService.exportFullBackup(filePath);
}

async function handleRestoreBackup() {
  if (!mainWindow) return { success: false, error: "No window" };
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "Restaurar Backup Completo de Fichas (JSON)",
    properties: ["openFile"],
    filters: [
      { name: "Backup de Fichas JSON", extensions: ["json"] },
      { name: "Todos os Arquivos", extensions: ["*"] }
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) return { success: false, canceled: true };

  const confirm = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "Confirmar Restauração de Backup",
    message: "Deseja restaurar as fichas deste arquivo de backup?",
    detail: "Uma cópia de segurança automática do seu estado atual será criada em data/backups/ antes da restauração.",
    buttons: ["Restaurar Backup", "Cancelar"],
    defaultId: 0,
    cancelId: 1
  });

  if (confirm.response !== 0) return { success: false, canceled: true };

  const res = storageService.restoreBackup(filePaths[0]);
  if (res.success) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Restauração Concluída",
      message: `Backup restaurado com sucesso! ${res.count} fichas carregadas.`,
      buttons: ["OK"]
    });
    // Notifica a interface para recarregar o estado
    sendActionToRenderer("backup-restored");
  }
  return res;
}

function handleOpenAppDataFolder() {
  if (storageService) {
    shell.openPath(storageService.dataDir);
  }
}

async function handlePrintToPDF() {
  if (!mainWindow) return;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Exportar Ficha para Documento PDF",
    defaultPath: "ficha-shadowrun.pdf",
    filters: [
      { name: "Documento PDF", extensions: ["pdf"] }
    ]
  });

  if (canceled || !filePath) return;

  try {
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true
    });
    fs.writeFileSync(filePath, data);
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "PDF Gerado com Sucesso",
      message: `A ficha foi exportada para PDF com sucesso!\nArquivo: ${path.basename(filePath)}`,
      buttons: ["Abrir Arquivo", "Concluído"],
      defaultId: 0
    }).then(res => {
      if (res.response === 0) {
        shell.openPath(filePath);
      }
    });
  } catch (err) {
    dialog.showErrorBox("Erro ao Exportar PDF", err.message);
  }
}

// Comunicação IPC com o renderizador
ipcMain.on("storage:getInitialStateSync", (event) => {
  if (!storageService) {
    storageService = new StorageService(app);
  }
  const roster = storageService.loadRoster();
  const activeId = storageService.getActiveCharacterId();
  const settings = storageService.loadSettings();
  const appInfo = {
    name: app.getName(),
    version: app.getVersion(),
    dataDir: storageService.dataDir,
    userData: storageService.userData,
    isDesktop: true
  };
  event.returnValue = { roster, activeId, settings, appInfo };
});

ipcMain.handle("app:getInfo", () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    author: "Pedro Moreira de Souza",
    copyright: "© 2026 Pedro Moreira de Souza. Direitos reservados aos respectivos titulares.",
    dataDir: storageService.dataDir,
    userData: storageService.userData,
    isDesktop: true
  };
});

ipcMain.handle("storage:loadRoster", () => {
  return storageService.loadRoster();
});

ipcMain.handle("storage:saveCharacter", (_event, charData) => {
  return storageService.saveCharacter(charData);
});

ipcMain.handle("storage:saveRoster", (_event, roster) => {
  return storageService.saveRoster(roster);
});

ipcMain.handle("storage:deleteCharacter", (_event, charId) => {
  return storageService.deleteCharacter(charId);
});

ipcMain.handle("storage:setActiveId", (_event, id) => {
  return storageService.setActiveCharacterId(id);
});

ipcMain.handle("storage:saveSettings", (_event, updates) => {
  return storageService.saveSettings(updates);
});

ipcMain.handle("dialog:exportCharacter", (_event, charData) => {
  return handleExportCharacter(charData);
});

ipcMain.handle("dialog:importCharacter", () => {
  return handleImportCharacter();
});

ipcMain.handle("dialog:exportBackup", () => {
  return handleExportBackup();
});

ipcMain.handle("dialog:restoreBackup", () => {
  return handleRestoreBackup();
});

ipcMain.handle("system:openAppDataFolder", () => {
  handleOpenAppDataFolder();
  return { success: true };
});

ipcMain.handle("system:printToPDF", () => {
  return handlePrintToPDF();
});

ipcMain.handle("system:openLicense", () => {
  const licensePath = path.join(__dirname, "..", "LICENSE.md");
  if (fs.existsSync(licensePath)) {
    shell.openPath(licensePath);
    return { success: true };
  }
  return { success: false, error: "Arquivo LICENSE.md não encontrado." };
});

ipcMain.handle("system:openThirdPartyNotices", () => {
  const noticesPath = path.join(__dirname, "..", "THIRD-PARTY-NOTICES.md");
  if (fs.existsSync(noticesPath)) {
    shell.openPath(noticesPath);
    return { success: true };
  }
  return { success: false, error: "Arquivo THIRD-PARTY-NOTICES.md não encontrado." };
});

// Ciclo de vida da aplicação
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
