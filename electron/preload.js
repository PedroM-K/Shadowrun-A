const { contextBridge, ipcRenderer } = require("electron");

// Carrega os dados iniciais antes da tela renderizar
let initialState = null;
try {
  initialState = ipcRenderer.sendSync("storage:getInitialStateSync");
} catch (err) {
  console.error("[Preload] Failed to get synchronous initial state:", err);
}

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  initialState,

  getAppInfo: () => ipcRenderer.invoke("app:getInfo"),
  loadRoster: () => ipcRenderer.invoke("storage:loadRoster"),
  saveCharacter: (charData) => ipcRenderer.invoke("storage:saveCharacter", charData),
  saveRoster: (roster) => ipcRenderer.invoke("storage:saveRoster", roster),
  deleteCharacter: (charId) => ipcRenderer.invoke("storage:deleteCharacter", charId),
  setActiveId: (id) => ipcRenderer.invoke("storage:setActiveId", id),
  saveSettings: (settings) => ipcRenderer.invoke("storage:saveSettings", settings),

  exportCharacter: (charData) => ipcRenderer.invoke("dialog:exportCharacter", charData),
  importCharacter: () => ipcRenderer.invoke("dialog:importCharacter"),
  exportBackup: () => ipcRenderer.invoke("dialog:exportBackup"),
  restoreBackup: () => ipcRenderer.invoke("dialog:restoreBackup"),

  openAppDataFolder: () => ipcRenderer.invoke("system:openAppDataFolder"),
  openLicense: () => ipcRenderer.invoke("system:openLicense"),
  openThirdPartyNotices: () => ipcRenderer.invoke("system:openThirdPartyNotices"),
  printToPDF: () => ipcRenderer.invoke("system:printToPDF"),

  onMenuAction: (callback) => {
    const handler = (_event, action) => {
      if (typeof callback === "function") {
        callback(action);
      }
    };
    ipcRenderer.on("menu:action", handler);
    return () => ipcRenderer.removeListener("menu:action", handler);
  }
});
