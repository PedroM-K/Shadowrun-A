// Renderização e atualização da interface do terminal

import { store } from "./state.js";
import {
  METATYPES,
  GAME_LEVELS,
  ATTRIBUTES,
  ATTRIBUTE_SKILL_PRESETS,
  ACTION_SKILL_ATTRIBUTES,
  OFFICIAL_SKILL_DESCRIPTIONS,
  getSkillDescription,
  OFFICIAL_SRA_WEAPONS,
  THEME_PRESETS,
  DEFAULT_THEME_ID,
  hexToRgb
} from "./constants.js";
import { calculateSkillDicePool } from "./rules.js";
import { rollD6Pool, rollDie, recalculateRollStats, rerollFailedDice } from "./dice.js";

function escapeHtml(str) {
  if (typeof str !== "string") return str ?? "";
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast anim-fade";
  if (type === "success") {
    toast.style.borderColor = "var(--term-green)";
    toast.style.borderLeftColor = "var(--term-green)";
  } else if (type === "error") {
    toast.style.borderColor = "var(--term-red)";
    toast.style.borderLeftColor = "var(--term-red)";
  }

  toast.innerHTML = `<span class="led-indicator ${type === "error" ? "led-red" : "led-green"}" style="margin-right: 0.5rem;"></span>${escapeHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    toast.style.transition = "all 0.15s ease";
    setTimeout(() => toast.remove(), 160);
  }, 2800);
}

// Efeitos sonoros usando Web Audio API
let audioCtx = null;
let diceSoundEnabled = true;

try {
  const storedSound = localStorage.getItem("sra_dice_sound_enabled");
  if (storedSound !== null) {
    diceSoundEnabled = storedSound === "true";
  }
} catch (e) { }

function getAudioContext() {
  if (!diceSoundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTacticalSound(type) {
  if (!diceSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.04, now);
    masterGain.connect(ctx.destination);

    if (type === "tick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500 + Math.random() * 450, now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === "lock") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "hit") {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.035);
        gain.gain.setValueAtTime(0.035, now + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.14);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.035);
        osc.stop(now + i * 0.035 + 0.16);
      });
    } else if (type === "glitch") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.18);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Ignora se o navegador bloquear o áudio
  }
}

// Controle do modal de rolagem de dados
let currentActiveRoll = null;
let isDiceRolling = false;
let diceListenersInitialized = false;

function buildDieCardHtml(die, index, isRolling = false) {
  let classes = ["die-tactical-card"];
  if (isRolling) {
    classes.push("rolling");
  } else {
    classes.push("settled");
    if (die.isHit) classes.push("hit");
    if (die.value === 6) classes.push("critical-hit");
    if (die.isOne) classes.push("one");
    if (die.isAnarchyDie) classes.push("anarchy-die");
    if (die.rerolled) classes.push("exploded");
    if (!die.isHit && !die.isOne) classes.push("neutral");
  }

  let tag = "D6";
  if (die.isAnarchyDie) tag = "FALHA / ANARQUIA";
  else if (die.rerolled) tag = "TRUNFO";

  let footer = "—";
  if (die.isAnarchyDie) {
    if (die.value === 1) footer = "⚠ FALHA";
    else if (die.value >= 5) footer = "BRECHA";
    else footer = die.isHit ? "HIT" : "—";
  } else if (die.isHit) {
    footer = die.value === 6 ? "CRIT" : "HIT";
  } else if (die.isOne) {
    footer = "UM (1)";
  }

  const titleTooltip = die.isAnarchyDie
    ? `Dado de Falha: ${die.value}`
    : `D6: ${die.value}`;

  return `
    <div class="${classes.join(" ")}" data-index="${index}" title="${titleTooltip}" role="button" tabindex="0">
      <div class="die-card-tag">${tag}</div>
      <div class="die-card-value">${die.value}</div>
      <div class="die-card-footer">${footer}</div>
    </div>
  `;
}

function renderFullDiceResults(container, roll) {
  if (!container || !roll) return;

  const nonHits = roll.dice.filter(d => !d.isHit).length;

  let bannerHtml = `
    <div class="dice-summary-banner bracket-box" style="display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0.85rem; margin-bottom: 0.85rem; background: var(--bg-elevated); border: 1px solid var(--border-panel); flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <span style="font-family: var(--font-tech); font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">RESULTADO:</span>
        <strong style="font-family: var(--font-heading); font-size: 1.25rem; color: ${roll.hits > 0 ? "var(--term-green)" : "var(--term-red)"}; letter-spacing: 1px;">
          ${roll.hits} ${roll.hits === 1 ? "SUCESSO" : "SUCESSOS"}
        </strong>
        ${roll.useEdgePreRoll ? `<span class="sys-tag" style="color: var(--term-amber); border-color: var(--term-amber-border);">TRUNFO ATIVO (4-6)</span>` : ""}
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        ${roll.isAnarchyGlitch ? `
          <span class="sys-tag" style="color: var(--term-red); border-color: var(--term-red); background: rgba(255, 30, 68, 0.15); font-weight: 700;">
            ⚠ FALHA!
          </span>
        ` : ""}
        ${roll.isAnarchyExploit ? `
          <span class="sys-tag" style="color: var(--term-cyan); border-color: var(--term-cyan); background: rgba(0, 240, 255, 0.15); font-weight: 700;">
            BRECHA!
          </span>
        ` : ""}
        ${nonHits > 0 ? `
          <button type="button" id="btn-dice-reroll-failures" class="btn-term btn-term-sm" style="color: var(--term-amber); border-color: var(--term-amber-border); font-weight: 700;" title="Re-rolar falhas com Trunfo">
            RE-ROLAR ${nonHits} FALHAS COM TRUNFO
          </button>
        ` : ""}
      </div>
    </div>
  `;

  let diceGridHtml = `<div class="dice-results-grid" id="dice-grid-interactive">`;
  roll.dice.forEach((die, idx) => {
    diceGridHtml += buildDieCardHtml(die, idx, false);
  });
  diceGridHtml += `</div>`;

  container.innerHTML = bannerHtml + diceGridHtml;
}

function rerollSingleDie(index) {
  if (isDiceRolling || !currentActiveRoll || !currentActiveRoll.dice[index]) return;

  const card = document.querySelector(`.die-tactical-card[data-index="${index}"]`);
  if (!card) return;

  isDiceRolling = true;
  card.classList.add("rolling");
  card.classList.remove("settled", "hit", "critical-hit", "one", "neutral");
  playTacticalSound("tick");

  let scrambles = 0;
  const interval = setInterval(() => {
    const valEl = card.querySelector(".die-card-value");
    if (valEl) valEl.textContent = Math.floor(Math.random() * 6) + 1;
    playTacticalSound("tick");
    scrambles++;

    if (scrambles >= 6) {
      clearInterval(interval);
      const newVal = rollDie();
      currentActiveRoll.dice[index].value = newVal;

      const updated = recalculateRollStats(currentActiveRoll.dice, {
        useAnarchyDie: currentActiveRoll.useAnarchyDie,
        useEdgePreRoll: currentActiveRoll.useEdgePreRoll
      });
      currentActiveRoll = updated;

      isDiceRolling = false;
      const resultsContainer = document.getElementById("dice-modal-results");
      renderFullDiceResults(resultsContainer, currentActiveRoll);

      if (newVal >= (currentActiveRoll.useEdgePreRoll ? 4 : 5)) {
        playTacticalSound("hit");
      } else if (newVal === 1) {
        playTacticalSound("glitch");
      } else {
        playTacticalSound("lock");
      }
    }
  }, 40);
}

export function initDiceModalListeners() {
  if (diceListenersInitialized) return;
  diceListenersInitialized = true;

  const poolInput = document.getElementById("dice-pool-input");

  // Botões de aumentar e diminuir dados
  const adjustPool = (delta) => {
    if (!poolInput) return;
    let val = (parseInt(poolInput.value, 10) || 6) + delta;
    val = Math.max(1, Math.min(50, val));
    poolInput.value = val;
    playTacticalSound("tick");
  };

  document.getElementById("btn-pool-dec-5")?.addEventListener("click", () => adjustPool(-5));
  document.getElementById("btn-pool-dec-1")?.addEventListener("click", () => adjustPool(-1));
  document.getElementById("btn-pool-inc-1")?.addEventListener("click", () => adjustPool(1));
  document.getElementById("btn-pool-inc-5")?.addEventListener("click", () => adjustPool(5));

  // Atalhos rápidos de reserva
  document.querySelectorAll(".btn-dice-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = parseInt(btn.getAttribute("data-pool"), 10);
      if (p && poolInput) {
        poolInput.value = p;
        playTacticalSound("tick");
      }
    });
  });

  // Alternar som
  const sndBtn = document.getElementById("btn-dice-sound-toggle");
  if (sndBtn) {
    sndBtn.textContent = diceSoundEnabled ? "SND: ON" : "SND: OFF";
    sndBtn.addEventListener("click", () => {
      diceSoundEnabled = !diceSoundEnabled;
      sndBtn.textContent = diceSoundEnabled ? "SND: ON" : "SND: OFF";
      try {
        localStorage.setItem("sra_dice_sound_enabled", String(diceSoundEnabled));
      } catch (e) { }
      if (diceSoundEnabled) playTacticalSound("lock");
    });
  }

  // Eventos na área de resultados (clique para re-rolar dado ou botão de Trunfo)
  const resultsContainer = document.getElementById("dice-modal-results");
  resultsContainer?.addEventListener("click", (e) => {
    // Re-rola falhas usando Trunfo
    const btnRerollFailures = e.target.closest("#btn-dice-reroll-failures");
    if (btnRerollFailures) {
      if (isDiceRolling || !currentActiveRoll) return;
      const char = store.get();
      if (char && char.condition) {
        if ((char.condition.edgeCurrent ?? 0) <= 0) {
          showToast("Sem Trunfo disponível no momento!", "error");
          return;
        }
        store.update(c => {
          c.condition.edgeCurrent = Math.max(0, (c.condition.edgeCurrent || 0) - 1);
        });
        showToast("1 Ponto de Trunfo gasto para re-rolar falhas!", "info");
      }

      currentActiveRoll = rerollFailedDice(currentActiveRoll);
      playTacticalSound("tick");
      renderFullDiceResults(resultsContainer, currentActiveRoll);
      return;
    }

    const dieCard = e.target.closest(".die-tactical-card");
    if (dieCard) {
      const idx = parseInt(dieCard.getAttribute("data-index"), 10);
      if (!isNaN(idx)) rerollSingleDie(idx);
    }
  });

  // Atalho de teclado (Espaço ou Enter para rolar)
  window.addEventListener("keydown", (e) => {
    const modal = document.getElementById("modal-dice-roller");
    if (!modal?.classList.contains("active")) return;

    if (e.key === " " || e.key === "Enter") {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag !== "input" && activeTag !== "textarea") {
        e.preventDefault();
        executeModalRoll();
      }
    }
  });
}

// Abre o modal de rolagem de dados
export function openDiceModal(options = {}) {
  const { title = "MATRIX D6 ROLLER", pool = 6, attributeName = "", skillName = "" } = options;
  const modal = document.getElementById("modal-dice-roller");
  if (!modal) return;

  initDiceModalListeners();

  const modalTitle = document.getElementById("dice-modal-title");
  const poolInput = document.getElementById("dice-pool-input");
  const subtext = document.getElementById("dice-modal-subtext");
  const resultsContainer = document.getElementById("dice-modal-results");

  if (modalTitle) modalTitle.textContent = title;
  if (poolInput) poolInput.value = Math.max(1, Math.min(50, pool));
  if (subtext) {
    subtext.textContent = (attributeName || skillName)
      ? `// ORIGEM: ${skillName || ""} ${attributeName ? `[${attributeName}]` : ""}`
      : "";
  }

  currentActiveRoll = null;

  const edgePreRollCb = document.getElementById("cb-edge-preroll");
  if (edgePreRollCb) edgePreRollCb.checked = false;

  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="dice-standby-placeholder">
        <div class="standby-radar-ring" aria-hidden="true"></div>
        <div class="standby-mono-text">// SISTEMA DE ROLAGEM MATRICIAL PRONTO //</div>
      </div>
    `;
  }

  modal.classList.add("active");
  playTacticalSound("tick");
}

export function closeDiceModal() {
  const modal = document.getElementById("modal-dice-roller");
  if (modal) modal.classList.remove("active");
}

// Executa a rolagem com animação dos dados
export function executeModalRoll() {
  if (isDiceRolling) return;

  const poolInput = document.getElementById("dice-pool-input");
  const anarchyDieCb = document.getElementById("cb-anarchy-die");
  const resultsContainer = document.getElementById("dice-modal-results");
  const rollActionBtn = document.getElementById("btn-modal-roll-action");

  const rawPool = parseInt(poolInput?.value, 10);
  const pool = Math.max(1, Math.min(50, isNaN(rawPool) ? 6 : rawPool));
  if (poolInput) poolInput.value = pool;

  const useAnarchyDie = anarchyDieCb?.checked ?? true;
  const edgePreRollCb = document.getElementById("cb-edge-preroll");
  const useEdgePreRoll = edgePreRollCb?.checked ?? false;

  // Rolar com Trunfo (+1 dado e acertos em 4, 5 e 6)
  if (useEdgePreRoll) {
    const char = store.get();
    if (char && char.condition) {
      if ((char.condition.edgeCurrent ?? 0) <= 0) {
        showToast("Sem Trunfo disponível para esta rolagem!", "error");
        if (edgePreRollCb) edgePreRollCb.checked = false;
        return;
      }
      store.update(c => {
        c.condition.edgeCurrent = Math.max(0, (c.condition.edgeCurrent || 0) - 1);
      });
      showToast("1 Ponto de Trunfo gasto (dados 4, 5 e 6 são sucessos)!", "info");
      if (edgePreRollCb) edgePreRollCb.checked = false;
    }
  }

  isDiceRolling = true;

  // Desabilita o botão durante a rolagem
  if (rollActionBtn) {
    rollActionBtn.disabled = true;
    rollActionBtn.innerHTML = `
      <span class="led-indicator led-green" style="margin-right: 6px;"></span>
      <span>PROCESSANDO TELEMETRIA...</span>
    `;
  }

  // Calcula o resultado final da rolagem
  const finalRoll = rollD6Pool(pool, { useRuleOfSix: false, useAnarchyDie, useEdgePreRoll });
  currentActiveRoll = finalRoll;

  // Exibe dados na tela durante a rolagem
  let rollingHtml = `<div class="dice-results-grid" id="dice-grid-interactive">`;
  for (let i = 0; i < finalRoll.dice.length; i++) {
    const isAnarchy = useAnarchyDie && i === 0;
    const tempDie = { value: Math.floor(Math.random() * 6) + 1, isAnarchyDie: isAnarchy };
    rollingHtml += buildDieCardHtml(tempDie, i, true);
  }
  rollingHtml += `</div>`;
  if (resultsContainer) resultsContainer.innerHTML = rollingHtml;

  playTacticalSound("tick");

  // Animação dos números mudando
  let scrambleCount = 0;
  const scrambleInterval = setInterval(() => {
    scrambleCount++;
    const cards = document.querySelectorAll(".die-tactical-card.rolling");
    cards.forEach(card => {
      const valEl = card.querySelector(".die-card-value");
      if (valEl) valEl.textContent = Math.floor(Math.random() * 6) + 1;
    });
    playTacticalSound("tick");

    if (scrambleCount >= 7) {
      clearInterval(scrambleInterval);

      // Revela os valores finais dado a dado
      const cards = document.querySelectorAll(".die-tactical-card");
      let settleIndex = 0;

      const settleNextDie = () => {
        if (settleIndex < finalRoll.dice.length) {
          const die = finalRoll.dice[settleIndex];
          const card = cards[settleIndex];

          if (card) {
            card.classList.remove("rolling");
            card.classList.add("settled");
            if (die.isHit) card.classList.add("hit");
            if (die.value === 6) card.classList.add("critical-hit");
            if (die.isOne) card.classList.add("one");
            if (die.isAnarchyDie) card.classList.add("anarchy-die");
            if (die.exploded) card.classList.add("exploded");
            if (!die.isHit && !die.isOne) card.classList.add("neutral");

            const valEl = card.querySelector(".die-card-value");
            if (valEl) valEl.textContent = die.value;

            const footerEl = card.querySelector(".die-card-footer");
            if (footerEl) {
              footerEl.textContent = die.isHit ? (die.value === 6 ? "CRIT" : "HIT") : (die.isOne ? "GLITCH" : "—");
            }
          }

          settleIndex++;
          if (settleIndex % 2 === 0) playTacticalSound("tick");
          setTimeout(settleNextDie, 18);
        } else {
          // Rolagem concluída: exibe o resultado final
          isDiceRolling = false;

          if (rollActionBtn) {
            rollActionBtn.disabled = false;
            rollActionBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
                <circle cx="16" cy="8" r="1.3" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
              </svg>
              <span>EXECUTAR ROLAGEM NA MATRIZ</span>
            `;
          }

          renderFullDiceResults(resultsContainer, finalRoll);

          // Toca som final
          if (finalRoll.isAnarchyGlitch || finalRoll.glitchStatus === "glitch") {
            playTacticalSound("glitch");
          } else if (finalRoll.hits > 0) {
            playTacticalSound("hit");
          } else {
            playTacticalSound("lock");
          }
        }
      };

      settleNextDie();
    }
  }, 35);
}

