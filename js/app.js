// Inicialização da aplicação, eventos, abas e modais

import { store } from "./state.js";
import { saveCharacter, loadSavedTheme, saveThemeSetting } from "./storage.js";
import {
  renderApp,
  renderSheetsModal,
  showToast,
  openDiceModal,
  closeDiceModal,
  executeModalRoll,
  initDiceModalListeners,
  applyTheme,
  renderThemeModal,
  openThemeModal,
  closeThemeModal,
  initCyberSelects,
  syncCyberSelect
} from "./ui.js";
import { exportCharacterToFile, readJsonFile, validateCharacterData, migrateCharacterData } from "./importer-exporter.js";
import { calculateSkillDicePool } from "./rules.js";
import {
  METATYPES,
  ATTRIBUTE_SKILL_PRESETS,
  OFFICIAL_SKILL_DESCRIPTIONS,
  getSkillDescription,
  OFFICIAL_SRA_WEAPONS,
  THEME_PRESETS,
  DEFAULT_THEME_ID,
  hexToRgb,
  LICENSE_TEXT,
  THIRD_PARTY_NOTICES_TEXT
} from "./constants.js";

// Estado do tema ativo e cache de cor para o efeito Matrix
let currentThemeConfig = { id: DEFAULT_THEME_ID, customHex: null };
let rainColorPrimary = "#00ff66";
let rainColorDim = "rgba(0, 255, 102, 0.65)";

function bootTerminal() {
  try {
    // Aplica o tema imediatamente para evitar piscar cores incorretas
    currentThemeConfig = loadSavedTheme();
    updateRainThemeColors(currentThemeConfig.id, currentThemeConfig.customHex);
    applyTheme(currentThemeConfig.id, currentThemeConfig.customHex);

    // Atualiza a interface quando o estado mudar
    store.subscribe((char, derived, eventMeta) => {
      renderApp(char, derived, eventMeta);
    });

    store.init();

    // Conecta navegação, cabeçalho, temas e eventos dos modais
    setupNavigation();
    setupHeaderAndDataControls();
    setupThemeControls();
    setupModals();
    setupDelegatedEvents();
    initCyberSelects();
    setupMatrixRain();
    registerServiceWorker();
    console.log("[SRA Terminal] Clandestine OS online and fully interactive.");
  } catch (err) {
    console.error("[SRA Terminal] Initialization error:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootTerminal);
} else {
  bootTerminal();
}

// Navegação do menu lateral e gaveta mobile
function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-link-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const workspace = document.querySelector(".terminal-workspace");
  const sidebar = document.getElementById("terminal-sidebar");
  const mobileToggle = document.getElementById("btn-mobile-nav");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const closeSidebarBtn = document.getElementById("btn-close-sidebar");

  const isMobileView = () => window.innerWidth <= 860;

  const closeMobileSidebar = () => {
    sidebar?.classList.remove("open");
    sidebarBackdrop?.classList.remove("active");
    mobileToggle?.classList.remove("is-active");
  };

  const openMobileSidebar = () => {
    sidebar?.classList.add("open");
    sidebarBackdrop?.classList.add("active");
    mobileToggle?.classList.add("is-active");
  };

  // Alterna o menu (no mobile abre a gaveta, no desktop recolhe a barra lateral)
  mobileToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isMobileView()) {
      if (sidebar?.classList.contains("open")) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    } else {
      const isCollapsed = workspace?.classList.toggle("sidebar-collapsed");
      mobileToggle?.classList.toggle("is-active", !!isCollapsed);
    }
  });

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      if (!targetTab) return;

      navButtons.forEach(b => {
        if (b.getAttribute("data-tab") === targetTab) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });

      tabPanes.forEach(p => p.classList.remove("active"));
      const targetPane = document.getElementById(`tab-${targetTab}`);
      if (targetPane) targetPane.classList.add("active");

      // Atualiza componentes ao alternar abas
      renderApp(store.get(), store.getDerived());

      if (isMobileView()) {
        closeMobileSidebar();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  closeSidebarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMobileSidebar();
  });

  sidebarBackdrop?.addEventListener("click", () => {
    closeMobileSidebar();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobileView()) {
      closeMobileSidebar();
    }
  });

  document.getElementById("btn-sidebar-sheets")?.addEventListener("click", () => {
    if (isMobileView()) {
      closeMobileSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileView()) {
      sidebar?.classList.remove("open");
      sidebarBackdrop?.classList.remove("active");
      const isCollapsed = workspace?.classList.contains("sidebar-collapsed");
      mobileToggle?.classList.toggle("is-active", !!isCollapsed);
    }
  });
}

