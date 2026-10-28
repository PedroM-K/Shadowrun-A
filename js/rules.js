// Regras e cálculos derivados de Shadowrun: Anarchy

import { METATYPES, GAME_LEVELS } from "./constants.js";

// Retorna o total do atributo (base + modificador)
export function getAttributeTotal(charData, attrKey) {
  if (!charData?.attributes?.[attrKey]) return 0;
  const attr = charData.attributes[attrKey];
  return (Number(attr.base) || 0) + (Number(attr.mod) || 0);
}

// Calcula a Essência restante subtraindo custos de ciberware/bioware/amps
export function calculateEssence(charData) {
  const amps = Array.isArray(charData?.shadowAmps) ? charData.shadowAmps : [];
  let totalEssenceLoss = 0;

  for (const amp of amps) {
    let cost = 0;
    if (amp.essenceCost !== undefined && amp.essenceCost !== null && amp.essenceCost !== "") {
      cost = Math.max(0, Number(amp.essenceCost) || 0);
    } else if (amp.type === "cyberware") {
      cost = 1.0;
    } else if (amp.type === "bioware") {
      cost = 0.5;
    }
    totalEssenceLoss += cost;
  }

  // Qualidade Biocompatibilidade: ignora 1 ponto de custo de Essência (se houver perda)
  const qualities = Array.isArray(charData?.qualities) ? charData.qualities : [];
  const hasBiocompatibility = qualities.some(q => 
    q.name && q.name.trim().toLowerCase().includes("biocompatibilidade")
  );
  if (hasBiocompatibility && totalEssenceLoss > 0) {
    totalEssenceLoss = Math.max(0, totalEssenceLoss - 1);
  }

  const remaining = Math.max(0, 6.0 - totalEssenceLoss);
  return {
    remaining: Number(remaining.toFixed(2)),
    totalLoss: Number(totalEssenceLoss.toFixed(2))
  };
}

// Penalidades por perda de Essência em magia e cura
export function calculateEssencePenalty(essenceRemaining) {
  if (essenceRemaining >= 5.5) return 0;
  if (essenceRemaining >= 3.5) return -1;
  if (essenceRemaining >= 1.5) return -2;
  return -3;
}

// Monitor Físico: 8 + metade de Força (arredondado para cima)
export function calculatePhysicalTrackMax(charData) {
  const str = getAttributeTotal(charData, "str");
  return 8 + Math.ceil(str / 2);
}

// Monitor de Atordoamento: 8 + metade de Vontade (arredondado para cima)
export function calculateStunTrackMax(charData) {
  const wil = getAttributeTotal(charData, "wil");
  return 8 + Math.ceil(wil / 2);
}

// Monitor de Armadura: armadura base + bônus de metatipo e ciberware
export function calculateArmorTrackMax(charData) {
  let baseArmor = Number(charData?.condition?.armorRating) || 9;

  // Bônus de Troll (+3 de armadura natural)
  if (charData?.character?.metatype === "Troll") {
    baseArmor += 3;
  }

  // Bônus de blindagem dérmica em Shadow Amps
  const amps = Array.isArray(charData?.shadowAmps) ? charData.shadowAmps : [];
  for (const amp of amps) {
    const text = (amp.name + " " + (amp.effect || "")).toLowerCase();
    if (text.includes("dermal") || text.includes("dérmica") || text.includes("blindagem")) {
      const bonus = Number(amp.level) || 1;
      baseArmor += bonus;
    }
  }

  return Math.max(0, baseArmor);
}

// Penalidade de dano: -1 a cada 3 caixas marcadas (Físico ou Atordoamento)
export function calculateWoundPenalty(charData) {
  const physDamage = Math.max(0, Number(charData?.condition?.physicalDamage) || 0);
  const stunDamage = Math.max(0, Number(charData?.condition?.stunDamage) || 0);

  const physPenalty = Math.floor(physDamage / 3);
  const stunPenalty = Math.floor(stunDamage / 3);

  return -(physPenalty + stunPenalty);
}

// Reserva de Defesa: Agilidade + Lógica + bônus de amps - penalidade de dano
export function calculateDefensePool(charData) {
  const agi = getAttributeTotal(charData, "agi");
  const log = getAttributeTotal(charData, "log");
  const wounds = calculateWoundPenalty(charData);

  // Verifica reflexos com fio ou amplificações de defesa
  let ampBonus = 0;
  const amps = Array.isArray(charData?.shadowAmps) ? charData.shadowAmps : [];
  for (const amp of amps) {
    const text = (amp.name + " " + (amp.effect || "")).toLowerCase();
    if (text.includes("wired reflexes") || text.includes("reflexos com fio") || text.includes("defesa")) {
      ampBonus += Number(amp.level) || 1;
    }
  }

  const total = Math.max(0, agi + log + ampBonus + wounds);
  return {
    base: agi + log,
    ampBonus,
    wounds,
    total
  };
}

// Reserva de Percepção: Lógica + Vontade - penalidade de dano
export function calculatePerceptionPool(charData) {
  const log = getAttributeTotal(charData, "log");
  const wil = getAttributeTotal(charData, "wil");
  const wounds = calculateWoundPenalty(charData);
  const total = Math.max(0, log + wil + wounds);
  return {
    base: log + wil,
    wounds,
    total
  };
}

// Defesa Mental/Mágica: Vontade + Lógica - penalidade de dano
export function calculateMentalDefensePool(charData) {
  const wil = getAttributeTotal(charData, "wil");
  const log = getAttributeTotal(charData, "log");
  const wounds = calculateWoundPenalty(charData);
  const total = Math.max(0, wil + log + wounds);
  return {
    base: wil + log,
    wounds,
    total
  };
}