// Renderiza a lista de personagens no modal
export function renderSheetsModal(roster = [], activeId = "") {
  const countHeaderEl = document.getElementById("header-sheets-count");
  if (countHeaderEl) {
    countHeaderEl.textContent = roster.length;
  }
  const countSidebarEl = document.getElementById("sidebar-sheets-count");
  if (countSidebarEl) {
    countSidebarEl.textContent = roster.length;
  }

  const modalList = document.getElementById("modal-roster-list");
  if (!modalList) return;

  const activeChar = roster.find(c => c.id === activeId) || roster[0];
  const activeSummary = document.getElementById("modal-active-sheet-summary");
  if (activeSummary && activeChar) {
    const alias = activeChar.character?.alias || activeChar.character?.name || "Sem Nome";
    const meta = METATYPES[activeChar.character?.metatype]?.name || activeChar.character?.metatype || "Humano";
    const arch = activeChar.character?.archetype || "Shadowrunner";
    const karma = activeChar.character?.karma ?? 0;
    const nuyen = activeChar.character?.nuyen ?? 0;
    const updateTime = activeChar.updatedAt ? new Date(activeChar.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";

    activeSummary.innerHTML = `
      <div class="active-sheet-banner bracket-box">
        <div class="active-sheet-header">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="sys-tag" style="color: var(--term-green); border-color: var(--term-green-border); background: var(--term-green-dim);">● FICHA ATIVA NO TERMINAL</span>
            <strong style="color: var(--term-green); font-size: 1.15rem; font-family: var(--font-heading); letter-spacing: 1px;">${escapeHtml(alias.toUpperCase())}</strong>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button type="button" id="btn-modal-save-now" class="btn-term btn-term-primary btn-term-sm" title="Salvar alterações desta ficha">💾 SALVAR AGORA</button>
          </div>
        </div>
        <div class="active-sheet-stats">
          <div><span class="label">METATIPO:</span> <strong>${escapeHtml(meta)}</strong></div>
          <div><span class="label">ARQUÉTIPO:</span> <strong>${escapeHtml(arch)}</strong></div>
          <div><span class="label">KARMA:</span> <strong style="color: var(--term-purple);">${karma}</strong></div>
          <div><span class="label">NUYEN:</span> <strong style="color: var(--term-amber);">¥${nuyen}</strong></div>
          <div><span class="label">ÚLTIMA ATUALIZAÇÃO:</span> <span>${updateTime}</span></div>
        </div>
      </div>
    `;
  }

  if (roster.length === 0) {
    modalList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-family: var(--font-mono); padding: 1.5rem;">// NENHUMA FICHA ENCONTRADA.</div>`;
    return;
  }

  modalList.innerHTML = roster.map((charItem, idx) => {
    const isActive = charItem.id === activeId;
    const itemAlias = charItem.character?.alias || charItem.character?.name || `Runner #${idx + 1}`;
    const itemReal = charItem.character?.name && charItem.character?.name !== itemAlias ? `(${escapeHtml(charItem.character.name)})` : "";
    const itemMeta = METATYPES[charItem.character?.metatype]?.name || charItem.character?.metatype || "Humano";
    const itemArch = charItem.character?.archetype || "Shadowrunner";
    const itemUpdated = charItem.updatedAt ? new Date(charItem.updatedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : "---";
    const qualCount = Array.isArray(charItem.qualities) ? charItem.qualities.filter(q => q.name?.trim()).length : 0;

    return `
      <div class="sheet-roster-card bracket-box ${isActive ? "active-roster-card" : ""}" data-id="${charItem.id}">
        <div class="sheet-roster-info">
          <div class="sheet-roster-title-row">
            <span class="sheet-roster-num">#${String(idx + 1).padStart(2, "0")}</span>
            <strong class="sheet-roster-alias ${isActive ? "text-green" : ""}">${escapeHtml(itemAlias)}</strong>
            ${itemReal ? `<span class="sheet-roster-real">${itemReal}</span>` : ""}
            ${isActive ? `<span class="sys-tag sheet-active-badge">ATIVA</span>` : ""}
          </div>
          <div class="sheet-roster-meta-row">
            <span>${escapeHtml(itemMeta)}</span>
            <span>//</span>
            <span>${escapeHtml(itemArch)}</span>
            <span>//</span>
            <span>${qualCount} Qualidade(s)</span>
            <span>//</span>
            <span class="sheet-roster-date">Salvo: ${itemUpdated}</span>
          </div>
        </div>

        <div class="sheet-roster-actions">
          ${!isActive ? `
            <button type="button" class="btn-term btn-term-primary btn-term-sm btn-open-sheet" data-id="${charItem.id}" title="Abrir esta ficha no terminal">
              ABRIR
            </button>
          ` : `
            <span class="sys-tag" style="color: var(--term-green); font-size: 0.72rem;">ABERTA</span>
          `}
          <button type="button" class="btn-term btn-term-sm btn-duplicate-sheet" data-id="${charItem.id}" title="Duplicar esta ficha">
            DUPLICAR
          </button>
          <button type="button" class="btn-term btn-term-danger btn-term-sm btn-delete-sheet" data-id="${charItem.id}" title="Excluir esta ficha"${roster.length <= 1 ? " disabled style='opacity: 0.4; cursor: not-allowed;'" : ""}>
            EXCLUIR
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Atualiza os elementos da tela quando os dados mudam
export function renderApp(char, derived, eventMeta = {}) {
  if (!char) return;

  const alias = char.character.alias || char.character.name || "---";
  const metatype = METATYPES[char.character.metatype]?.name || char.character.metatype || "---";
  const archetype = char.character.archetype ? char.character.archetype.toUpperCase() : "---";

  // Atualiza cabeçalho e barra lateral
  const headerUser = document.getElementById("header-user-display");
  const sidebarAlias = document.getElementById("sidebar-alias-display");
  const sidebarMeta = document.getElementById("sidebar-meta-display");
  const sidebarArch = document.getElementById("sidebar-arch-display");

  if (headerUser) headerUser.textContent = alias.toUpperCase();
  if (sidebarAlias) sidebarAlias.textContent = alias.toUpperCase();
  if (sidebarMeta) sidebarMeta.textContent = metatype.toUpperCase();
  if (sidebarArch) sidebarArch.textContent = archetype;

  // Sincroniza lista de fichas e contadores
  if (typeof store.getRoster === "function") {
    const roster = store.getRoster();
    renderSheetsModal(roster, char.id);
  }

  // Se estiver digitando, não recria o DOM para não perder o foco
  if (eventMeta?.isTyping) {
    const target = eventMeta.sourceTarget;
    // Atualiza a reserva da linha se a especialização mudou
    if (target && target.classList.contains("skill-spec-input")) {
      const row = target.closest(".skill-tactical-item");
      const idx = parseInt(target.getAttribute("data-index"), 10);
      if (row && !isNaN(idx) && char.skills?.[idx]) {
        const pool = calculateSkillDicePool(char, char.skills[idx], true);
        const poolBox = row.querySelector(".pool-box");
        const rollBtn = row.querySelector(".btn-roll-skill");
        if (poolBox) poolBox.textContent = `${pool}d6`;
        if (rollBtn) rollBtn.setAttribute("data-pool", pool);
      }
    }
    // Atualiza a essência se o custo mudou
    if (target && target.classList.contains("amp-ess-input")) {
      const essenceDisplay = document.getElementById("amps-essence-display");
      const essencePercent = document.getElementById("amps-essence-percent");
      const essenceSegments = document.getElementById("essence-bar-segments");
      if (essenceDisplay) essenceDisplay.textContent = `${derived.essence.remaining.toFixed(2)} / 6.00`;
      if (essencePercent) {
        const pct = Math.round((derived.essence.remaining / 6.0) * 100);
        essencePercent.textContent = `${pct}% INTATOS`;
      }
      if (essenceSegments) {
        let segHtml = "";
        for (let i = 1; i <= 12; i++) {
          const active = i <= Math.round(derived.essence.remaining * 2);
          segHtml += `<div class="meter-segment ${active ? "filled essence-segment" : ""}"></div>`;
        }
        essenceSegments.innerHTML = segHtml;
      }
      renderAttributesTab(char, derived);
    }
    return;
  }

  // Atualiza Trunfo e Pontos de Trama na barra rápida
  const edgeVal = document.getElementById("val-edge-count");
  const currentEdge = char.condition?.edgeCurrent ?? 1;
  if (edgeVal) edgeVal.textContent = currentEdge;

  // Atualiza o resumo dos pontos de criação
  const cp = derived.creationPoints;
  if (cp) {
    const auditLevel = document.getElementById("char-gameLevel");
    const auditAttr = document.getElementById("audit-attr-points");
    const auditSkill = document.getElementById("audit-skill-points");
    const auditAmp = document.getElementById("audit-amp-points");

    if (auditLevel && document.activeElement !== auditLevel) {
      auditLevel.value = char.character?.gameLevel || "street_runner";
      syncCyberSelect(auditLevel);
    }

    if (auditAttr) {
      auditAttr.textContent = `ATRIBUTOS: ${cp.attrPointsSpent} / ${cp.attrPointsMax}`;
      auditAttr.style.color = cp.attrPointsSpent > cp.attrPointsMax ? "var(--term-red)" : (cp.attrPointsSpent === cp.attrPointsMax ? "var(--term-green)" : "var(--term-amber)");
    }
    if (auditSkill) {
      auditSkill.textContent = `PERÍCIAS: ${cp.skillPointsSpent} / ${cp.skillPointsMax}`;
      auditSkill.style.color = cp.skillPointsSpent > cp.skillPointsMax ? "var(--term-red)" : (cp.skillPointsSpent === cp.skillPointsMax ? "var(--term-green)" : "var(--term-cyan)");
    }
    if (auditAmp) {
      auditAmp.textContent = `AMPS: ${cp.ampPointsSpent} / ${cp.ampPointsMax}`;
      auditAmp.style.color = cp.ampPointsSpent > cp.ampPointsMax ? "var(--term-red)" : (cp.ampPointsSpent === cp.ampPointsMax ? "var(--term-green)" : "var(--term-purple)");
    }
  }

  // Dados do personagem e lances
  renderOverviewTab(char);

  // Atributos e barras de nível
  renderAttributesTab(char, derived);

  // Perícias
  renderSkillsTab(char, derived);

  // Monitores de dano e defesas
  renderCombatTab(char, derived);

  // Armas
  renderWeaponsTab(char);

  // Shadow Amps e Essência
  renderShadowAmpsTab(char, derived);

  // Equipamentos e veículos
  renderGearTab(char);

  // Contatos e qualidades
  renderContactsTab(char);

  // Anotações da missão
  renderNotesTab(char);
}

// Sincroniza selects estilizados com o estado subjacente
export function syncCyberSelect(selectEl) {
  if (!selectEl) return;
  const wrapper = selectEl.nextElementSibling;
  if (!wrapper || !wrapper.classList.contains("cyber-select-custom")) return;

  const labelEl = wrapper.querySelector(".cyber-select-label");
  const selectedOpt = selectEl.options[selectEl.selectedIndex];
  if (labelEl && selectedOpt) {
    labelEl.textContent = selectedOpt.text;
  }

  wrapper.querySelectorAll(".cyber-select-option").forEach(opt => {
    const isSel = opt.getAttribute("data-value") === selectEl.value;
    opt.classList.toggle("is-selected", isSel);
    opt.setAttribute("aria-selected", String(isSel));
  });
}

// Inicializa wrappers personalizados para selects nativos
export function initCyberSelects() {
  const targetSelects = document.querySelectorAll(
    "select#char-metatype, select#char-awakenedType, select#char-gameLevel"
  );

  targetSelects.forEach(selectEl => {
    if (selectEl.nextElementSibling && selectEl.nextElementSibling.classList.contains("cyber-select-custom")) {
      syncCyberSelect(selectEl);
      return;
    }

    selectEl.style.display = "none";

    const wrapper = document.createElement("div");
    const extraClasses = Array.from(selectEl.classList)
      .filter(c => c !== "field-input" && c !== "identity-field")
      .join(" ");
    wrapper.className = `cyber-select-custom ${extraClasses}`.trim();
    if (selectEl.id) wrapper.setAttribute("data-for", selectEl.id);

    const initialText = selectEl.options[selectEl.selectedIndex]?.text || "";

    wrapper.innerHTML = `
      <button type="button" class="cyber-select-trigger" aria-haspopup="listbox" aria-expanded="false" title="${escapeHtml(selectEl.title || "")}">
        <span class="cyber-select-label">${escapeHtml(initialText)}</span>
        <span class="cyber-select-arrow">▾</span>
      </button>
      <div class="cyber-select-menu" role="listbox">
        ${Array.from(selectEl.options).map(opt => `
          <div class="cyber-select-option ${opt.value === selectEl.value ? "is-selected" : ""}" 
               role="option" 
               data-value="${escapeHtml(opt.value)}"
               aria-selected="${opt.value === selectEl.value}">
            <span class="opt-text">${escapeHtml(opt.text)}</span>
            <span class="opt-check">✓</span>
          </div>
        `).join("")}
      </div>
    `;

    selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
  });
}

function renderOverviewTab(char) {
  const fields = [
    "name", "alias", "metatype", "archetype", "awakenedType",
    "gender", "age", "height", "weight", "karma", "totalKarma", "nuyen", "gameLevel"
  ];

  for (const f of fields) {
    const el = document.getElementById(`char-${f}`);
    if (el && document.activeElement !== el) {
      el.value = char.character[f] ?? "";
      if (el.tagName === "SELECT") {
        syncCyberSelect(el);
      }
    }
  }

  // Atualiza valores nas abas de Karma
  const totalKarmaVal = char.character?.totalKarma ?? 0;
  const karmaAvailVal = char.character?.karma ?? 0;
  const badgeTotal = document.getElementById("badge-karma-total");
  const badgeAvail = document.getElementById("badge-karma-avail");
  if (badgeTotal) badgeTotal.textContent = totalKarmaVal;
  if (badgeAvail) badgeAvail.textContent = karmaAvailVal;

  // Atualiza Pontos de Trama
  const plotHero = document.getElementById("val-plot-points-hero");
  const plotVal = document.getElementById("val-plot-points");
  const pts = char.character.plotPoints ?? 0;
  if (plotHero) plotHero.textContent = String(pts).padStart(2, "0");
  if (plotVal) plotVal.textContent = pts;

  // Lista de lances
  const cuesContainer = document.getElementById("cues-list-container");
  if (cuesContainer) {
    const cues = char.cues || [];
    const activeEl = document.activeElement;
    const isEditingText = cuesContainer.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (isEditingText && cuesContainer.querySelectorAll(".cue-input").length === cues.length) {
      // Se estiver editando lances, não recria a lista
    } else if (cues.length === 0) {
      cuesContainer.innerHTML = "";
    } else {
      cuesContainer.innerHTML = cues.map((cue, idx) => `
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.45rem;">
          <span style="color: var(--term-green); font-family: var(--font-mono); font-weight: 700;">“</span>
          <input type="text" class="field-input cue-input" data-index="${idx}" value="${escapeHtml(cue)}" placeholder="Frase de efeito do runner..." style="font-style: italic; flex: 1;" />
          <button class="btn-term btn-term-sm btn-remove-cue" data-index="${idx}" title="Remover Dica">✕</button>
        </div>
      `).join("");
    }
  }

  // Lista de disposições
  const dispContainer = document.getElementById("dispositions-list-container");
  if (dispContainer) {
    const disps = char.dispositions || [];
    const activeEl = document.activeElement;
    const isEditingText = dispContainer.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (isEditingText && dispContainer.querySelectorAll(".disp-input").length === disps.length) {
      // Se estiver editando disposições, não recria a lista
    } else if (disps.length === 0) {
      dispContainer.innerHTML = "";
    } else {
      dispContainer.innerHTML = disps.map((disp, idx) => `
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.45rem;">
          <span class="led-indicator led-green" style="margin-left: 0.25rem;"></span>
          <input type="text" class="field-input disp-input" data-index="${idx}" value="${escapeHtml(disp)}" placeholder="Traço de personalidade..." style="flex: 1;" />
          <button class="btn-term btn-term-sm btn-remove-disp" data-index="${idx}" title="Remover Disposição">✕</button>
        </div>
      `).join("");
    }
  }

  // Qualidades do personagem
  renderQualities(char);
}

function renderQualities(char) {
  const container = document.getElementById("qualities-list-container");
  const statusBadge = document.getElementById("qualities-status-badge");

  if (!container) return;

  // Inicia com 3 slots se a lista estiver vazia
  if (!Array.isArray(char.qualities) || char.qualities.length === 0) {
    char.qualities = [
      { id: "q_pos_1", name: "", type: "positive", effect: "" },
      { id: "q_pos_2", name: "", type: "positive", effect: "" },
      { id: "q_neg_1", name: "", type: "negative", effect: "" }
    ];
  }

  // Atualiza o contador de qualidades
  const posCount = char.qualities.filter(q => q.type === "positive").length;
  const negCount = char.qualities.filter(q => q.type === "negative").length;
  if (statusBadge) {
    if (posCount === 2 && negCount === 1) {
      statusBadge.textContent = "✓ 2 POSITIVAS // 1 NEGATIVA";
      statusBadge.style.color = "var(--term-green)";
    } else {
      statusBadge.textContent = `${posCount} POSITIVAS // ${negCount} NEGATIVAS`;
      statusBadge.style.color = "var(--term-amber)";
    }
  }

  // Preserva o foco se estiver digitando em campos de texto
  const activeEl = document.activeElement;
  if (container.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
    const inputCount = container.querySelectorAll(".quality-name-input").length;
    if (inputCount === char.qualities.length) {
      return;
    }
  }

  container.innerHTML = char.qualities.map((q, idx) => {
    const isPos = q.type !== "negative";
    const slotNum = String(idx + 1).padStart(2, "0");

    return `
      <div class="quality-card ${isPos ? "quality-positive" : "quality-negative"} bracket-box">
        <div class="quality-card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="cyber-dropdown quality-type-dropdown ${isPos ? "type-positive" : "type-negative"}" data-index="${idx}">
              <button type="button" class="cyber-dropdown-trigger quality-type-trigger" title="Alternar tipo de qualidade">
                <span class="trigger-label">${isPos ? "+ POSITIVA" : "- NEGATIVA"}</span>
                <span class="trigger-arrow">▾</span>
              </button>
              <div class="cyber-dropdown-menu quality-type-menu">
                <div class="cyber-dropdown-item quality-type-opt opt-pos ${isPos ? "is-selected" : ""}" data-index="${idx}" data-value="positive">
                  <span class="type-bullet">+</span> POSITIVA
                </div>
                <div class="cyber-dropdown-item quality-type-opt opt-neg ${!isPos ? "is-selected" : ""}" data-index="${idx}" data-value="negative">
                  <span class="type-bullet">-</span> NEGATIVA
                </div>
              </div>
              <select class="quality-type-select" data-index="${idx}" style="display: none;" title="Alternar tipo de qualidade">
                <option value="positive" ${isPos ? "selected" : ""}>+ POSITIVA</option>
                <option value="negative" ${!isPos ? "selected" : ""}>- NEGATIVA</option>
              </select>
            </div>
            <span class="quality-slot-label">// SLOT ${slotNum}</span>
          </div>
          <button type="button" class="btn-term btn-term-danger btn-term-sm btn-remove-quality" data-index="${idx}" title="Remover Qualidade">✕</button>
        </div>

        <div class="quality-card-body">
          <div class="field-block" style="margin-bottom: 0.15rem;">
            <div class="field-label" style="font-size: 0.65rem;">NOME DA QUALIDADE</div>
            <input 
              type="text" 
              class="field-input quality-name-input" 
              data-index="${idx}" 
              autocomplete="off" 
              spellcheck="false"
              value="${escapeHtml(q.name || "")}" 
              placeholder="${isPos ? "Nome da qualidade positiva..." : "Nome da qualidade negativa..."}" 
              style="font-weight: 700; color: ${isPos ? "var(--term-green)" : "var(--term-red)"}; font-size: 0.88rem;"
            />
          </div>

          <div class="field-block" style="margin-bottom: 0;">
            <div class="field-label" style="font-size: 0.65rem;">EFEITO</div>
            <textarea 
              class="field-input quality-effect-input" 
              data-index="${idx}" 
              placeholder="Descrição do efeito..."
            >${escapeHtml(q.effect || "")}</textarea>
          </div>
        </div>
      </div>
    `;
  }).join("");
}


function renderAttributesTab(char, derived) {
  const primaryContainer = document.getElementById("attributes-primary-container");
  const specialContainer = document.getElementById("attributes-special-container");

  if (!primaryContainer && !specialContainer) return;

  const renderCard = (attrDef) => {
    const isEssence = attrDef.key === "ess";
    let baseVal = 0;
    let totalVal = 0;

    if (isEssence) {
      totalVal = derived.essence.remaining;
    } else {
      const attrData = char.attributes[attrDef.key] || { base: 1, mod: 0 };
      baseVal = attrData.base || 1;
      totalVal = baseVal + (attrData.mod || 0);
    }

    const metaLimits = METATYPES[char.character.metatype]?.limits || {};
    const maxLimit = isEssence ? 6 : (metaLimits[attrDef.key] || 6);

    // Gera as barras de segmento de atributo
    const maxBar = 10;
    let segmentsHtml = "";
    for (let s = 1; s <= maxBar; s++) {
      const filled = isEssence ? s <= Math.round(totalVal * 1.66) : s <= totalVal;
      segmentsHtml += `<div class="meter-segment ${filled ? "filled" : ""} ${isEssence ? "essence-segment" : ""}"></div>`;
    }

    return `
      <div class="attr-meter-card bracket-box">
        <div class="attr-meter-header">
          <span class="name">${escapeHtml(attrDef.label)}</span>
          <span class="score">${isEssence ? (Number.isInteger(totalVal) ? totalVal : totalVal.toFixed(2)) : totalVal} <small style="font-size: 0.68rem; color: var(--text-dim); font-weight: 400;">(MÁX ${maxLimit})</small></span>
        </div>
        <div class="segmented-meter">${segmentsHtml}</div>
        <div class="attr-desc" style="font-size: 0.68rem; color: var(--text-muted); line-height: 1.25; margin-bottom: 0.35rem; min-height: 2.5em;" title="${escapeHtml(attrDef.fullText || attrDef.description)}">
          ${escapeHtml(attrDef.description)}
        </div>
        ${!isEssence ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.35rem; border-top: 1px solid var(--border-subtle);">
            <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-muted);">BASE:</span>
            <div class="stepper-tactical">
              <button class="btn-attr-dec" data-key="${attrDef.key}">-</button>
              <span class="val">${baseVal}</span>
              <button class="btn-attr-inc" data-key="${attrDef.key}">+</button>
            </div>
          </div>
        ` : `
          <div style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--term-cyan); margin-top: auto; padding-top: 0.35rem; border-top: 1px solid var(--border-subtle);">
            PERDA BIO: -${derived.essence.totalLoss.toFixed(2)}
          </div>
        `}
      </div>
    `;
  };

  const activeEl = document.activeElement;
  if (primaryContainer) {
    const primaryAttrs = ATTRIBUTES.filter(a => a.key !== "edg" && a.key !== "ess");
    primaryContainer.innerHTML = primaryAttrs.map(renderCard).join("");
  }
  if (specialContainer) {
    const specialAttrs = ATTRIBUTES.filter(a => a.key === "edg" || a.key === "ess");
    specialContainer.innerHTML = specialAttrs.map(renderCard).join("");
  }
  if (activeEl?.classList?.contains("btn-attr-inc")) {
    const key = activeEl.getAttribute("data-key");
    document.querySelector(`.btn-attr-inc[data-key="${key}"]`)?.focus();
  } else if (activeEl?.classList?.contains("btn-attr-dec")) {
    const key = activeEl.getAttribute("data-key");
    document.querySelector(`.btn-attr-dec[data-key="${key}"]`)?.focus();
  }
}

function renderSkillsTab(char, derived) {
  const container = document.getElementById("skills-list-container");
  if (container) {
    const skills = char.skills || [];
    const activeEl = document.activeElement;
    const isEditingText = container.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (isEditingText && container.querySelectorAll(".skill-tactical-item").length === skills.length) {
      // Mantém o foco se estiver digitando em perícias
    } else {
      let htmlOutput = "";

      const attributesList = [...ACTION_SKILL_ATTRIBUTES];
      if (skills.some(s => (s.attr || "").toLowerCase() === "str")) {
        attributesList.push({ key: "str", name: "Força", short: "STR" });
      }

      attributesList.forEach(attrDef => {
        const attrKey = attrDef.key;
        const attrSkills = skills
          .map((skill, originalIndex) => ({ skill, originalIndex }))
          .filter(({ skill }) => (skill.attr || "").toLowerCase() === attrKey);

        const attrScore = char.attributes?.[attrKey]?.base || 1;
        const presets = ATTRIBUTE_SKILL_PRESETS[attrKey] || [];
        const addedNames = new Set(attrSkills.map(s => s.skill.name));
        const availablePresets = presets.filter(p => !addedNames.has(p.name));

        htmlOutput += `
          <div class="skills-category-header category-${attrKey}">
            <div class="cat-title-block">
              <span class="cat-prefix">//</span>
              <span class="cat-title">${attrDef.name.toUpperCase()}</span>
              <span class="cat-attr-pill" title="Atributo ${attrDef.name}">[${attrDef.short}: ${attrScore}]</span>
            </div>
            <div class="cat-line"></div>
            <div class="cat-picker-wrap">
              <div class="cyber-dropdown skill-picker-dropdown category-${attrKey}" data-attr="${attrKey}">
                <button type="button" class="cyber-dropdown-trigger skill-picker-trigger" aria-haspopup="listbox" aria-expanded="false" title="Selecionar e adicionar perícia de ${attrDef.name}">
                  <span class="trigger-plus">+</span>
                  <span class="trigger-label">ADICIONAR PERÍCIA...</span>
                  <span class="trigger-arrow">▾</span>
                </button>
                <div class="cyber-dropdown-menu" role="listbox">
                  <div class="cyber-dropdown-header">
                    <span class="header-cat-badge">// ${attrDef.short}: ${attrScore}</span>
                    <span class="header-cat-title">PERÍCIAS DE ${attrDef.name.toUpperCase()}</span>
                  </div>
                  <div class="cyber-dropdown-scroll">
                    ${availablePresets.length === 0 ? `
                      <div class="cyber-dropdown-empty">
                        <span class="empty-bullet">▪</span> Todas as perícias de ${attrDef.name} já foram adicionadas
                      </div>
                    ` : availablePresets.map(p => `
                      <div class="cyber-dropdown-item" role="option" data-attr="${attrKey}" data-value="${escapeHtml(p.name)}" title="${escapeHtml(p.desc || "")}">
                        <div class="cyber-item-row">
                          <span class="cyber-item-name">${escapeHtml(p.name)}</span>
                          ${p.spec ? `<span class="cyber-item-spec">[${escapeHtml(p.spec)}]</span>` : ""}
                        </div>
                        ${p.desc ? `<div class="cyber-item-desc">${escapeHtml(p.desc)}</div>` : ""}
                      </div>
                    `).join("")}
                    <div class="cyber-dropdown-divider"></div>
                    <div class="cyber-dropdown-item cyber-dropdown-item-custom" role="option" data-attr="${attrKey}" data-value="__custom__" title="Adicionar perícia personalizada com nome próprio">
                      <div class="cyber-item-row">
                        <span class="cyber-item-custom-icon">✚</span>
                        <span class="cyber-item-name">+ Outra / Personalizada...</span>
                      </div>
                      <div class="cyber-item-desc">Criar nova perícia com nome e foco personalizados</div>
                    </div>
                  </div>
                </div>
              </div>
              <select class="skill-picker-select" data-attr="${attrKey}" style="display: none;" title="Selecionar e adicionar perícia de ${attrDef.name}">
                <option value="" disabled selected>+ ADICIONAR PERÍCIA...</option>
                ${availablePresets.map(p => `
                  <option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>
                `).join("")}
                <option value="__custom__">+ Outra / Personalizada...</option>
              </select>
            </div>
          </div>
        `;

        if (attrSkills.length === 0) {
          htmlOutput += `
            <div class="skill-category-empty">
              <span class="empty-icon">⬡</span> Nenhuma perícia de ${attrDef.name} adicionada.
            </div>
          `;
        } else {
          attrSkills.forEach(({ skill, originalIndex }) => {
            const pool = calculateSkillDicePool(char, skill, true);
            const isKnownPreset = presets.some(p => p.name === skill.name);
            const isCustom = skill.isCustom || !isKnownPreset;
            const desc = skill.description || getSkillDescription(skill.name, attrKey);

            htmlOutput += `
              <div class="skill-tactical-item" data-index="${originalIndex}">
                <div class="skill-name-col">
                  ${isCustom ? `
                    <input 
                      type="text" 
                      class="field-input skill-custom-name-input" 
                      data-index="${originalIndex}" 
                      value="${escapeHtml(skill.name || "")}" 
                      placeholder="Nome da perícia personalizada..." 
                      style="font-size: 0.85rem; padding: 0.2rem 0.45rem;" 
                    />
                  ` : `
                    <div class="name">${escapeHtml(skill.name)}</div>
                  `}
                  ${desc ? `<div class="skill-desc">${escapeHtml(desc)}</div>` : ""}
                </div>
                <div class="attr-tag attr-tag-${escapeHtml(skill.attr)}">[${escapeHtml(attrDef.short)}]</div>
                <div>
                  <input 
                    type="text" 
                    class="field-input field-input-mono skill-spec-input" 
                    data-index="${originalIndex}" 
                    value="${escapeHtml(skill.spec || "")}" 
                    placeholder="Especialização..." 
                    style="padding: 0.25rem 0.5rem; font-size: 0.8rem;"
                  />
                </div>
                <div class="stepper-tactical">
                  <button type="button" class="btn-skill-dec" data-index="${originalIndex}">-</button>
                  <span class="val">${skill.rating}</span>
                  <button type="button" class="btn-skill-inc" data-index="${originalIndex}">+</button>
                </div>
                <div class="pool-box" title="Reserva Final de D6">${pool}d6</div>
                <div>
                  <button 
                    type="button"
                    class="btn-term btn-term-primary btn-term-sm btn-roll-skill" 
                    data-skill-name="${escapeHtml(skill.name)}" 
                    data-pool="${pool}" 
                    data-attr="${escapeHtml(attrDef.name)}"
                    style="display: inline-flex; align-items: center; gap: 4px;"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
                      <circle cx="16" cy="16" r="1.3" fill="currentColor"/>
                    </svg>
                    ROLAR
                  </button>
                </div>
                <div>
                  <button type="button" class="btn-term btn-term-sm btn-remove-skill" data-index="${originalIndex}" title="Remover Perícia">✕</button>
                </div>
              </div>
            `;
          });
        }
      });

      container.innerHTML = htmlOutput;

      if (activeEl?.classList?.contains("btn-skill-inc")) {
        const idx = activeEl.getAttribute("data-index");
        container.querySelector(`.btn-skill-inc[data-index="${idx}"]`)?.focus();
      } else if (activeEl?.classList?.contains("btn-skill-dec")) {
        const idx = activeEl.getAttribute("data-index");
        container.querySelector(`.btn-skill-dec[data-index="${idx}"]`)?.focus();
      }
    }
  }

  // Perícias de conhecimento
  const ksContainer = document.getElementById("knowledge-skills-container");
  if (ksContainer) {
    const kSkills = char.knowledgeSkills || [];
    const activeEl = document.activeElement;
    const isEditingText = ksContainer.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (isEditingText && ksContainer.querySelectorAll(".ks-name-input").length === kSkills.length) {
      // Mantém o foco se estiver digitando nas perícias de conhecimento
    } else if (kSkills.length === 0) {
      ksContainer.innerHTML = `
        <div class="skill-category-empty">
          <span class="empty-icon">⬡</span> Nenhum idioma ou conhecimento registrado.
        </div>
      `;
    } else {
      ksContainer.innerHTML = kSkills.map((ks, idx) => `
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.45rem;">
          <input 
            type="text" 
            class="field-input ks-name-input" 
            data-index="${idx}" 
            value="${escapeHtml(ks.name)}" 
            placeholder="Perícia de Conhecimento / Idioma..." 
            style="flex: 1;" 
          />
          <button type="button" class="btn-term btn-term-sm btn-remove-ks" data-index="${idx}" title="Remover Conhecimento">✕</button>
        </div>
      `).join("");
    }
  }
}


function renderCombatTab(char, derived) {
  // Valores numéricos dos monitores
  const woundVal = document.getElementById("wound-penalty-display");
  if (woundVal) {
    const penalty = derived.woundPenalty;
    woundVal.textContent = penalty === 0 ? "0" : `${penalty} DADOS`;
    woundVal.style.color = penalty < 0 ? "var(--term-red)" : "var(--term-green)";
  }

  // Sincroniza o valor de armadura
  const armorRatingInput = document.getElementById("armor-rating-input");
  if (armorRatingInput && document.activeElement !== armorRatingInput) {
    armorRatingInput.value = Math.max(1, Number(char.condition?.armorRating) || 9);
  }

  // Monitores de dano divididos de 3 em 3 caixas
  renderTacticalTrack("armor", derived.armorMax, char.condition.armorDamage || 0, "armor-cell", "val-armor-count");
  renderTacticalTrack("physical", derived.physMax, char.condition.physicalDamage || 0, "phys-cell", "val-phys-count");
  renderTacticalTrack("stun", derived.stunMax, char.condition.stunDamage || 0, "stun-cell", "val-stun-count");

  // Atualiza indicadores de penalidade e status
  updateConditionPills(char, derived);

  // Trunfo
  const edgeVal = document.getElementById("val-edge-count");
  if (edgeVal) {
    const currentEdge = char.condition.edgeCurrent ?? 1;
    edgeVal.textContent = currentEdge;
  }
}

function updateConditionPills(char, derived) {
  const armorPill = document.getElementById("armor-status-pill");
  const armorDmg = char.condition?.armorDamage || 0;
  const armorMax = derived.armorMax || 9;
  if (armorPill) {
    if (armorDmg === 0) {
      armorPill.textContent = "ÍNTEGRA";
      armorPill.className = "condition-status-pill pill-status-ok";
    } else if (armorDmg >= armorMax) {
      armorPill.textContent = "DESTRUÍDA";
      armorPill.className = "condition-status-pill pill-status-danger";
    } else {
      armorPill.textContent = `AVARIADA`;
      armorPill.className = "condition-status-pill pill-status-warn";
    }
  }

  const physPill = document.getElementById("phys-status-pill");
  const physDmg = char.condition?.physicalDamage || 0;
  const physMax = derived.physMax || 10;
  if (physPill) {
    if (physDmg === 0) {
      physPill.textContent = "ÍNTEGRO";
      physPill.className = "condition-status-pill pill-status-ok";
    } else if (physDmg >= physMax) {
      physPill.textContent = "INCAPACITADO";
      physPill.className = "condition-status-pill pill-status-danger";
    } else {
      const p = Math.floor(physDmg / 3);
      if (p > 0) {
        physPill.textContent = `FERIDO (-${p}D)`;
        physPill.className = p >= 2 ? "condition-status-pill pill-status-danger" : "condition-status-pill pill-status-warn";
      } else {
        physPill.textContent = "ARRANHADO";
        physPill.className = "condition-status-pill pill-status-ok";
      }
    }
  }

  const stunPill = document.getElementById("stun-status-pill");
  const stunDmg = char.condition?.stunDamage || 0;
  const stunMax = derived.stunMax || 10;
  if (stunPill) {
    if (stunDmg === 0) {
      stunPill.textContent = "LÚCIDO";
      stunPill.className = "condition-status-pill pill-status-ok";
    } else if (stunDmg >= stunMax) {
      stunPill.textContent = "COLAPSADO";
      stunPill.className = "condition-status-pill pill-status-danger";
    } else {
      const p = Math.floor(stunDmg / 3);
      if (p > 0) {
        stunPill.textContent = `ATORDOADO (-${p}D)`;
        stunPill.className = p >= 2 ? "condition-status-pill pill-status-danger" : "condition-status-pill pill-status-warn";
      } else {
        stunPill.textContent = "FADIGADO";
        stunPill.className = "condition-status-pill pill-status-ok";
      }
    }
  }
}

function renderTacticalTrack(trackType, maxBoxes, currentDamage, cellClass, counterId) {
  const container = document.getElementById(`track-${trackType}-boxes`);
  const counter = document.getElementById(counterId);

  if (counter) counter.textContent = `${currentDamage} / ${maxBoxes}`;
  if (!container) return;

  let tripletsHtml = "";
  let currentTripletCells = "";

  for (let i = 1; i <= maxBoxes; i++) {
    const isMarked = i <= currentDamage;
    const isThreshold = (trackType !== "armor") && (i % 3 === 0);
    const penaltyTag = isThreshold ? `-${i / 3}D` : "";

    currentTripletCells += `
      <div 
        class="track-cell ${cellClass} ${isMarked ? "marked" : ""}" 
        data-track="${trackType}" 
        data-index="${i}"
        title="Caixa ${i} (Clique para marcar/limpar)"
      >
        <span>${i}</span>
        ${isThreshold ? `<span class="cell-penalty-sub">${penaltyTag}</span>` : ""}
      </div>
    `;

    if (i % 3 === 0 || i === maxBoxes) {
      tripletsHtml += `<div class="track-triplet">${currentTripletCells}</div>`;
      currentTripletCells = "";
    }
  }

  container.innerHTML = tripletsHtml;
}


function renderWeaponsTab(char) {
  const container = document.getElementById("weapons-list-container");
  if (!container) return;

  const weapons = char.weapons || [];
  const activeEl = document.activeElement;
  const isEditingText = container.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
  if (isEditingText && container.querySelectorAll(".weapon-tactical-card").length === weapons.length) {
    return;
  }
  if (weapons.length === 0) {
    container.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim); padding: 2rem; text-align: center; border: 1px dashed var(--border-panel); border-radius: var(--radius-xs);">// ARSENAL VAZIO.</div>`;
    return;
  }

  const datalistHtml = `
    <datalist id="sra-weapons-datalist">
      ${OFFICIAL_SRA_WEAPONS.map(wp => `<option value="${escapeHtml(wp.name)}">[${escapeHtml(wp.category)}] ${escapeHtml(wp.damage)} (${escapeHtml(wp.range)})</option>`).join("")}
    </datalist>
  `;

  container.innerHTML = datalistHtml + weapons.map((w, idx) => `
    <div class="weapon-tactical-card bracket-box">
      <div class="weapon-card-header">
        <div class="weapon-reg-title-wrap" style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
          <span class="weapon-reg-id">WEAPON // 00${idx + 1}</span>
          <input type="text" class="field-input wep-name-input" data-index="${idx}" list="sra-weapons-datalist" value="${escapeHtml(w.name)}" style="font-weight: 700; color: var(--term-green); flex: 1;" placeholder="Nome da Arma..." />
        </div>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn-term btn-term-danger btn-term-sm btn-remove-weapon" data-index="${idx}">
            ✕ EXCLUIR
          </button>
        </div>
      </div>

      <div class="weapon-metrics-grid">
        <div>
          <div class="field-label">DANO (DV)</div>
          <input type="text" class="field-input field-input-mono wep-dmg-input" data-index="${idx}" value="${escapeHtml(w.damage || "")}" placeholder="Ex: 8F, 6A..." />
        </div>
        <div>
          <div class="field-label">ALCANCE</div>
          <input type="text" class="field-input wep-range-input" data-index="${idx}" value="${escapeHtml(w.range || "")}" placeholder="Ex: Perto, Afastado, Distante" />
        </div>
      </div>

      <div style="margin-top: 0.35rem;">
        <input type="text" class="field-input wep-notes-input" data-index="${idx}" value="${escapeHtml(w.notes || "")}" placeholder="Acessórios e notas..." />
      </div>
    </div>
  `).join("");
}

function renderShadowAmpsTab(char, derived) {
  const container = document.getElementById("shadow-amps-container");
  const essenceCounter = document.getElementById("amps-essence-display");
  const essencePercent = document.getElementById("amps-essence-percent");
  const essenceSegments = document.getElementById("essence-bar-segments");
  if (essenceCounter) essenceCounter.textContent = `${derived.essence.remaining.toFixed(2)} / 6.00`;
  if (essencePercent) {
    const pct = Math.round((derived.essence.remaining / 6.0) * 100);
    essencePercent.textContent = `${pct}% INTATOS`;
  }

  // 12 segmentos de Essência
  if (essenceSegments) {
    let segHtml = "";
    for (let i = 1; i <= 12; i++) {
      const active = i <= Math.round(derived.essence.remaining * 2);
      segHtml += `<div class="meter-segment ${active ? "filled essence-segment" : ""}"></div>`;
    }
    essenceSegments.innerHTML = segHtml;
  }

  if (!container) return;

  const amps = char.shadowAmps || [];
  const activeEl = document.activeElement;
  const isEditingText = container.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
  if (isEditingText && container.querySelectorAll(".amp-diagnostic-item").length === amps.length) {
    return;
  }
  if (amps.length === 0) {
    container.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim); padding: 2rem; text-align: center; border: 1px dashed var(--border-panel); border-radius: var(--radius-xs);">// NENHUMA AMPLIFICAÇÃO INSTALADA.</div>`;
    return;
  }

  container.innerHTML = amps.map((amp, idx) => `
    <div class="amp-diagnostic-item">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 2;">
          <span class="sys-tag" style="color: var(--term-green);">[●] INSTALLED</span>
          <input type="text" class="field-input amp-name-input" data-index="${idx}" value="${escapeHtml(amp.name)}" style="font-weight: 700; color: var(--text-bright);" placeholder="Nome da Amplificação..." />
        </div>

        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <div class="stepper-tactical">
            <button class="btn-amp-lvl-dec" data-index="${idx}">-</button>
            <span class="val">Nv ${amp.level || 1}</span>
            <button class="btn-amp-lvl-inc" data-index="${idx}">+</button>
          </div>
          <button class="btn-term btn-term-danger btn-term-sm btn-remove-amp" data-index="${idx}">✕</button>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; align-items: center; font-family: var(--font-mono); font-size: 0.75rem; margin-bottom: 0.4rem;">
        <span style="color: var(--text-muted);">CUSTO DE ESSÊNCIA:</span>
        <input type="number" step="0.1" min="0" max="6" class="field-input field-input-mono amp-ess-input" data-index="${idx}" value="${amp.essenceCost ?? 0}" style="width: 70px; padding: 0.2rem 0.4rem;" />
      </div>

      <div>
        <textarea class="field-input amp-effect-input" data-index="${idx}" placeholder="Efeito da amplificação...">${escapeHtml(amp.effect || "")}</textarea>
      </div>
    </div>
  `).join("");

  if (activeEl?.classList?.contains("btn-amp-lvl-inc")) {
    const idx = activeEl.getAttribute("data-index");
    container.querySelector(`.btn-amp-lvl-inc[data-index="${idx}"]`)?.focus();
  } else if (activeEl?.classList?.contains("btn-amp-lvl-dec")) {
    const idx = activeEl.getAttribute("data-index");
    container.querySelector(`.btn-amp-lvl-dec[data-index="${idx}"]`)?.focus();
  }
}