// Controles do cabeçalho e gerenciamento de fichas
function setupHeaderAndDataControls() {
  const footerStatus = document.getElementById("footer-save-status");

  window.addEventListener("sr:savestatus", (e) => {
    if (!footerStatus) return;
    const { status, timestamp } = e.detail;

    if (status === "saving") {
      footerStatus.innerHTML = `<span>STATUS:</span><span class="led-indicator led-amber"></span><span style="color: var(--term-amber);">GRAVANDO...</span>`;
    } else if (status === "saved") {
      const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
      footerStatus.innerHTML = `<span>STATUS:</span><span class="led-indicator led-green"></span><span style="color: var(--text-bright);">SALVO ÀS ${timeStr}</span>`;
    } else if (status === "error") {
      footerStatus.innerHTML = `<span>STATUS:</span><span class="led-indicator led-red"></span><span style="color: var(--term-red);">ERRO AO GRAVAR</span>`;
    }
  });

  // Salvar ficha manualmente
  const handleSaveSheet = () => {
    const res = store.forceSaveNow();
    if (res.success) {
      const char = store.get();
      const alias = char.character?.alias || char.character?.name || "Runner";
      showToast(`FICHA SALVA COM SUCESSO // ${alias}`, "success");
      renderSheetsModal(store.getRoster(), store.getActiveId());
    } else {
      showToast("ERRO AO SALVAR FICHA LOCALMENTE", "error");
    }
  };
  document.getElementById("btn-header-save")?.addEventListener("click", handleSaveSheet);

  // Exportar ficha em JSON
  const triggerExport = async () => {
    const char = store.get();
    if (window.electronAPI && typeof window.electronAPI.exportCharacter === "function") {
      const res = await window.electronAPI.exportCharacter(char);
      if (res && res.success) {
        showToast(`EXPORT COMPLETO // ${res.filename}`, "success");
      } else if (res && !res.canceled && res.error) {
        showToast(`FALHA AO EXPORTAR: ${res.error}`, "error");
      }
      return;
    }
    const res = exportCharacterToFile(char);
    if (res.success) {
      showToast(`EXPORT COMPLETO // ${res.filename}`, "success");
    } else {
      showToast(`FALHA AO EXPORTAR: ${res.error}`, "error");
    }
  };

  document.getElementById("btn-header-export")?.addEventListener("click", triggerExport);
  document.getElementById("btn-modal-export")?.addEventListener("click", triggerExport);

  // Importar ficha em JSON
  const fileInput = document.getElementById("file-import-input");
  const triggerImportClick = async () => {
    if (window.electronAPI && typeof window.electronAPI.importCharacter === "function") {
      const res = await window.electronAPI.importCharacter();
      if (res && res.success && res.data) {
        try {
          const validation = validateCharacterData(res.data);
          if (!validation.valid) {
            showToast("JSON INVÁLIDO:\n" + validation.errors.join("\n"), "error");
            return;
          }
          const parsedData = migrateCharacterData(res.data);
          if (!parsedData.id) {
            parsedData.id = `char_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          }
          saveCharacter(parsedData);
          store.switchCharacter(parsedData.id);
          showToast(`RUNNER IMPORTADO // ${parsedData.character.alias || parsedData.character.name}`, "success");
        } catch (err) {
          showToast(`ERRO AO IMPORTAR: ${err.message}`, "error");
        }
      } else if (res && !res.canceled && res.error) {
        showToast(`ERRO AO IMPORTAR: ${res.error}`, "error");
      }
      return;
    }
    fileInput?.click();
  };

  document.getElementById("btn-header-import")?.addEventListener("click", triggerImportClick);
  document.getElementById("btn-modal-import")?.addEventListener("click", triggerImportClick);

  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const confirmed = window.confirm(
        "CONFIRMAR IMPORTAÇÃO DE FICHA:\n\nA ficha do arquivo será adicionada à sua coleção de fichas sem apagar suas outras fichas."
      );
      if (!confirmed) {
        fileInput.value = "";
        return;
      }

      const parsedData = await readJsonFile(file);
      if (!parsedData.id) {
        parsedData.id = `char_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      }
      saveCharacter(parsedData);
      store.switchCharacter(parsedData.id);
      showToast(`RUNNER IMPORTADO // ${parsedData.character.alias || parsedData.character.name}`, "success");
    } catch (err) {
      showToast(`ERRO: ${err.message}`, "error");
    } finally {
      fileInput.value = "";
    }
  });


  // Criar novo personagem
  const handleNewRunner = () => {
    const alias = window.prompt("CRIAR NOVA FICHA // Digite o nome ou Nom de Guerre do Runner:", "Novo Runner");
    if (alias !== null) {
      const newChar = store.createCharacter(alias.trim() || "Novo Runner");
      showToast(`NOVA FICHA CRIADA // ${newChar.character.alias || newChar.character.name}`, "success");
    }
  };


  // Abrir rolador de dados pelo cabeçalho
  document.getElementById("btn-header-dice")?.addEventListener("click", () => {
    openDiceModal({ title: "MATRIX D6 ROLLER", pool: 6 });
  });

  // Integrações com Desktop Windows (Electron)
  if (window.electronAPI && window.electronAPI.isDesktop) {
    // Ouvinte de atalhos e ações do Menu Nativo do Windows
    if (typeof window.electronAPI.onMenuAction === "function") {
      window.electronAPI.onMenuAction((action) => {
        if (action === "new-sheet") {
          handleNewRunner();
        } else if (action === "save-sheet") {
          handleSaveSheet();
        } else if (action === "manage-sheets") {
          document.getElementById("btn-header-sheets")?.click();
        } else if (action === "export-sheet") {
          triggerExport();
        } else if (action === "import-sheet") {
          triggerImportClick();
        } else if (action === "roll-dice") {
          document.getElementById("btn-header-dice")?.click();
        } else if (action === "open-theme") {
          document.getElementById("btn-header-theme")?.click();
        } else if (action === "backup-restored") {
          store.init();
          showToast("BACKUP RESTAURADO // DADOS ATUALIZADOS", "success");
        }
      });
    }
  }
}