// Defesa Matricial: (Lógica * 2) - penalidade de dano
export function calculateMatrixDefensePool(charData) {
  const log = getAttributeTotal(charData, "log");
  const wounds = calculateWoundPenalty(charData);
  const total = Math.max(0, (log * 2) + wounds);
  return {
    base: log * 2,
    wounds,
    total
  };
}

// Reserva de perícia: Atributo + Nível (+2 se especialização ativa) - dano
export function calculateSkillDicePool(charData, skill, useSpecialization = false) {
  if (!skill) return 0;
  const rating = Number(skill.rating) || 0;
  const attrVal = getAttributeTotal(charData, skill.attr);
  const specBonus = (useSpecialization && skill.spec) ? 2 : 0;
  const wounds = calculateWoundPenalty(charData);

  return Math.max(0, rating + attrVal + specBonus + wounds);
}

// Contabiliza pontos gastos na criação de personagem
export function calculateCreationPointsSpent(charData) {
  const levelKey = charData?.character?.gameLevel || "street_runner";
  const gameLevel = GAME_LEVELS[levelKey] || GAME_LEVELS.street_runner;
  const metatypeKey = charData?.character?.metatype || "Human";
  const meta = METATYPES[metatypeKey] || METATYPES.Human;

  // 1. Atributos: pontos gastos acima do valor inicial do metatipo
  const metaBase = meta.base || {};
  const metaBonus = meta.bonuses || {};
  const attrs = charData?.attributes || {};

  const strSpent = Math.max(0, (attrs.str?.base ?? metaBase.str ?? 1) - (metaBase.str ?? 1));
  const agiSpent = Math.max(0, (attrs.agi?.base ?? metaBase.agi ?? 1) - (metaBase.agi ?? 1));
  const wilSpent = Math.max(0, (attrs.wil?.base ?? metaBase.wil ?? 1) - (metaBase.wil ?? 1));
  const logSpent = Math.max(0, (attrs.log?.base ?? metaBase.log ?? 1) - (metaBase.log ?? 1));
  const chaSpent = Math.max(0, (attrs.cha?.base ?? metaBase.cha ?? 1) - (metaBase.cha ?? 1));
  const edgSpent = Math.max(0, (attrs.edg?.base ?? metaBase.edg ?? 1) - (metaBase.edg ?? 1));

  const attrPointsSpent = strSpent + agiSpent + wilSpent + logSpent + chaSpent + edgSpent;
  const attrPointsMax = gameLevel.attrPoints;

  // 2. Perícias: pontos gastos nos níveis de perícia
  const armorRating = Number(charData?.condition?.armorRating) || 0;
  const armorSkillMod = (armorRating === 6) ? 1 : ((armorRating === 12) ? -1 : 0);

  const skills = Array.isArray(charData?.skills) ? charData.skills : [];
  let skillPointsSpent = 0;
  skills.forEach(s => {
    skillPointsSpent += Math.max(0, Number(s.rating) || 0);
  });
  const skillPointsMax = Math.max(1, gameLevel.skillPoints + (metaBonus.skillPoints || 0) + armorSkillMod);

  // 3. Shadow Amps: soma dos níveis (+2 se Desperto ou Emergido)
  const amps = Array.isArray(charData?.shadowAmps) ? charData.shadowAmps : [];
  let ampPointsSpent = 0;
  amps.forEach(a => {
    ampPointsSpent += Math.max(1, Number(a.level) || 1);
  });
  const awakenedType = charData?.character?.awakenedType || "";
  if (awakenedType === "awakened" || awakenedType === "emerged" || awakenedType === "awakened_mage" || awakenedType === "awakened_adept" || awakenedType === "emerged_techno") {
    ampPointsSpent += 2;
  }
  const ampPointsMax = gameLevel.ampPoints;

  // Pontos restantes de amps viram Trunfo
  const leftoverAmps = Math.max(0, ampPointsMax - ampPointsSpent);

  const specsCount = skills.filter(s => s.spec && s.spec.trim()).length;

  return {
    gameLevel,
    attrPointsSpent,
    attrPointsMax,
    skillPointsSpent,
    skillPointsMax,
    armorSkillMod,
    ampPointsSpent,
    ampPointsMax,
    leftoverAmps,
    skillsCount: skills.length,
    skillsCountMax: 5, // Começa com até 5 perícias
    specsCount,
    specsCountMax: 1, // Começa com 1 especialização
    weaponsCount: (charData?.weapons || []).length,
    weaponsCountMax: gameLevel.weapons || 2,
    contactsCount: (charData?.contacts || []).length,
    contactsCountMax: gameLevel.contacts || 2
  };
}

// Resumo de todos os cálculos derivados
export function calculateDerivedStats(charData) {
  const essence = calculateEssence(charData);
  const essencePenalty = calculateEssencePenalty(essence.remaining);
  const physMax = calculatePhysicalTrackMax(charData);
  const stunMax = calculateStunTrackMax(charData);
  const armorMax = calculateArmorTrackMax(charData);
  const woundPenalty = calculateWoundPenalty(charData);
  const defense = calculateDefensePool(charData);
  const perception = calculatePerceptionPool(charData);
  const mentalDefense = calculateMentalDefensePool(charData);
  const matrixDefense = calculateMatrixDefensePool(charData);
  const creationPoints = calculateCreationPointsSpent(charData);

  return {
    essence,
    essencePenalty,
    physMax,
    stunMax,
    armorMax,
    woundPenalty,
    defense,
    perception,
    mentalDefense,
    matrixDefense,
    creationPoints
  };
}