function renderGearTab(char) {
  // Equipamentos
  const gearContainer = document.getElementById("gear-list-container");
  if (gearContainer) {
    const gear = char.gear || [];
    const activeEl = document.activeElement;
    const isEditingText = gearContainer.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (isEditingText && gearContainer.querySelectorAll(".gear-name-input").length === gear.length) {
      // Mantém o foco se estiver digitando nos equipamentos
    } else if (gear.length === 0) {
      gearContainer.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim); padding: 0.5rem 0;">// INVENTÁRIO VAZIO.</div>`;
    } else {
      gearContainer.innerHTML = gear.map((g, idx) => `
        <div class="gear-tactical-row" style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.45rem;">
          <span class="sys-tag" style="color: var(--term-green);">[0${idx + 1}]</span>
          <input type="text" class="field-input gear-name-input" data-index="${idx}" value="${escapeHtml(g.name)}" placeholder="Item..." style="flex: 2;" />
          <input type="number" min="1" class="field-input field-input-mono gear-qty-input" data-index="${idx}" value="${g.qty || 1}" style="width: 60px;" placeholder="Qtd" />
          <input type="text" class="field-input gear-notes-input" data-index="${idx}" value="${escapeHtml(g.notes || "")}" placeholder="Especificações..." style="flex: 3;" />
          <button class="btn-term btn-term-sm btn-remove-gear" data-index="${idx}">✕</button>
        </div>
      `).join("");
    }
  }
}