// Controle dos modais (dados, fichas, fechar no fundo ou ESC)
function setupModals() {
  // Modal de rolagem de dados
  document.getElementById("btn-close-dice-modal")?.addEventListener("click", closeDiceModal);
  document.getElementById("btn-modal-roll-action")?.addEventListener("click", executeModalRoll);
  initDiceModalListeners();

  // Modal do gerenciador de fichas
  const sheetsModal = document.getElementById("modal-sheets-manager");
  const openSheetsModal = () => {
    if (sheetsModal) {
      renderSheetsModal(store.getRoster(), store.getActiveId());
      sheetsModal.classList.add("active");
      setTimeout(() => {
        document.getElementById("input-new-sheet-name")?.focus();
      }, 50);
    }
  };

  const closeSheetsModal = () => {
    sheetsModal?.classList.remove("active");
  };

  document.getElementById("btn-header-sheets")?.addEventListener("click", openSheetsModal);
  document.getElementById("btn-sidebar-sheets")?.addEventListener("click", openSheetsModal);
  document.getElementById("btn-close-sheets-modal")?.addEventListener("click", closeSheetsModal);

  // Botão criar nova ficha no modal
  document.getElementById("btn-modal-create-sheet")?.addEventListener("click", () => {
    const input = document.getElementById("input-new-sheet-name");
    const val = input ? input.value.trim() : "";
    const newChar = store.createCharacter(val || "Novo Runner");
    if (input) input.value = "";
    showToast(`NOVA FICHA CRIADA // ${newChar.character.alias || newChar.character.name}`, "success");
    renderSheetsModal(store.getRoster(), store.getActiveId());
  });

  document.getElementById("input-new-sheet-name")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btn-modal-create-sheet")?.click();
    }
  });

  // Ações nos cartões de ficha do modal (abrir, duplicar, excluir)
  sheetsModal?.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    if (target.id === "btn-modal-save-now") {
      const res = store.forceSaveNow();
      if (res.success) {
        showToast("FICHA SALVA COM SUCESSO", "success");
        renderSheetsModal(store.getRoster(), store.getActiveId());
      }
      return;
    }

    if (target.classList.contains("btn-open-sheet")) {
      const charId = target.getAttribute("data-id");
      if (charId) {
        store.switchCharacter(charId);
        const char = store.get();
        showToast(`FICHA ABERTA // ${char.character?.alias || char.character?.name}`, "success");
        closeSheetsModal();
      }
      return;
    }

    if (target.classList.contains("btn-duplicate-sheet")) {
      const charId = target.getAttribute("data-id");
      if (charId) {
        const copy = store.duplicateCharacter(charId, true);
        showToast(`FICHA DUPLICADA COM SUCESSO // ${copy.character?.alias}`, "success");
        renderSheetsModal(store.getRoster(), store.getActiveId());
      }
      return;
    }

    if (target.classList.contains("btn-delete-sheet")) {
      const charId = target.getAttribute("data-id");
      const roster = store.getRoster();
      const targetChar = roster.find(c => c.id === charId);
      const targetName = targetChar ? (targetChar.character?.alias || targetChar.character?.name || "Runner") : "este Runner";
      const confirmed = window.confirm(
        `CONFIRMAR EXCLUSÃO DA FICHA:\n\nDeseja excluir permanentemente a ficha "${targetName}"?\nEsta ação não poderá ser desfeita.`
      );
      if (confirmed && charId) {
        store.deleteCharacter(charId);
        showToast(`FICHA "${targetName}" EXCLUÍDA`, "info");
        renderSheetsModal(store.getRoster(), store.getActiveId());
      }
      return;
    }
  });


  // Modal de Sobre, Autoria e Licença
  const aboutModal = document.getElementById("modal-about-license");
  const openAboutBtn = document.getElementById("btn-open-about-modal");
  const closeAboutBtn = document.getElementById("btn-close-about-modal");
  const confirmAboutBtn = document.getElementById("btn-confirm-about-modal");

  const tabAboutSummary = document.getElementById("tab-btn-about-summary");
  const tabAboutLicense = document.getElementById("tab-btn-about-license");
  const tabAboutThirdParty = document.getElementById("tab-btn-about-thirdparty");

  const paneAboutSummary = document.getElementById("about-pane-summary");
  const paneAboutLicense = document.getElementById("about-pane-license");
  const paneAboutThirdParty = document.getElementById("about-pane-thirdparty");

  const licenseContent = document.getElementById("about-license-content");
  const thirdPartyContent = document.getElementById("about-thirdparty-content");

  if (licenseContent && typeof LICENSE_TEXT !== "undefined") {
    licenseContent.textContent = LICENSE_TEXT;
  }
  if (thirdPartyContent && typeof THIRD_PARTY_NOTICES_TEXT !== "undefined") {
    thirdPartyContent.textContent = THIRD_PARTY_NOTICES_TEXT;
  }

  // Ações exclusivas de Desktop
  if (window.electronAPI && window.electronAPI.isDesktop) {
    const desktopActions = document.getElementById("about-desktop-actions");
    if (desktopActions) desktopActions.style.display = "flex";

    document.getElementById("btn-open-license-file")?.addEventListener("click", () => {
      window.electronAPI.openLicense?.();
    });
    document.getElementById("btn-open-thirdparty-file")?.addEventListener("click", () => {
      window.electronAPI.openThirdPartyNotices?.();
    });
  }

  const switchAboutTab = (tab) => {
    tabAboutSummary?.classList.remove("active");
    tabAboutLicense?.classList.remove("active");
    tabAboutThirdParty?.classList.remove("active");

    if (paneAboutSummary) paneAboutSummary.style.display = "none";
    if (paneAboutLicense) paneAboutLicense.style.display = "none";
    if (paneAboutThirdParty) paneAboutThirdParty.style.display = "none";

    if (tab === "summary") {
      tabAboutSummary?.classList.add("active");
      if (paneAboutSummary) paneAboutSummary.style.display = "flex";
    } else if (tab === "license") {
      tabAboutLicense?.classList.add("active");
      if (paneAboutLicense) paneAboutLicense.style.display = "block";
    } else if (tab === "thirdparty") {
      tabAboutThirdParty?.classList.add("active");
      if (paneAboutThirdParty) paneAboutThirdParty.style.display = "block";
    }
  };

  tabAboutSummary?.addEventListener("click", () => switchAboutTab("summary"));
  tabAboutLicense?.addEventListener("click", () => switchAboutTab("license"));
  tabAboutThirdParty?.addEventListener("click", () => switchAboutTab("thirdparty"));

  const openAboutModal = () => {
    switchAboutTab("summary");
    aboutModal?.classList.add("active");
  };

  const closeAboutModal = () => {
    aboutModal?.classList.remove("active");
  };

  openAboutBtn?.addEventListener("click", openAboutModal);
  closeAboutBtn?.addEventListener("click", closeAboutModal);
  confirmAboutBtn?.addEventListener("click", closeAboutModal);

  // Fecha modais ao clicar no fundo ou apertar ESC
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.remove("active");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.active").forEach(m => m.classList.remove("active"));
    }
  });
}

