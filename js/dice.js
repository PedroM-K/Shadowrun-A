// Rolador de dados d6 para Shadowrun: Anarchy

export function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD6Pool(poolSize, options = {}) {
  const { useAnarchyDie = true, useEdgePreRoll = false } = options;
  // Se rolar com Trunfo, adiciona 1 dado extra
  const actualPool = Math.max(1, Math.floor(poolSize) + (useEdgePreRoll ? 1 : 0));
  const dice = [];
  let onesCount = 0;
  let hits = 0;
  let anarchyDieResult = null;

  for (let i = 0; i < actualPool; i++) {
    const isAnarchyDie = useAnarchyDie && i === 0;
    const val = rollDie();
    const isHit = useEdgePreRoll ? (val >= 4) : (val >= 5);
    const isOne = val === 1;

    const dieObj = {
      value: val,
      isHit,
      isOne,
      isAnarchyDie,
      rerolled: false
    };

    if (isAnarchyDie) {
      anarchyDieResult = dieObj;
    }

    dice.push(dieObj);
    if (isHit) hits++;
    if (isOne) onesCount++;
  }

  // Verificação de falhas e brechas no Dado de Falha (1 = Falha, 5 ou 6 = Brecha)
  const isAnarchyGlitch = useAnarchyDie && anarchyDieResult?.value === 1;
  const isAnarchyExploit = useAnarchyDie && (anarchyDieResult?.value >= 5);
  const isThresholdGlitch = onesCount > (dice.length / 2);
  const isGlitch = isAnarchyGlitch || isThresholdGlitch;

  let glitchStatus = "none";
  if (isGlitch) glitchStatus = "glitch";
  else if (isAnarchyExploit) glitchStatus = "exploit";

  return {
    poolSize: actualPool,
    originalPool: poolSize,
    dice,
    hits,
    onesCount,
    glitchStatus,
    isGlitch,
    isAnarchyGlitch,
    isAnarchyExploit,
    isThresholdGlitch,
    useAnarchyDie,
    useEdgePreRoll,
    timestamp: new Date().toLocaleTimeString()
  };
}

export function recalculateRollStats(dice, options = {}) {
  const { useAnarchyDie = true, useEdgePreRoll = false } = options;
  let onesCount = 0;
  let hits = 0;
  let anarchyDieResult = null;

  for (let i = 0; i < dice.length; i++) {
    const d = dice[i];
    d.isHit = useEdgePreRoll ? (d.value >= 4) : (d.value >= 5);
    d.isOne = d.value === 1;
    if (d.isAnarchyDie) {
      anarchyDieResult = d;
    }
    if (d.isHit) hits++;
    if (d.isOne) onesCount++;
  }

  const isAnarchyGlitch = useAnarchyDie && anarchyDieResult?.value === 1;
  const isAnarchyExploit = useAnarchyDie && (anarchyDieResult?.value >= 5);
  const isThresholdGlitch = onesCount > (dice.length / 2);
  const isGlitch = isAnarchyGlitch || isThresholdGlitch;

  let glitchStatus = "none";
  if (isGlitch) glitchStatus = "glitch";
  else if (isAnarchyExploit) glitchStatus = "exploit";

  return {
    poolSize: dice.length,
    dice,
    hits,
    onesCount,
    glitchStatus,
    isGlitch,
    isAnarchyGlitch,
    isAnarchyExploit,
    isThresholdGlitch,
    useAnarchyDie,
    useEdgePreRoll,
    timestamp: new Date().toLocaleTimeString()
  };
}

// Re-rola os dados que não deram acerto usando Trunfo
export function rerollFailedDice(currentRoll) {
  if (!currentRoll || !Array.isArray(currentRoll.dice)) return currentRoll;

  const newDice = currentRoll.dice.map(die => {
    if (!die.isHit) {
      const newVal = rollDie();
      const isHit = currentRoll.useEdgePreRoll ? (newVal >= 4) : (newVal >= 5);
      return {
        ...die,
        value: newVal,
        isHit,
        isOne: newVal === 1,
        rerolled: true
      };
    }
    return { ...die };
  });

  return recalculateRollStats(newDice, {
    useAnarchyDie: currentRoll.useAnarchyDie,
    useEdgePreRoll: currentRoll.useEdgePreRoll
  });
}