function renderContactsTab(char) {
  // Contatos
  const contactsContainer = document.getElementById("contacts-list-container");
  if (contactsContainer) {
    const contacts = char.contacts || [];
    const activeEl = document.activeElement;
    const isEditingText = contactsContainer.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (isEditingText && contactsContainer.querySelectorAll(".contact-name-input").length === contacts.length) {
      // Mantém o foco se estiver digitando nos contatos
    } else if (contacts.length === 0) {
      contactsContainer.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim); padding: 0.5rem 0;">// NENHUM CONTATO REGISTRADO.</div>`;
    } else {
      contactsContainer.innerHTML = contacts.map((c, idx) => `
        <div class="weapon-tactical-card bracket-box">
          <div class="contact-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <input type="text" class="field-input contact-name-input" data-index="${idx}" value="${escapeHtml(c.name)}" style="font-weight: 700; color: var(--term-green); flex: 2;" placeholder="Contato..." />
            <input type="text" class="field-input contact-role-input" data-index="${idx}" value="${escapeHtml(c.role || "")}" placeholder="Papel / Ocupação..." style="flex: 2; margin-left: 0.5rem;" />
            <button class="btn-term btn-term-danger btn-term-sm btn-remove-contact" data-index="${idx}" style="margin-left: 0.5rem;">✕</button>
          </div>
          <div class="contact-steppers-row" style="display: flex; gap: 1.5rem; margin: 0.4rem 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="field-label" style="margin: 0;">CONEXÃO:</span>
              <div class="stepper-tactical">
                <button class="btn-conn-dec" data-index="${idx}">-</button>
                <span class="val">${c.connection || 1}</span>
                <button class="btn-conn-inc" data-index="${idx}">+</button>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="field-label" style="margin: 0;">LEALDADE:</span>
              <div class="stepper-tactical">
                <button class="btn-loy-dec" data-index="${idx}">-</button>
                <span class="val">${c.loyalty || 1}</span>
                <button class="btn-loy-inc" data-index="${idx}">+</button>
              </div>
            </div>
          </div>
          <div>
            <input type="text" class="field-input contact-notes-input" data-index="${idx}" value="${escapeHtml(c.notes || "")}" placeholder="Local de encontro e observações..." />
          </div>
        </div>
      `).join("");

      if (activeEl?.classList?.contains("btn-conn-inc")) {
        const idx = activeEl.getAttribute("data-index");
        contactsContainer.querySelector(`.btn-conn-inc[data-index="${idx}"]`)?.focus();
      } else if (activeEl?.classList?.contains("btn-conn-dec")) {
        const idx = activeEl.getAttribute("data-index");
        contactsContainer.querySelector(`.btn-conn-dec[data-index="${idx}"]`)?.focus();
      } else if (activeEl?.classList?.contains("btn-loy-inc")) {
        const idx = activeEl.getAttribute("data-index");
        contactsContainer.querySelector(`.btn-loy-inc[data-index="${idx}"]`)?.focus();
      } else if (activeEl?.classList?.contains("btn-loy-dec")) {
        const idx = activeEl.getAttribute("data-index");
        contactsContainer.querySelector(`.btn-loy-dec[data-index="${idx}"]`)?.focus();
      }
    }
  }
}