// Eventos da ficha principal
function setupDelegatedEvents() {
  const mainDeck = document.querySelector(".terminal-main-deck");
  if (!mainDeck) return;

  // Campos de identificação do personagem
  document.querySelectorAll(".identity-field").forEach(input => {
    const handleSync = (e, isTyping) => {
      const field = e.target.getAttribute("data-field");
      if (field) {
        store.update(char => {
          const oldMetaKey = char.character.metatype || "Human";
          char.character[field] = e.target.value;
          // Se mudar o metatipo, ajusta a base e preserva os pontos investidos
          if (field === "metatype") {
            const oldMeta = METATYPES[oldMetaKey] || METATYPES.Human;
            const newMeta = METATYPES[e.target.value] || METATYPES.Human;
            if (newMeta) {
              const oldBase = oldMeta.base || {};
              const newBase = newMeta.base || {};
              const newLimits = newMeta.limits || {};

              ["str", "agi", "wil", "log", "cha"].forEach(k => {
                if (char.attributes[k]) {
                  const pointsInvested = Math.max(0, (char.attributes[k].base || oldBase[k] || 1) - (oldBase[k] || 1));
                  const min = newBase[k] || 1;
                  const max = newLimits[k] || 6;
                  char.attributes[k].base = Math.min(max, min + pointsInvested);
                }
              });

              if (char.attributes.edg) {
                const edgInvested = Math.max(0, (char.attributes.edg.base || oldBase.edg || 1) - (oldBase.edg || 1));
                const minEdg = newBase.edg || 1;
                const maxEdg = newLimits.edg || 6;
                char.attributes.edg.base = Math.min(maxEdg, minEdg + edgInvested);
                if (char.condition) {
                  char.condition.edgeCurrent = Math.min(char.attributes.edg.base, char.condition.edgeCurrent || 1);
                }
              }
            }
          }
        }, true, isTyping ? { isTyping: true, sourceTarget: e.target } : { type: "field_change" });
      }
    };
    input.addEventListener("input", (e) => {
      if (input.tagName.toLowerCase() !== "select") {
        handleSync(e, true);
      }
    });
    input.addEventListener("change", (e) => handleSync(e, false));
  });

  // Alterna abas de Karma (Total e Disponível)
  const btnKarmaTotal = document.getElementById("tab-btn-karma-total");
  const btnKarmaAvail = document.getElementById("tab-btn-karma-avail");
  const paneKarmaTotal = document.getElementById("pane-karma-total");
  const paneKarmaAvail = document.getElementById("pane-karma-avail");

  btnKarmaTotal?.addEventListener("click", () => {
    btnKarmaTotal.classList.add("active");
    btnKarmaAvail?.classList.remove("active");
    if (paneKarmaTotal) paneKarmaTotal.style.display = "block";
    if (paneKarmaAvail) paneKarmaAvail.style.display = "none";
    document.getElementById("char-totalKarma")?.focus();
  });

  btnKarmaAvail?.addEventListener("click", () => {
    btnKarmaAvail.classList.add("active");
    btnKarmaTotal?.classList.remove("active");
    if (paneKarmaAvail) paneKarmaAvail.style.display = "block";
    if (paneKarmaTotal) paneKarmaTotal.style.display = "none";
    document.getElementById("char-karma")?.focus();
  });

  // Pontos de Trama
  document.getElementById("btn-plot-dec")?.addEventListener("click", () => {
    store.update(char => {
      char.character.plotPoints = Math.max(0, (char.character.plotPoints || 0) - 1);
    });
  });
  document.getElementById("btn-plot-inc")?.addEventListener("click", () => {
    store.update(char => {
      const max = char.character.maxPlotPoints || 5;
      char.character.plotPoints = Math.min(max, (char.character.plotPoints || 0) + 1);
    });
  });

  // Adicionar lances e disposições
  document.getElementById("btn-add-cue")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.cues) char.cues = [];
      char.cues.push("");
    });
  });
  document.getElementById("btn-add-disp")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.dispositions) char.dispositions = [];
      char.dispositions.push("");
    });
  });

  // Curar todo o dano
  document.getElementById("btn-heal-all")?.addEventListener("click", () => {
    store.update(char => {
      char.condition.physicalDamage = 0;
      char.condition.stunDamage = 0;
      char.condition.armorDamage = 0;
    });
    showToast("VITAIS E ARMADURA RESTAURADOS", "success");
  });

  // Adicionar perícia de conhecimento
  document.getElementById("btn-add-ks")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.knowledgeSkills) char.knowledgeSkills = [];
      char.knowledgeSkills.push({ id: `ks_${Date.now()}`, name: "" });
    });
  });

  // Adicionar arma
  document.getElementById("btn-add-weapon")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.weapons) char.weapons = [];
      char.weapons.push({
        id: `wep_${Date.now()}`,
        name: "",
        damage: "",
        range: "",
        notes: ""
      });
    });
  });

  // Adicionar Shadow Amp
  document.getElementById("btn-add-amp")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.shadowAmps) char.shadowAmps = [];
      char.shadowAmps.push({
        id: `amp_${Date.now()}`,
        name: "",
        level: 1,
        essenceCost: 0,
        effect: ""
      });
    });
  });

  // Adicionar equipamentos, veículos ou contatos
  document.getElementById("btn-add-gear")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.gear) char.gear = [];
      char.gear.push({ id: `g_${Date.now()}`, name: "", qty: 1, notes: "" });
    });
  });

  document.getElementById("btn-add-contact")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.contacts) char.contacts = [];
      char.contacts.push({ id: `ct_${Date.now()}`, name: "", connection: 1, loyalty: 1, role: "", notes: "" });
    });
  });

  // Adicionar qualidade
  document.getElementById("btn-add-quality")?.addEventListener("click", () => {
    store.update(char => {
      if (!char.qualities) char.qualities = [];
      const posCount = char.qualities.filter(q => q.type === "positive").length;
      const negCount = char.qualities.filter(q => q.type === "negative").length;
      const defaultType = posCount < 2 ? "positive" : (negCount < 1 ? "negative" : "positive");
      char.qualities.push({
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: "",
        type: defaultType,
        effect: ""
      });
    });
  });

  // Campo de anotações
  document.getElementById("char-notes")?.addEventListener("input", (e) => {
    store.update(char => {
      char.notes = e.target.value;
    }, true, { isTyping: true, sourceTarget: e.target });
  });

  // Contador de Trunfo
  document.getElementById("btn-edge-dec")?.addEventListener("click", () => {
    store.update(char => {
      const cur = char.condition.edgeCurrent ?? 1;
      char.condition.edgeCurrent = Math.max(0, cur - 1);
    });
  });
  document.getElementById("btn-edge-inc")?.addEventListener("click", () => {
    store.update(char => {
      const maxEdge = char.attributes?.edg?.base ?? 6;
      const cur = char.condition.edgeCurrent ?? 1;
      char.condition.edgeCurrent = Math.min(maxEdge, cur + 1);
    });
  });

  // Fecha todos os menus dropdowns abertos
  function closeAllDropdowns(exceptEl = null) {
    document.querySelectorAll(".skills-category-header.is-dropdown-open").forEach(h => {
      if (!exceptEl || !h.contains(exceptEl)) h.classList.remove("is-dropdown-open");
    });
    document.querySelectorAll(".cyber-dropdown.is-open, .cyber-select-custom.is-open").forEach(d => {
      if (d !== exceptEl) {
        d.classList.remove("is-open");
        const trig = d.querySelector(".cyber-dropdown-trigger, .cyber-select-trigger");
        if (trig) trig.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Cliques fora fecham menus suspensos
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cyber-dropdown") && !e.target.closest(".cyber-select-custom")) {
      closeAllDropdowns();
    }
  });

  // Tecla ESC fecha menus suspensos
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();
    }
  });

  // Cliques em células de dano, botões +/-, rolagens e exclusões
  mainDeck.addEventListener("click", (e) => {
    const target = e.target;

    // Toggle e seleção dos dropdowns estilizados (Perícias)
    const skillTrigger = target.closest(".skill-picker-trigger");
    if (skillTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = skillTrigger.closest(".skill-picker-dropdown");
      const catHeader = skillTrigger.closest(".skills-category-header");
      const wasOpen = dropdown.classList.contains("is-open");
      closeAllDropdowns(dropdown);
      dropdown.classList.toggle("is-open", !wasOpen);
      if (catHeader) catHeader.classList.toggle("is-dropdown-open", !wasOpen);
      skillTrigger.setAttribute("aria-expanded", String(!wasOpen));
      return;
    }

    const skillItem = target.closest(".skill-picker-dropdown .cyber-dropdown-item");
    if (skillItem) {
      e.preventDefault();
      e.stopPropagation();
      const attrKey = skillItem.getAttribute("data-attr") || "agi";
      const selectedVal = skillItem.getAttribute("data-value");
      if (!selectedVal) return;

      const dropdown = skillItem.closest(".skill-picker-dropdown");
      if (dropdown) dropdown.classList.remove("is-open");

      const attrPresets = ATTRIBUTE_SKILL_PRESETS[attrKey] || [];
      const presetObj = attrPresets.find(p => p.name === selectedVal);

      const attrNames = {
        str: "Força",
        agi: "Agilidade",
        wil: "Vontade",
        log: "Lógica",
        cha: "Carisma"
      };

      store.update(char => {
        if (!char.skills) char.skills = [];

        if (selectedVal === "__custom__") {
          char.skills.push({
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: "",
            attr: attrKey,
            category: attrNames[attrKey] || attrKey,
            rating: 1,
            spec: "",
            description: "",
            isCustom: true
          });
        } else {
          char.skills.push({
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: selectedVal,
            attr: attrKey,
            category: attrNames[attrKey] || attrKey,
            rating: 1,
            spec: "",
            description: presetObj ? presetObj.desc : (getSkillDescription(selectedVal, attrKey) || ""),
            isCustom: false
          });
        }
      });
      return;
    }

    // Toggle e seleção de tipo de qualidade (+ Positiva / - Negativa)
    const qualityTrigger = target.closest(".quality-type-trigger");
    if (qualityTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = qualityTrigger.closest(".quality-type-dropdown");
      const wasOpen = dropdown.classList.contains("is-open");
      closeAllDropdowns(dropdown);
      dropdown.classList.toggle("is-open", !wasOpen);
      return;
    }

    const qualityOpt = target.closest(".quality-type-opt");
    if (qualityOpt) {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(qualityOpt.getAttribute("data-index"), 10);
      const val = qualityOpt.getAttribute("data-value");
      const dropdown = qualityOpt.closest(".quality-type-dropdown");
      if (dropdown) dropdown.classList.remove("is-open");
      if (!isNaN(idx) && (val === "positive" || val === "negative")) {
        store.update(char => {
          if (char.qualities?.[idx]) {
            char.qualities[idx].type = val;
          }
        });
      }
      return;
    }

    // Toggle e seleção dos selects personalizados gerais (Metatipo, Desperto, Nível de Jogo)
    const selectTrigger = target.closest(".cyber-select-trigger");
    if (selectTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const customSelect = selectTrigger.closest(".cyber-select-custom");
      const wasOpen = customSelect.classList.contains("is-open");
      closeAllDropdowns(customSelect);
      customSelect.classList.toggle("is-open", !wasOpen);
      selectTrigger.setAttribute("aria-expanded", String(!wasOpen));
      return;
    }

    const selectOpt = target.closest(".cyber-select-option");
    if (selectOpt) {
      e.preventDefault();
      e.stopPropagation();
      const customSelect = selectOpt.closest(".cyber-select-custom");
      const targetId = customSelect?.getAttribute("data-for");
      const targetSelect = targetId ? document.getElementById(targetId) : customSelect?.previousElementSibling;
      const val = selectOpt.getAttribute("data-value");

      if (targetSelect && val !== null) {
        targetSelect.value = val;
        targetSelect.dispatchEvent(new Event("change", { bubbles: true }));
        targetSelect.dispatchEvent(new Event("input", { bubbles: true }));
        syncCyberSelect(targetSelect);
      }
      if (customSelect) {
        customSelect.classList.remove("is-open");
        const trig = customSelect.querySelector(".cyber-select-trigger");
        if (trig) trig.setAttribute("aria-expanded", "false");
      }
      return;
    }

    // Clique nas caixas de dano
    const cell = target.closest(".track-cell");
    if (cell) {
      const track = cell.getAttribute("data-track");
      const index = parseInt(cell.getAttribute("data-index"), 10);

      store.update(char => {
        const key = `${track}Damage`;
        const currentVal = char.condition[key] || 0;
        char.condition[key] = (currentVal === index) ? index - 1 : index;
      });
      return;
    }

    // Aumentar/diminuir atributos (respeitando limites do metatipo)
    if (target.classList.contains("btn-attr-inc")) {
      const key = target.getAttribute("data-key");
      store.update(char => {
        const meta = METATYPES[char.character.metatype] || METATYPES.Human;
        const initialBase = meta.base?.[key] || 1;
        if (!char.attributes[key]) char.attributes[key] = { base: initialBase, mod: 0 };
        const metaLimits = meta?.limits || {};
        const maxLimit = metaLimits[key] || 6;
        const oldBase = char.attributes[key].base || initialBase;
        char.attributes[key].base = Math.min(maxLimit, oldBase + 1);
        if (key === "edg") {
          if (char.condition.edgeCurrent === oldBase) {
            char.condition.edgeCurrent = char.attributes[key].base;
          }
          if ((char.condition.edgeCurrent ?? 1) > char.attributes.edg.base) {
            char.condition.edgeCurrent = char.attributes.edg.base;
          }
        }
      });
      return;
    }
    if (target.classList.contains("btn-attr-dec")) {
      const key = target.getAttribute("data-key");
      store.update(char => {
        const meta = METATYPES[char.character.metatype] || METATYPES.Human;
        const minVal = meta.base?.[key] || 1;
        if (!char.attributes[key]) char.attributes[key] = { base: minVal, mod: 0 };
        char.attributes[key].base = Math.max(minVal, (char.attributes[key].base || minVal) - 1);
        if (key === "edg") {
          if ((char.condition.edgeCurrent ?? 1) > char.attributes.edg.base) {
            char.condition.edgeCurrent = char.attributes.edg.base;
          }
        }
      });
      return;
    }

    // Nível de perícia e botão de rolar
    if (target.classList.contains("btn-skill-inc")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.skills[idx]) char.skills[idx].rating = Math.min(12, (char.skills[idx].rating || 0) + 1);
      });
      return;
    }
    if (target.classList.contains("btn-skill-dec")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.skills[idx]) char.skills[idx].rating = Math.max(0, (char.skills[idx].rating || 0) - 1);
      });
      return;
    }

    // Remover perícia
    const removeSkillBtn = target.closest(".btn-remove-skill");
    if (removeSkillBtn) {
      const idx = parseInt(removeSkillBtn.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.skills && char.skills[idx] !== undefined) {
          char.skills.splice(idx, 1);
        }
      });
      return;
    }


    const rollSkillBtn = target.closest(".btn-roll-skill");
    if (rollSkillBtn) {
      const skillName = rollSkillBtn.getAttribute("data-skill-name");
      const pool = parseInt(rollSkillBtn.getAttribute("data-pool"), 10) || 1;
      const attr = rollSkillBtn.getAttribute("data-attr");
      openDiceModal({
        title: `PERÍCIA // ${skillName.toUpperCase()}`,
        pool,
        skillName,
        attributeName: attr
      });
      return;
    }

    // Remover perícia de conhecimento
    if (target.classList.contains("btn-remove-ks")) {

      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.knowledgeSkills?.splice(idx, 1));
      return;
    }

    // Remover lances e disposições
    if (target.classList.contains("btn-remove-cue")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.cues?.splice(idx, 1));
      return;
    }
    if (target.classList.contains("btn-remove-disp")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.dispositions?.splice(idx, 1));
      return;
    }

    // Remover arma
    if (target.classList.contains("btn-remove-weapon")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.weapons?.splice(idx, 1));
      return;
    }

    // Nível e remoção de Shadow Amps
    if (target.classList.contains("btn-amp-lvl-inc")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.shadowAmps?.[idx]) char.shadowAmps[idx].level = (char.shadowAmps[idx].level || 1) + 1;
      });
      return;
    }
    if (target.classList.contains("btn-amp-lvl-dec")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.shadowAmps?.[idx]) char.shadowAmps[idx].level = Math.max(1, (char.shadowAmps[idx].level || 1) - 1);
      });
      return;
    }
    if (target.classList.contains("btn-remove-amp")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.shadowAmps?.splice(idx, 1));
      return;
    }

    // Nível e remoção de contatos
    if (target.classList.contains("btn-conn-inc")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.contacts?.[idx]) char.contacts[idx].connection = Math.min(6, (char.contacts[idx].connection || 1) + 1);
      });
      return;
    }
    if (target.classList.contains("btn-conn-dec")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.contacts?.[idx]) char.contacts[idx].connection = Math.max(1, (char.contacts[idx].connection || 1) - 1);
      });
      return;
    }
    if (target.classList.contains("btn-loy-inc")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.contacts?.[idx]) char.contacts[idx].loyalty = Math.min(6, (char.contacts[idx].loyalty || 1) + 1);
      });
      return;
    }
    if (target.classList.contains("btn-loy-dec")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => {
        if (char.contacts?.[idx]) char.contacts[idx].loyalty = Math.max(1, (char.contacts[idx].loyalty || 1) - 1);
      });
      return;
    }
    if (target.classList.contains("btn-remove-contact")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.contacts?.splice(idx, 1));
      return;
    }

    // Remover equipamento ou qualidade
    if (target.classList.contains("btn-remove-gear")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.gear?.splice(idx, 1));
      return;
    }
    if (target.classList.contains("btn-remove-quality")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      store.update(char => char.qualities?.splice(idx, 1));
      return;
    }

    // Botões de limpar dano individualmente
    if (target.classList.contains("btn-track-inc")) {
      const track = target.getAttribute("data-track");
      store.update(char => {
        const key = `${track}Damage`;
        const derived = store.getDerived();
        const maxKey = track === "armor" ? "armorMax" : (track === "physical" ? "physMax" : "stunMax");
        const max = derived[maxKey] || 10;
        char.condition[key] = Math.min(max, (char.condition[key] || 0) + 1);
      });
      return;
    }
    if (target.classList.contains("btn-track-dec")) {
      const track = target.getAttribute("data-track");
      store.update(char => {
        const key = `${track}Damage`;
        char.condition[key] = Math.max(0, (char.condition[key] || 0) - 1);
      });
      return;
    }
    if (target.classList.contains("btn-track-clear")) {
      const track = target.getAttribute("data-track");
      store.update(char => {
        char.condition[`${track}Damage`] = 0;
      });
      return;
    }

    // Botões de armadura máxima
    if (target.classList.contains("btn-armor-max-inc")) {
      store.update(char => {
        if (!char.condition) char.condition = {};
        const cur = Math.max(1, Number(char.condition.armorRating) || 9);
        char.condition.armorRating = Math.min(30, cur + 1);
      });
      return;
    }
    if (target.classList.contains("btn-armor-max-dec")) {
      store.update(char => {
        if (!char.condition) char.condition = {};
        const cur = Math.max(1, Number(char.condition.armorRating) || 9);
        const newVal = Math.max(1, cur - 1);
        char.condition.armorRating = newVal;
        if ((char.condition.armorDamage || 0) > newVal) {
          char.condition.armorDamage = newVal;
        }
      });
      return;
    }

  });

  // Edição de campos de texto e seleções
  mainDeck.addEventListener("input", (e) => {
    const target = e.target;
    const idx = parseInt(target.getAttribute("data-index"), 10);
    if (isNaN(idx)) return;

    const typingMeta = { isTyping: true, sourceTarget: target };

    if (target.classList.contains("skill-spec-input")) {
      store.update(char => { if (char.skills?.[idx]) char.skills[idx].spec = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("skill-custom-name-input")) {
      store.update(char => { if (char.skills?.[idx]) char.skills[idx].name = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("cue-input")) {
      store.update(char => { if (char.cues) char.cues[idx] = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("disp-input")) {
      store.update(char => { if (char.dispositions) char.dispositions[idx] = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("ks-name-input")) {
      store.update(char => { if (char.knowledgeSkills?.[idx]) char.knowledgeSkills[idx].name = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("amp-name-input")) {
      store.update(char => { if (char.shadowAmps?.[idx]) char.shadowAmps[idx].name = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("amp-ess-input")) {
      store.update(char => { if (char.shadowAmps?.[idx]) char.shadowAmps[idx].essenceCost = parseFloat(target.value) || 0; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("amp-effect-input")) {
      store.update(char => { if (char.shadowAmps?.[idx]) char.shadowAmps[idx].effect = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("wep-name-input")) {
      store.update(char => {
        if (char.weapons?.[idx]) {
          char.weapons[idx].name = target.value;
          const matchedWep = OFFICIAL_SRA_WEAPONS.find(w => w.name.toLowerCase() === target.value.trim().toLowerCase());
          if (matchedWep) {
            char.weapons[idx].damage = matchedWep.damage;
            char.weapons[idx].range = matchedWep.range;
            if (matchedWep.notes && !char.weapons[idx].notes) {
              char.weapons[idx].notes = matchedWep.notes;
            }
          }
        }
      }, true, typingMeta);
      return;
    }
    if (target.classList.contains("wep-dmg-input")) {
      store.update(char => { if (char.weapons?.[idx]) char.weapons[idx].damage = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("wep-range-input")) {
      store.update(char => { if (char.weapons?.[idx]) char.weapons[idx].range = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("wep-notes-input")) {
      store.update(char => { if (char.weapons?.[idx]) char.weapons[idx].notes = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("gear-name-input")) {
      store.update(char => { if (char.gear?.[idx]) char.gear[idx].name = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("gear-qty-input")) {
      store.update(char => { if (char.gear?.[idx]) char.gear[idx].qty = parseInt(target.value, 10) || 1; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("gear-notes-input")) {
      store.update(char => { if (char.gear?.[idx]) char.gear[idx].notes = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("contact-name-input")) {
      store.update(char => { if (char.contacts?.[idx]) char.contacts[idx].name = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("contact-role-input")) {
      store.update(char => { if (char.contacts?.[idx]) char.contacts[idx].role = target.value; }, true, typingMeta);
      return;
    }
    if (target.classList.contains("contact-notes-input")) {
      store.update(char => { if (char.contacts?.[idx]) char.contacts[idx].notes = target.value; }, true, typingMeta);
      return;
    }

    // Campos de qualidades
    if (target.classList.contains("quality-name-input")) {
      store.update(char => {
        if (char.qualities?.[idx]) {
          char.qualities[idx].name = target.value;

        }
      }, true, typingMeta);
      return;
    }

    if (target.classList.contains("quality-effect-input")) {
      store.update(char => {
        if (char.qualities?.[idx]) {
          char.qualities[idx].effect = target.value;
        }
      }, true, typingMeta);
      return;
    }

    // Campo de armadura máxima
    if (target.id === "armor-rating-input" || target.classList.contains("armor-max-input")) {
      const val = Math.max(1, Math.min(30, parseInt(target.value, 10) || 1));
      store.update(char => {
        if (!char.condition) char.condition = {};
        char.condition.armorRating = val;
        char.condition.armorDamage = Math.min(Math.max(0, Number(char.condition.armorDamage) || 0), val);
      }, true, typingMeta);
      return;
    }

  });

  mainDeck.addEventListener("change", (e) => {
    const target = e.target;

    if (target.classList.contains("amp-ess-input")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      if (!isNaN(idx)) {
        store.update(char => {
          if (char.shadowAmps?.[idx]) {
            char.shadowAmps[idx].essenceCost = Math.max(0, parseFloat(target.value) || 0);
          }
        });
      }
      return;
    }

    // Seleção de tipo da qualidade (positiva/negativa)
    if (target.classList.contains("quality-type-select")) {
      const idx = parseInt(target.getAttribute("data-index"), 10);
      if (!isNaN(idx)) {
        store.update(char => {
          if (char.qualities?.[idx]) {
            char.qualities[idx].type = target.value;
          }
        });
      }
      return;
    }

    const picker = target.closest(".skill-picker-select");
    if (picker) {
      const attrKey = picker.getAttribute("data-attr") || "agi";
      const selectedVal = picker.value;
      if (!selectedVal) return;

      const attrPresets = ATTRIBUTE_SKILL_PRESETS[attrKey] || [];
      const presetObj = attrPresets.find(p => p.name === selectedVal);

      const attrNames = {
        str: "Força",
        agi: "Agilidade",
        wil: "Vontade",
        log: "Lógica",
        cha: "Carisma"
      };

      store.update(char => {
        if (!char.skills) char.skills = [];

        if (selectedVal === "__custom__") {
          char.skills.push({
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: "",
            attr: attrKey,
            category: attrNames[attrKey] || attrKey,
            rating: 1,
            spec: "",
            description: "",
            isCustom: true
          });
        } else {
          char.skills.push({
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: selectedVal,
            attr: attrKey,
            category: attrNames[attrKey] || attrKey,
            rating: 1,
            spec: "",
            description: presetObj ? presetObj.desc : (getSkillDescription(selectedVal, attrKey) || ""),
            isCustom: false
          });
        }
      });
      picker.selectedIndex = 0;
      return;
    }

    const idx = parseInt(target.getAttribute("data-index"), 10);
    if (isNaN(idx)) return;
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => console.log("[SRA Terminal] Service Worker linked:", reg.scope))
        .catch(err => console.warn("[SRA Terminal] SW registration skipped in file protocol:", err));
    });
  }
}

// Controle e eventos do seletor de temas
function setupThemeControls() {
  // Botão do cabeçalho para abrir o modal de temas
  document.getElementById("btn-header-theme")?.addEventListener("click", () => {
    openThemeModal(currentThemeConfig.id, currentThemeConfig.customHex);
  });

  // Botões de fechar o modal de temas
  document.getElementById("btn-close-theme-modal")?.addEventListener("click", closeThemeModal);
  document.getElementById("btn-confirm-theme-modal")?.addEventListener("click", closeThemeModal);

  // Seleção de temas predefinidos no modal
  document.getElementById("theme-presets-grid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".theme-preset-card");
    if (!card) return;
    const themeId = card.dataset.themeId;
    if (themeId) {
      setAndSaveTheme(themeId, null);
      const preset = THEME_PRESETS.find(p => p.id === themeId);
      showToast(`TEMA ATIVADO // ${preset ? preset.name.toUpperCase() : themeId.toUpperCase()}`, "info");
    }
  });

  // Acessibilidade de teclado para os cartões de tema
  document.getElementById("theme-presets-grid")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".theme-preset-card");
      if (card) {
        e.preventDefault();
        card.click();
      }
    }
  });

  // Sincronização do seletor de cor e campo hexadecimal
  const customPicker = document.getElementById("input-theme-custom-picker");
  const customHex = document.getElementById("input-theme-custom-hex");
  const btnApplyCustom = document.getElementById("btn-apply-custom-theme");

  customPicker?.addEventListener("input", (e) => {
    if (customHex) customHex.value = e.target.value.toUpperCase();
  });

  const applyCustomColorAction = () => {
    let hex = customHex ? customHex.value.trim() : "";
    if (!hex.startsWith("#")) hex = "#" + hex;
    const rgb = hexToRgb(hex);
    if (!rgb) {
      showToast("CÓDIGO HEX INVÁLIDO. EXEMPLO: #00FF66 OU #00F0FF", "warn");
      return;
    }
    if (customPicker) customPicker.value = hex;
    setAndSaveTheme("custom", hex);
    showToast(`COR PERSONALIZADA ATIVADA // ${hex.toUpperCase()}`, "success");
  };

  btnApplyCustom?.addEventListener("click", applyCustomColorAction);
  customHex?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyCustomColorAction();
    }
  });

  // Botão de restaurar tema padrão
  document.getElementById("btn-reset-default-theme")?.addEventListener("click", () => {
    setAndSaveTheme(DEFAULT_THEME_ID, null);
    showToast("TEMA PADRÃO RESTAURADO // MATRIX GREEN", "info");
  });
}

function setAndSaveTheme(themeId, customHex = null) {
  currentThemeConfig = { id: themeId, customHex };
  saveThemeSetting(themeId, customHex);
  updateRainThemeColors(themeId, customHex);
  applyTheme(themeId, customHex);
  renderThemeModal(themeId, customHex);
}

function updateRainThemeColors(themeId, customHex = null) {
  if (themeId === "custom" && customHex) {
    rainColorPrimary = customHex;
    const rgb = hexToRgb(customHex);
    rainColorDim = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)` : customHex;
  } else {
    const preset = THEME_PRESETS.find(p => p.id === themeId);
    if (preset) {
      rainColorPrimary = preset.hex;
      rainColorDim = `rgba(${preset.rgb}, 0.55)`;
    } else {
      rainColorPrimary = "#00ff66";
      rainColorDim = "rgba(0, 255, 102, 0.55)";
    }
  }
}

// Efeito de chuva digital estilo Matrix no fundo
function setupMatrixRain() {
  const canvas = document.getElementById("matrix-rain-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const chars = "0101010101100101ABCDEF01";
  const fontSize = 14;
  let columns = Math.floor(width / fontSize);
  let drops = Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / fontSize);
    drops = Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));
  }

  window.addEventListener("resize", resize);

  let lastTime = 0;
  const fpsInterval = 1000 / 30; // 30 FPS para economizar bateria e CPU

  function draw(currentTime) {
    requestAnimationFrame(draw);

    const elapsed = currentTime - lastTime;
    if (elapsed < fpsInterval) return;
    lastTime = currentTime - (elapsed % fpsInterval);

    // Efeito de rastro escuro
    ctx.fillStyle = "rgba(5, 6, 8, 0.08)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      if (y > 0) {
        // Cabeça do rastro mais clara e corpo na cor do tema
        if (Math.random() > 0.88) {
          ctx.fillStyle = "#ffffff";
        } else if (Math.random() > 0.5) {
          ctx.fillStyle = rainColorPrimary;
        } else {
          ctx.fillStyle = rainColorDim;
        }
        ctx.fillText(text, x, y);
      }

      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  requestAnimationFrame(draw);
}