function renderNotesTab(char) {
  const notesEl = document.getElementById("char-notes");
  if (notesEl && document.activeElement !== notesEl) {
    notesEl.value = char.notes || "";
  }
}

// Sistema de temas da interface

// Aplica o tema visual selecionado
export function applyTheme(themeId, customHex = null) {
  const root = document.documentElement;

  if (themeId === "custom" && customHex) {
    const rgb = hexToRgb(customHex);
    if (!rgb) return;
    const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    root.setAttribute("data-theme", "custom");
    root.style.setProperty("--term-green-rgb", rgbStr);
    root.style.setProperty("--term-green", customHex);

    const brightR = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.45));
    const brightG = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.45));
    const brightB = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.45));
    root.style.setProperty("--term-green-bright", `rgb(${brightR}, ${brightG}, ${brightB})`);
    root.style.setProperty("--term-green-dim", `rgba(${rgbStr}, 0.09)`);
    root.style.setProperty("--term-green-dimmer", `rgba(${rgbStr}, 0.04)`);
    root.style.setProperty("--term-green-border", `rgba(${rgbStr}, 0.32)`);
    root.style.setProperty("--term-green-border-strong", `rgba(${rgbStr}, 0.68)`);
    root.style.setProperty("--term-green-glow", `0 0 10px rgba(${rgbStr}, 0.40)`);
    root.style.setProperty("--term-green-glow-lg", `0 0 22px rgba(${rgbStr}, 0.25)`);
    root.style.setProperty("--border-panel", `rgba(${rgbStr}, 0.18)`);
    root.style.setProperty("--border-tech", `rgba(${rgbStr}, 0.28)`);
    root.style.setProperty("--border-bright", `rgba(${rgbStr}, 0.55)`);
    root.style.setProperty("--border-active", customHex);
    root.style.setProperty("--text-code", customHex);

    const bgR = Math.round(rgb.r * 0.025);
    const bgG = Math.round(rgb.g * 0.025);
    const bgB = Math.round(rgb.b * 0.025);
    root.style.setProperty("--bg-void", `rgb(${bgR}, ${bgG}, ${bgB})`);
    root.style.setProperty("--bg-base", `rgb(${bgR + 3}, ${bgG + 4}, ${bgB + 4})`);
    root.style.setProperty("--bg-panel", `rgba(${bgR + 6}, ${bgG + 8}, ${bgB + 8}, 0.88)`);
    root.style.setProperty("--bg-panel-solid", `rgb(${bgR + 6}, ${bgG + 8}, ${bgB + 8})`);
    root.style.setProperty("--bg-card", `rgba(${bgR + 10}, ${bgG + 14}, ${bgB + 14}, 0.72)`);
    root.style.setProperty("--bg-card-solid", `rgb(${bgR + 10}, ${bgG + 14}, ${bgB + 14})`);
    root.style.setProperty("--bg-elevated", `rgba(${bgR + 16}, ${bgG + 22}, ${bgB + 22}, 0.82)`);
    root.style.setProperty("--bg-elevated-solid", `rgb(${bgR + 16}, ${bgG + 22}, ${bgB + 22})`);
  } else {
    // Tema predefinido: usa a classe [data-theme]
    root.removeAttribute("style");
    root.setAttribute("data-theme", themeId || DEFAULT_THEME_ID);
  }

  // Atualiza a cor do indicador no cabeçalho
  const headerDot = document.getElementById("header-theme-dot");
  if (headerDot) {
    if (themeId === "custom" && customHex) {
      headerDot.style.backgroundColor = customHex;
      headerDot.style.boxShadow = `0 0 8px ${customHex}`;
    } else {
      headerDot.style.backgroundColor = "";
      headerDot.style.boxShadow = "";
    }
  }

  // Atualiza o theme-color do navegador
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const computedBg = getComputedStyle(root).getPropertyValue("--bg-base").trim() || "#08090b";
    metaTheme.setAttribute("content", computedBg);
  }

  // Sincroniza os indicadores na tela
  updateThemeIndicators(themeId, customHex);
}

// Renderiza a lista de temas e campos de cor personalizada
export function renderThemeModal(activeThemeId, activeCustomHex = null) {
  const grid = document.getElementById("theme-presets-grid");
  if (!grid) return;

  grid.innerHTML = THEME_PRESETS.map((p) => {
    const isActive = activeThemeId === p.id;
    return `
      <div class="theme-preset-card ${isActive ? "active" : ""}" data-theme-id="${p.id}" tabindex="0" role="button" aria-pressed="${isActive}">
        <div class="theme-card-top">
          <span class="theme-card-swatch" style="background-color: ${p.hex}; color: ${p.hex};"></span>
          <span class="sys-tag" style="color: ${p.hex}; border-color: ${p.hex}55; background: ${p.hex}18; font-size: 0.6rem;">${p.code}</span>
        </div>
        <div class="theme-card-name" style="margin-top: 0.2rem;">${escapeHtml(p.name)}</div>
        ${isActive ? `<div class="theme-card-badge" style="align-self: flex-start; margin-top: 0.3rem;">[● ATIVO]</div>` : ""}
      </div>
    `;
  }).join("");

  const customPicker = document.getElementById("input-theme-custom-picker");
  const customHex = document.getElementById("input-theme-custom-hex");

  if (activeThemeId === "custom" && activeCustomHex) {
    if (customPicker) customPicker.value = activeCustomHex;
    if (customHex) customHex.value = activeCustomHex;
  } else {
    const activePreset = THEME_PRESETS.find(p => p.id === activeThemeId) || THEME_PRESETS[0];
    if (customPicker) customPicker.value = activePreset.hex;
    if (customHex) customHex.value = activePreset.hex;
  }
}

// Atualiza os seletores visuais do tema ativo
export function updateThemeIndicators(activeThemeId, activeCustomHex = null) {
  // Atualiza os cartões de tema
  const cards = document.querySelectorAll(".theme-preset-card");
  cards.forEach((card) => {
    const id = card.dataset.themeId;
    const isActive = id === activeThemeId;
    card.classList.toggle("active", isActive);
    card.setAttribute("aria-pressed", isActive ? "true" : "false");

    // Atualiza a tag de ativo
    let badge = card.querySelector(".theme-card-badge");
    if (isActive && !badge) {
      badge = document.createElement("div");
      badge.className = "theme-card-badge";
      badge.style.alignSelf = "flex-start";
      badge.style.marginTop = "0.3rem";
      badge.textContent = "[● ATIVO]";
      card.appendChild(badge);
    } else if (!isActive && badge) {
      badge.remove();
    }
  });
}

// Abre o modal de temas
export function openThemeModal(activeThemeId, activeCustomHex) {
  const modal = document.getElementById("modal-theme-selector");
  if (!modal) return;
  renderThemeModal(activeThemeId, activeCustomHex);
  modal.classList.add("active");
}

// Fecha o modal de temas
export function closeThemeModal() {
  const modal = document.getElementById("modal-theme-selector");
  if (modal) modal.classList.remove("active");
}

