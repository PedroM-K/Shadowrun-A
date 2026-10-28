/**
 * Terminal Clandestino de Gerenciamento de Runner (Shadowrun: Anarchy)
 * Bundle dos módulos JavaScript para o site e aplicativo desktop.
 */
(function () {
  "use strict";

  // --- Constantes ---
  // Constantes e configurações padrão de Shadowrun: Anarchy

  const SCHEMA_VERSION = 1;
  const SYSTEM_NAME = "Shadowrun: Anarchy";
  const STORAGE_KEY = "sra_sheet_active_char_v2";
  const STORAGE_ROSTER_KEY = "sra_characters_roster_v2";
  const STORAGE_ACTIVE_ID_KEY = "sra_active_character_id_v2";
  const STORAGE_BACKUP_PREFIX = "sra_sheet_backup_";
  const STORAGE_THEME_KEY = "sra_terminal_theme_v1";

  const DEFAULT_THEME_ID = "matrix";

  const THEME_PRESETS = [
    {
      id: "matrix",
      name: "Verde",
      code: "CRT-P1",
      hex: "#00ff66",
      rgb: "0, 255, 102",
      isDefault: true
    },
    {
      id: "amber",
      name: "Âmbar",
      code: "VECTOR-W8",
      hex: "#ffb000",
      rgb: "255, 176, 0"
    },
    {
      id: "cyan",
      name: "Ciano",
      code: "RENRAKU-ICE",
      hex: "#00f0ff",
      rgb: "0, 240, 255"
    },
    {
      id: "crimson",
      name: "Vermelho",
      code: "ARES-ALARM",
      hex: "#ff1e44",
      rgb: "255, 30, 68"
    },
    {
      id: "violet",
      name: "Violeta",
      code: "CHIBA-NEON",
      hex: "#c084fc",
      rgb: "192, 132, 252"
    },
    {
      id: "gold",
      name: "Dourado",
      code: "HAZARD-SK",
      hex: "#facc15",
      rgb: "250, 204, 21"
    },
    {
      id: "monochrome",
      name: "Branco",
      code: "STEALTH-P4",
      hex: "#e2e8f0",
      rgb: "226, 232, 240"
    }
  ];

  function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") return null;
    let cleaned = hex.replace("#", "").trim();
    if (cleaned.length === 3) {
      cleaned = cleaned.split("").map(c => c + c).join("");
    }
    if (cleaned.length !== 6) return null;
    const num = parseInt(cleaned, 16);
    if (isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  const METATYPES = {
    Human: {
      name: "Humano",
      racialTrait: "+1 Trunfo, +1 ponto de Perícia",
      traitDescription: "+1 Trunfo (Inicia com Trunfo 2), +1 ponto de Perícia",
      bonuses: { edg: 1, skillPoints: 1 },
      base: { str: 1, agi: 1, wil: 1, log: 1, cha: 1, edg: 2 },
      limits: { str: 6, agi: 6, wil: 6, log: 6, cha: 6, edg: 6 }
    },
    Elf: {
      name: "Elfo",
      racialTrait: "+1 Agilidade, +1 Carisma",
      traitDescription: "+1 Agilidade, +1 Carisma",
      bonuses: { agi: 1, cha: 1 },
      base: { str: 1, agi: 2, wil: 1, log: 1, cha: 2, edg: 1 },
      limits: { str: 6, agi: 7, wil: 6, log: 6, cha: 8, edg: 6 }
    },
    Dwarf: {
      name: "Anão",
      racialTrait: "+1 Força, +1 Vontade",
      traitDescription: "+1 Força, +1 Vontade",
      bonuses: { str: 1, wil: 1 },
      base: { str: 2, agi: 1, wil: 2, log: 1, cha: 1, edg: 1 },
      limits: { str: 8, agi: 6, wil: 7, log: 6, cha: 6, edg: 6 }
    },
    Ork: {
      name: "Ork",
      racialTrait: "+2 Força",
      traitDescription: "+2 Força",
      bonuses: { str: 2 },
      base: { str: 3, agi: 1, wil: 1, log: 1, cha: 1, edg: 1 },
      limits: { str: 8, agi: 6, wil: 6, log: 5, cha: 5, edg: 6 }
    },
    Troll: {
      name: "Troll",
      racialTrait: "+2 Força, +3 círculos de Armadura, –1 ponto de Perícia",
      traitDescription: "+2 Força, +3 círculos de Armadura, –1 ponto de Perícia",
      bonuses: { str: 2, armor: 3, skillPoints: -1 },
      base: { str: 3, agi: 1, wil: 1, log: 1, cha: 1, edg: 1 },
      limits: { str: 10, agi: 5, wil: 6, log: 5, cha: 4, edg: 6 }
    }
  };

  const GAME_LEVELS = {
    ganger: {
      id: "ganger",
      name: "Gangue (Ganger)",
      attrPoints: 12,
      skillPoints: 10,
      ampPoints: 6,
      weapons: 1,
      gearItems: 3,
      contacts: 1,
      description: "Nível iniciante / gangue de rua (12 Atributos, 10 Perícias, 6 Amps, 1 Arma, Armadura + 3 Itens, 1 Contato)"
    },
    street_runner: {
      id: "street_runner",
      name: "Incursor de Rua (Padrão)",
      attrPoints: 16,
      skillPoints: 12,
      ampPoints: 10,
      weapons: 2,
      gearItems: 4,
      contacts: 2,
      description: "Nível padrão de Shadowrun: Anarchy (16 Atributos, 12 Perícias, 10 Amps, 2 Armas, Armadura + 4 Itens, 2 Contatos)"
    },
    prime_runner: {
      id: "prime_runner",
      name: "Incursor de Prestígio (Prime Runner)",
      attrPoints: 20,
      skillPoints: 14,
      ampPoints: 14,
      weapons: 3,
      gearItems: 5,
      contacts: 3,
      description: "Veteranos de alto calibre (20 Atributos, 14 Perícias, 14 Amps, 3 Armas, Armadura + 5 Itens, 3 Contatos)"
    }
  };

  const AWAKENED_TYPES = [
    { id: "", label: "—" },
    { id: "awakened", label: "Desperto" },
    { id: "emerged", label: "Emergido" }
  ];

  const ATTRIBUTES = [
    {
      key: "str",
      label: "Força",
      short: "STR",
      description: "Constituição, saúde física, dano corpo a corpo e Monitor Físico.",
      fullText: "É o quanto você é forte. Dã. Também representa a sua constituição, uma medida da saúde física e resiliência. Força determina o seu Monitor de Condição Física — a quantidade de dano que pode absorver — assim como a quantidade de dano que causa em combate corpo a corpo, então se você planeja socar muito, isso te ajuda a socar mais pesado."
    },
    {
      key: "agi",
      label: "Agilidade",
      short: "AGI",
      description: "Coordenação motora, reflexos, pontaria e combate.",
      fullText: "Não é só questão de poder — é como você o usa. Agilidade é uma combinação de coordenação de movimento, flexibilidade, equilíbrio e reação — reflexos e atenção às situações. Esse atributo cobre o quão boa uma pessoa é em combate, seja à distância, combate próximo, corpo a corpo, ou até veículo a veículo."
    },
    {
      key: "wil",
      label: "Vontade",
      short: "WIL",
      description: "Resistência mental, persistência e Monitor de Atordoamento.",
      fullText: "Quando você está cambaleando por um prédio enlameado e arruinado no desoleiro enquanto a chuva ácida dissolve o seu casaco, você segue em frente ou vai para casa e faz um chazinho? Vontade ajuda a determinar a resposta. É uma mistura do desejo do seu personagem de insistir contra a adversidade em qualquer condição e aquela voz instintiva que antecipa uma emboscada ou te diz quando é hora de vazar daí. Vontade determina quantas caixas você tem no seu Monitor de Condição de Atordoamento, que mede a quantidade de socos (e outros danos parecidos) que pode sofrer antes de cair inconsciente."
    },
    {
      key: "log",
      label: "Lógica",
      short: "LOG",
      description: "Faculdades mentais, intelecto e perícias da Matriz.",
      fullText: "Isso corresponde às faculdades mentais do personagem, sejam manha das ruas, ciência estudada, ou simplesmente um brilhantismo inerente. Ajuda a dar uma resposta rápida à questão sempre presente: “Se você é tão inteligente, por que ainda está nas ruas?”"
    },
    {
      key: "cha",
      label: "Carisma",
      short: "CHA",
      description: "Presença social, liderança e resolução na lábia.",
      fullText: "Você não precisa atirar mais que alguém se pode convencer esse alguém a nem sacar a arma. Carisma é a habilidade do seu personagem de sair de uma situação na base da lábia — a sua presença ao entrar numa sala e tomar o comando."
    },
    {
      key: "edg",
      label: "Trunfo",
      short: "EDG",
      description: "Pontos para dados extras e re-rolagens na sessão.",
      fullText: "Trunfo é um número muito especial para cada personagem. Diferente de outros Atributos, ele não corresponde a uma quantidade de dados; em vez disso, pode ser gasto para ganhar uma ajuda muito necessária para uma rolagem especialmente difícil. Trunfo só se recupera no início de cada sessão de jogo, então gaste-o com sabedoria."
    },
    {
      key: "ess",
      label: "Essência",
      short: "ESS",
      readOnly: true,
      description: "Medida da meta-humanidade restante (6.00 base).",
      fullText: "Num mundo tecnológico dominado pela necessidade de ter mais velocidade e força para sobreviver, muita gente voluntariamente arranca pedaços da sua meta-humanidade para ficar um passo à frente da bala com seu nome. Essência é uma medida de quanto de meta-humanidade resta num personagem."
    }
  ];

  const DEFAULT_ANARCHY_SKILLS = [
    // Perícias de Agilidade (AGI)
    {
      id: "athletics",
      name: "Atletismo",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Correr, saltar, nadar e acrobacia."
    },
    {
      id: "firearms",
      name: "Armas de Fogo",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Pistolas, escopetas, submetralhadoras e fuzis."
    },
    {
      id: "projectiles",
      name: "Armas de Projéteis",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Arcos, bestas, armas de arremesso e certos ataques de criatura."
    },
    {
      id: "vehicle_weapons",
      name: "Armas de Veículo",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Armas montadas em veículos, armas montadas em drones e em suportes/tripés fixos."
    },
    {
      id: "heavy_weapons",
      name: "Armas Pesadas",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Metralhadoras, canhões de assalto, lança-mísseis e lança-granadas."
    },
    {
      id: "escape_artist",
      name: "Arte da Fuga",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Escapar de amarras e algemas, contorcionismo e despistar perseguidores."
    },
    {
      id: "close_combat",
      name: "Combate Corpo a Corpo",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Combate armado, combate desarmado e artes marciais."
    },
    {
      id: "stealth",
      name: "Furtividade",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Esgueirar, empalmar e prestidigitação."
    },
    {
      id: "pilot_other",
      name: "Pilotar (Outros)",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Barcos, aviões e praticamente qualquer coisa que se mova em algo diferente do chão."
    },
    {
      id: "pilot_ground",
      name: "Pilotar (Terrestres)",
      attr: "agi",
      category: "Agilidade",
      rating: 0,
      spec: "",
      description: "Carros, caminhões, motos e até tanques. Drones com rodas e esteiras também."
    },

    // Perícias de Vontade (WIL)
    {
      id: "conjuring",
      name: "Convocação",
      attr: "wil",
      category: "Vontade",
      rating: 0,
      spec: "",
      description: "Invocação e banimento de espíritos. Apenas magistas. Impossível seu uso destreinado."
    },
    {
      id: "astral_combat",
      name: "Combate Astral",
      attr: "wil",
      category: "Vontade",
      rating: 0,
      spec: "",
      description: "Combate astral/de espíritos. Apenas plano astral. Apenas magistas."
    },
    {
      id: "sorcery",
      name: "Feitiçaria",
      attr: "wil",
      category: "Vontade",
      rating: 0,
      spec: "",
      description: "Conjuração, conjuração ritual, encantação e contramágica. Apenas magistas. Impossível seu uso destreinado."
    },
    {
      id: "survival",
      name: "Sobrevivência",
      attr: "wil",
      category: "Vontade",
      rating: 0,
      spec: "",
      description: "Sobrevivência na natureza, navegação e jejuar."
    },

    // Perícias de Lógica (LOG)
    {
      id: "biotech",
      name: "Biotecnologia",
      attr: "log",
      category: "Lógica",
      rating: 0,
      spec: "",
      description: "Primeiros socorros, medicina e cibertecnologia."
    },
    {
      id: "electronics",
      name: "Eletrônica",
      attr: "log",
      category: "Lógica",
      rating: 0,
      spec: "",
      description: "Hardware e software de computadores, reparo de ciberdeck."
    },
    {
      id: "engineering",
      name: "Engenharia",
      attr: "log",
      category: "Lógica",
      rating: 0,
      spec: "",
      description: "Reparo de automóveis, reparo de aeronaves e reparo de embarcações."
    },
    {
      id: "hacking",
      name: "Hackear",
      attr: "log",
      category: "Lógica",
      rating: 0,
      spec: "",
      description: "Hackear computadores e cibercombate."
    },
    {
      id: "tracking",
      name: "Rastrear",
      attr: "log",
      category: "Lógica",
      rating: 0,
      spec: "",
      description: "Rastreio físico, rastreio pela Matriz e perseguição."
    },
    {
      id: "tasking",
      name: "Tarefa",
      attr: "log",
      category: "Lógica",
      rating: 0,
      spec: "",
      description: "Invocar sprites, tecer formas complexas e tarefas da Matriz. Apenas tecnomantes. Impossível seu uso destreinado."
    },

    // Perícias de Carisma (CHA)
    {
      id: "disguise",
      name: "Disfarce",
      attr: "cha",
      category: "Carisma",
      rating: 0,
      spec: "",
      description: "Camuflagem, cosméticos, fantasias e alteração digital."
    },
    {
      id: "intimidation",
      name: "Intimidação",
      attr: "cha",
      category: "Carisma",
      rating: 0,
      spec: "",
      description: "Influência, interrogatório e tortura."
    },
    {
      id: "negotiation",
      name: "Negociação",
      attr: "cha",
      category: "Carisma",
      rating: 0,
      spec: "",
      description: "Barganha, contratos e diplomacia."
    },
    {
      id: "con",
      name: "Trapaça",
      attr: "cha",
      category: "Carisma",
      rating: 0,
      spec: "",
      description: "Trapaça e charlatanismo, atuação, performance e etiqueta."
    }
  ];

  const ATTRIBUTE_SKILL_PRESETS = {
    agi: [
      { name: "Atletismo", desc: "correr, saltar, nadar e acrobacia." },
      { name: "Armas de Fogo", desc: "pistolas, escopetas, submetralhadoras e fuzis." },
      { name: "Armas de Projéteis", desc: "arcos, bestas, armas de arremesso e certos ataques de criatura." },
      { name: "Armas de Veículo", desc: "armas montadas em veículos, armas montadas em drones, e armas em suportes/tripés fixos." },
      { name: "Armas Pesadas", desc: "metralhadoras, canhões de assalto, lança-mísseis e lança-granadas." },
      { name: "Arte da Fuga", desc: "escapar de amarras e algemas, contorcionismo e despistar perseguidores." },
      { name: "Combate Corpo a Corpo", desc: "combate corpo a corpo armado, combate corpo a corpo desarmado e artes marciais." },
      { name: "Furtividade", desc: "esgueirar, empalmar e prestidigitação." },
      { name: "Pilotar (Outros)", desc: "barcos, aviões e praticamente qualquer coisa que se mova em algo diferente do chão." },
      { name: "Pilotar (Terrestres)", desc: "carros, caminhões, motos e até tanques. Drones com rodas e esteiras também." }
    ],
    wil: [
      { name: "Convocação", desc: "a invocação e o banimento de espíritos. Apenas magistas. Impossível seu uso destreinado." },
      { name: "Combate Astral", desc: "combate astral/de espíritos. Apenas plano astral. Apenas magistas." },
      { name: "Combate Corpo a Corpo", desc: "apenas ao atacar espíritos." },
      { name: "Feitiçaria", desc: "Conjuração, conjuração ritual, encantação e contramágica. Apenas magistas. Impossível seu uso destreinado." },
      { name: "Sobrevivência", desc: "sobrevivência na natureza, navegação e jejuar." }
    ],
    log: [
      { name: "Biotecnologia", desc: "primeiros socorros, medicina e cibertecnologia." },
      { name: "Eletrônica", desc: "hardware e software de computadores, reparo de ciberdeck." },
      { name: "Engenharia", desc: "reparo de automóveis, reparo de aeronaves e reparo de embarcações." },
      { name: "Hackear", desc: "hackear computadores e cibercombate." },
      { name: "Perícias de Conhecimento", desc: "idiomas, conhecimento de interesse e conhecimento profissional." },
      { name: "Rastrear", desc: "rastreio físico, rastreio pela Matriz e perseguição." },
      { name: "Tarefa", desc: "invocar sprites, tecer formas complexas e outras tarefas da Matriz. Apenas tecnomantes. Impossível seu uso destreinado." }
    ],
    cha: [
      { name: "Disfarce", desc: "camuflagem, cosméticos, fantasias e alteração digital." },
      { name: "Intimidação", desc: "influência, interrogatório e tortura." },
      { name: "Negociação", desc: "barganha, contratos e diplomacia." },
      { name: "Trapaça", desc: "trapaça e charlatanismo, atuação, performance e etiqueta." }
    ]
  };

  const ACTION_SKILL_ATTRIBUTES = [
    { key: "agi", name: "Agilidade", short: "AGI" },
    { key: "wil", name: "Vontade", short: "WIL" },
    { key: "log", name: "Lógica", short: "LOG" },
    { key: "cha", name: "Carisma", short: "CHA" }
  ];

  const OFFICIAL_SKILL_DESCRIPTIONS = {};
  Object.entries(ATTRIBUTE_SKILL_PRESETS).forEach(([attrKey, list]) => {
    list.forEach(item => {
      OFFICIAL_SKILL_DESCRIPTIONS[`${attrKey}_${item.name}`] = item.desc;
      if (!OFFICIAL_SKILL_DESCRIPTIONS[item.name]) {
        OFFICIAL_SKILL_DESCRIPTIONS[item.name] = item.desc;
      }
    });
  });

  function getSkillDescription(name, attr) {
    if (attr && ATTRIBUTE_SKILL_PRESETS[attr]) {
      const found = ATTRIBUTE_SKILL_PRESETS[attr].find(p => p.name === name);
      if (found) return found.desc;
    }
    return OFFICIAL_SKILL_DESCRIPTIONS[name] || "";
  }


  // Normaliza as perícias e limpa dados legados ou vazios
  function normalizeCharacterSkills(rawChar) {
    if (!rawChar || typeof rawChar !== "object") return rawChar;
    let char = rawChar;
    try {
      char = JSON.parse(JSON.stringify(rawChar));
    } catch {}

    if (char.character) {
      if (char.character.alias === "Kage" || char.character.alias === "Novo Runner") char.character.alias = "";
      if (char.character.name === "Kage" || char.character.name === "Novo Runner") char.character.name = "";
    }

    if (!Array.isArray(char.skills)) {
      char.skills = [];
    } else {
      // Se todas as perícias estiverem zeradas, reseta a lista
      if (char.skills.length >= 20 && char.skills.every(s => (s.rating || 0) === 0 && !s.spec)) {
        char.skills = [];
      } else {
        char.skills.forEach(s => {
          if (s.name === "Nova Perícia") s.name = "";
          if (s.description === "Perícia personalizada") s.description = "";
        });
      }
    }

    if (Array.isArray(char.weapons)) {
      char.weapons.forEach(w => {
        if (w.name === "Nova Arma Registrada") w.name = "";
        if (w.damage === "8F" && (w.range === "Perto OK, Afastado -2, Distante —" || !w.range)) {
          w.damage = "";
          w.range = "";
        }
      });
    }

    if (Array.isArray(char.shadowAmps)) {
      char.shadowAmps.forEach(a => {
        if (a.name === "Nova Amplificação") a.name = "";
        if (a.effect === "Especificações do efeito..." || a.effect === "Especificações técnicas e efeitos nas regras...") a.effect = "";
      });
    }

    if (Array.isArray(char.gear)) {
      char.gear.forEach(g => {
        if (g.name === "Novo Item") g.name = "";
      });
    }

    if (Array.isArray(char.contacts)) {
      char.contacts.forEach(c => {
        if (c.name === "Novo Contato") c.name = "";
        if (c.role === "Fixer" && !c.notes) c.role = "";
      });
    }

    if (Array.isArray(char.knowledgeSkills)) {
      char.knowledgeSkills.forEach(ks => {
        if (ks.name === "Novo Conhecimento / Idioma") ks.name = "";
      });
    }

    if (Array.isArray(char.cues)) {
      char.cues = char.cues.map(c => c === "Nova frase de efeito do runner..." ? "" : c);
    }

    if (Array.isArray(char.dispositions)) {
      char.dispositions = char.dispositions.map(d => d === "Novo traço de personalidade" ? "" : d);
    }

    return char;
  }

  const SHADOW_AMP_TYPES = [
    { id: "spell", label: "Feitiço (Spell) [Custo: 1]" },
    { id: "adept_power", label: "Poder de Adepto [Custo: 1]" },
    { id: "cyberware", label: "Cibernético (-1.0 ESS) [Custo: 1]" },
    { id: "bioware", label: "Biônico (-0.5 ESS) [Custo: 2]" },
    { id: "cyberdeck", label: "Ciberdeck (FW 2, Matriz 8) [Custo: 2]" },
    { id: "program", label: "Programa / Forma Complexa [Custo: 1]" },
    { id: "talisman", label: "Talismã (Foco Mágico) [Custo: 1]" },
    { id: "gear_amp", label: "Equipamento Especial [Custo: 0]" },
    { id: "creature_power", label: "Poder de Criatura / PDM [Custo: 1]" }
  ];

  const SRA_QUALITIES_PRESETS = [
    // Qualidades positivas
    { name: "Alto Limiar de Dor", type: "positive", effect: "Não sofre penalidades de dado por dano até a segunda fileira de caixas de dano ser preenchida." },
    { name: "Ambidestro", type: "positive", effect: "+2 dados ao usar duas armas corpo a corpo." },
    { name: "Ás da Pilotagem", type: "positive", effect: "+2 dados em testes de Pilotar (Outros)." },
    { name: "Atleta Natural", type: "positive", effect: "+2 dados para testes de Atletismo." },
    { name: "Atributo Excepcional (Escolha)", type: "positive", effect: "Aumente seu limite de (Atributo Escolhido) em +1." },
    { name: "Biocompatibilidade", type: "positive", effect: "Ignora 1 ponto de custo de Essência de Amp das Sombras." },
    { name: "Brutamontes", type: "positive", effect: "+2 dados em testes de Intimidação." },
    { name: "Casca-Grossa (Atordoamento)", type: "positive", effect: "+1 no Monitor de Condição de Atordoamento." },
    { name: "Casca-Grossa (Físico)", type: "positive", effect: "+1 no Monitor de Condição Física." },
    { name: "Contorcionista", type: "positive", effect: "+2 dados em testes de Arte da Fuga." },
    { name: "Coragem", type: "positive", effect: "Pode re-rolar 2 dados ao resistir a medo ou intimidação." },
    { name: "Educação Universitária", type: "positive", effect: "Pode escolher 2 perícias de Conhecimento adicionais." },
    { name: "Empatia Animal", type: "positive", effect: "+2 dados em qualquer teste envolvendo influenciar ou controlar um animal." },
    { name: "Encantador de Espíritos", type: "positive", effect: "Ao fazer um Teste de Convocação, pode re-rolar 2 dados." },
    { name: "Endurecimento Natural", type: "positive", effect: "Reduz dano da Matriz sofrido em 2. (Apenas Tecnomantes)" },
    { name: "Felino", type: "positive", effect: "+2 dados para testes de Furtividade." },
    { name: "Indomável (Escolha Perícia)", type: "positive", effect: "Ao atacar com a perícia escolhida, pode re-rolar exatamente 2 dados." },
    { name: "Língua de Prata", type: "positive", effect: "Pode re-rolar 2 dados em testes de Carisma." },
    { name: "Olhos de Águia", type: "positive", effect: "+2 dados para testes de Percepção." },
    { name: "Piloto de Combate", type: "positive", effect: "+2 dados em testes de Pilotar (Outros)." },
    { name: "Piloto de Rua", type: "positive", effect: "+2 dados em testes de Pilotar (Terrestres)." },
    { name: "Piloto Nato", type: "positive", effect: "Ao levar veículos ao limite ou realizar manobras difíceis, +2 dados na rolagem." },
    { name: "Programador Rápido", type: "positive", effect: "+2 dados em testes de Hackear." },
    { name: "Sorte", type: "positive", effect: "Aumente seu valor de Trunfo em +1." },
    { name: "Vitalidade", type: "positive", effect: "Todo dano sofrido é reduzido em 1 ponto." },
    { name: "Vontade de Ferro", type: "positive", effect: "Pode re-rolar 2 dados em testes de Convocação." },

    // Qualidades negativas
    { name: "Alergia (Especificar)", type: "negative", effect: "Quando afetado por alergia (decisão do Mestre), -4 em todas as rolagens de dados." },
    { name: "Apego Emocional (Especificar)", type: "negative", effect: "Deve gastar um Ponto de Trama para evitar priorizar o apego acima de qualquer coisa." },
    { name: "Baixo Limiar de Dor", type: "negative", effect: "Aumente penalidades por dano em 1." },
    { name: "Bloqueio de Código", type: "negative", effect: "-2 dados para testes de Hackear." },
    { name: "Desgosto pela Violência", type: "negative", effect: "Ataques do jogador causam 2 de dano a menos." },
    { name: "Elfo Poser", type: "negative", effect: "Ao fazer testes sociais com/sobre elfos, sempre some um Dado de Falha que não pode rolar uma Brecha." },
    { name: "Estilo Distinto (Especificar)", type: "negative", effect: "Oposição fica com +2 para reconhecer ou se lembrar de você em testes de Percepção." },
    { name: "Fobia (Especificar)", type: "negative", effect: "Quando estiver na presença da fonte da fobia (decisão do Mestre), -2 em todas as rolagens de dados." },
    { name: "Gremlins", type: "negative", effect: "Ao usar itens de alta tecnologia, sempre some um Dado de Falha que não pode rolar uma Brecha." },
    { name: "Lealdade Teimosa (Escolha Corp)", type: "negative", effect: "-1 dado ao usar um drone/veículo que não seja fabricado pela Corp ou que você não personalizou." },
    { name: "Mãos Instáveis", type: "negative", effect: "-2 dados em todos os testes de Agilidade." },
    { name: "Paralisia de Combate", type: "negative", effect: "Aja por último na primeira rodada de qualquer combate (exceto emboscada sua)." },
    { name: "Paranoia", type: "negative", effect: "Deve re-rolar sucessos (máx. 2) ao fazer testes sociais." },
    { name: "SINado, Corporativo", type: "negative", effect: "Cidadão corporativo. Seus dados estão disponíveis através do Registro Global de SIN." },
    { name: "SINado, Criminoso", type: "negative", effect: "Conhecido para as Forças da Lei. Seus dados estão disponíveis através do Registro Global de SIN." },
    { name: "SINado, Nacional", type: "negative", effect: "Cidadão legal. Seus dados estão disponíveis através do Registro Global de SIN." },
    { name: "Viciado em Combate", type: "negative", effect: "Deve gastar um Ponto de Trama para evitar usar violência como primeira resposta a qualquer problema." }
  ];

  const OFFICIAL_SRA_WEAPONS = [
    // Armas de combate corpo a corpo
    { name: "Desarmado", category: "Combate Corpo a Corpo", damage: "FOR/2", range: "Perto OK, Afastado —, Distante —", notes: "Ataque corpo a corpo desarmado" },
    { name: "Faca de Combate", category: "Combate Corpo a Corpo", damage: "(FOR/2+1)F", range: "Perto OK, Afastado —, Distante —", notes: "Lâmina de alta resistência" },
    { name: "Katana", category: "Combate Corpo a Corpo", damage: "(FOR/2+3)F", range: "Perto OK, Afastado —, Distante —", notes: "Espada tradicional de aço mono-reforçado" },
    { name: "Bastão de Choque", category: "Combate Corpo a Corpo", damage: "7A", range: "Perto OK, Afastado —, Distante —", notes: "Dano elétrico de atordoamento" },
    { name: "Cassetete / Taco", category: "Combate Corpo a Corpo", damage: "(FOR/2+2)F", range: "Perto OK, Afastado —, Distante —", notes: "Arma de impacto" },

    // Armas de fogo
    { name: "Ares Predator V", category: "Pistola Pesada", damage: "6F", range: "Perto OK, Afastado -2, Distante —", notes: "Pistola pesada padrão das sombras" },
    { name: "Colt America L36", category: "Pistola Leve", damage: "5F", range: "Perto OK, Afastado -2, Distante —", notes: "Pistola leve discreta" },
    { name: "Ares Crusader II", category: "Pistola Automática", damage: "6F", range: "Perto OK, Afastado -2, Distante —", notes: "Disparo automático / rajada" },
    { name: "Ingram Smartgun X", category: "Submetralhadora", damage: "6F", range: "Perto OK, Afastado OK, Distante —", notes: "Smartlink integrado e supressor" },
    { name: "Ares Alpha", category: "Fuzil de Assalto", damage: "8F", range: "Perto OK, Afastado OK, Distante -2", notes: "Lança-granadas acoplado (12F)" },
    { name: "AK-97", category: "Fuzil de Assalto", damage: "8F", range: "Perto OK, Afastado OK, Distante -2", notes: "Confiabilidade lendária mundial" },
    { name: "Defiance T-250", category: "Escopeta", damage: "9F", range: "Perto OK*, Afastado -2, Distante —", notes: "*Com -2 pode atacar 2 alvos por metade do dano" },
    { name: "Ares Desert Strike", category: "Rifle de Precisão", damage: "9F", range: "Perto -4, Afastado -2, Distante OK", notes: "Mira de longo alcance de alta precisão" },
    { name: "Cavalier Safeguard", category: "Taser", damage: "6A", range: "Perto OK, Afastado -4, Distante —", notes: "Dardo de atordoamento" },

    // Armas pesadas
    { name: "Ingram Valiant", category: "Metralhadora", damage: "8F", range: "Perto OK, Afastado OK, Distante OK", notes: "Fogo de supressão pesado" },
    { name: "Canhão Panther XXL", category: "Canhão de Assalto", damage: "12F", range: "Perto OK*, Afastado OK*, Distante OK", notes: "Dano massivo anti-blindagem" },
    { name: "Granada de Fragmentação", category: "Arma de Projéteis", damage: "12F", range: "Perto OK*, Afastado OK*, Distante —", notes: "Explosivo de fragmentação em área" }
  ];

  // Cria uma nova ficha em branco
  function createDefaultCharacter(customAlias = "") {
    const charId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialName = customAlias || "";
    return {
      id: charId,
      version: SCHEMA_VERSION,
      system: SYSTEM_NAME,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      character: {
        name: initialName,
        alias: initialName,
        tags: "",
        metatype: "Human",
        archetype: "",
        awakenedType: "",
        gameLevel: "street_runner",
        gender: "",
        age: "",
        height: "",
        weight: "",
        karma: 0,
        totalKarma: 0,
        nuyen: 0,
        plotPoints: 0,
        maxPlotPoints: 5
      },
      // Atributos base 1 (humano começa com Trunfo 2)
      attributes: {
        str: { base: 1, mod: 0 },
        agi: { base: 1, mod: 0 },
        wil: { base: 1, mod: 0 },
        log: { base: 1, mod: 0 },
        cha: { base: 1, mod: 0 },
        edg: { base: 2, mod: 0 }
      },
      // Monitores de dano zerados
      condition: {
        physicalDamage: 0,
        stunDamage: 0,
        armorDamage: 0,
        armorRating: 9,
        edgeCurrent: 2
      },
      // Lances e disposições
      cues: [],
      dispositions: [],
      // Perícias e amplificações
      skills: [],
      knowledgeSkills: [],
      shadowAmps: [],
      // Qualidades iniciais (2 positivas e 1 negativa)
      qualities: [
        { id: "q_pos_1", name: "", type: "positive", effect: "" },
        { id: "q_pos_2", name: "", type: "positive", effect: "" },
        { id: "q_neg_1", name: "", type: "negative", effect: "" }
      ],
      weapons: [],
      armor: [],
      gear: [],
      contacts: [],
      vehicles: [],
      notes: ""
    };
  }

  const APP_AUTHOR = "Pedro Moreira de Souza";
  const APP_COPYRIGHT = "© 2026 Pedro Moreira de Souza. Direitos reservados aos respectivos titulares.";
  const LICENSE_TEXT = "# Licença de Uso e Informações de Autoria\n\n**Projeto:** Terminal Clandestino de Gerenciamento de Runner (Shadowrun: Anarchy — Gerenciador de Fichas)  \n**Autor dos Materiais Originais:** Pedro Moreira de Souza  \n**Ano:** 2026  \n\n---\n\n## 1. Contexto e Finalidade\n\nEste aplicativo foi desenvolvido de forma independente como uma ferramenta pessoal e recreativa para auxiliar no gerenciamento de fichas de personagens e na rolagem de dados durante sessões privadas de RPG entre amigos, utilizando as regras de *Shadowrun: Anarchy*.\n\nO projeto não tem finalidade comercial, publicitária ou de distribuição pública neste momento.\n\n---\n\n## 2. Autoria e Materiais Originais\n\nSão de autoria e titularidade de **Pedro Moreira de Souza** os materiais originais que ele efetivamente desenvolveu neste projeto, compreendendo:\n- O código-fonte original da aplicação (arquivos HTML, CSS, JavaScript e scripts de suporte);\n- A arquitetura, estrutura dos módulos e lógica de funcionamento da ficha;\n- O design de interface, elementos visuais originais e estilos do terminal;\n- A documentação e os textos explicativos redigidos pelo autor.\n\n---\n\n## 3. Condições de Uso (Uso Privado entre Amigos)\n\n- **Permissão de uso pessoal:** O aplicativo pode ser utilizado livremente para fins pessoais e não comerciais por mim e pelos participantes das nossas partidas de RPG, incluindo criação, preenchimento, edição, importação e exportação de fichas.\n- **Propriedade dos dados:** As fichas, anotações e arquivos (JSON ou PDF) gerados durante o uso pertencem aos seus respectivos criadores e jogadores.\n- **Distribuição restrita:** Como se trata de um projeto de uso privado, é vedada a comercialização, venda, cobrança por acesso ou redistribuição pública do código-fonte ou dos executáveis sem autorização prévia do autor.\n- **Créditos:** Os avisos de autoria originais devem ser preservados.\n\n---\n\n## 4. Direitos de Terceiros e Marcas\n\n- **Shadowrun:** O autor não é proprietário e não reivindica direitos sobre o nome *Shadowrun*, *Shadowrun: Anarchy*, regras oficiais, livros, ilustrações ou o universo ficcional do jogo, que pertencem aos seus respectivos titulares (como The Topps Company, Inc. e Catalyst Game Labs). O uso de termos do jogo ocorre unicamente para compatibilidade com as regras nas sessões de RPG.\n- **Componentes e Fontes:** As fontes tipográficas locais e as ferramentas de desenvolvimento utilizadas no projeto pertencem aos seus respectivos autores e continuam regidas por suas licenças originais, detalhadas no arquivo `THIRD-PARTY-NOTICES.md`.\n\n---\n\n## 5. Eventual Publicação Futura\n\nCaso o projeto venha a ser disponibilizado publicamente, compartilhado amplamente ou integrado a um portfólio profissional no futuro, este documento e as atribuições de terceiros serão revistos para assegurar a conformidade com o novo cenário de divulgação.\n\n---\n\n## 6. Isenção Simples de Responsabilidade\n\nO aplicativo é fornecido \"no estado em que se encontra\" (*as is*), para uso recreativo. O autor empenhou-se na estabilidade do sistema, mas não garante funcionamento livre de imprevistos. Recomenda-se aos jogadores manterem cópias de suas fichas por meio das opções de exportação e backup do próprio sistema.\n";
  const THIRD_PARTY_NOTICES_TEXT = "# Avisos de Terceiros e Componentes de Código Aberto\n\nEste documento relaciona os avisos de atribuição, marcas e licenças de componentes de terceiros utilizados no projeto **Terminal Clandestino de Gerenciamento de Runner** (Shadowrun: Anarchy — Gerenciador de Fichas).\n\n---\n\n## 1. Referências ao Universo Shadowrun\n\n- **Shadowrun** e **Shadowrun: Anarchy** são marcas e propriedades intelectuais pertencentes aos seus respectivos detentores (como The Topps Company, Inc. e Catalyst Game Labs).\n- Este projeto é uma ferramenta amadora, complementar e independente, desenvolvida sem fins lucrativos ou comerciais, destinada ao uso pessoal em partidas privadas de RPG entre amigos.\n- O projeto não possui afiliação, patrocínio ou endosso por parte dos titulares oficiais da franquia. O uso de nomes de atributos, perícias e termos do sistema tem finalidade puramente referencial para viabilizar as fichas de jogo.\n\n---\n\n## 2. Fontes Tipográficas Locais (SIL Open Font License 1.1)\n\nO aplicativo utiliza as seguintes famílias tipográficas armazenadas localmente para permitir o funcionamento offline. Todas são distribuídas sob a **SIL Open Font License, Version 1.1 (OFL)**:\n\n- **Chakra Petch:** Copyright (c) 2018 Cadson Demak (https://github.com/cadsondemak/chakra-petch)\n- **JetBrains Mono:** Copyright (c) 2020 JetBrains s.r.o. (https://github.com/JetBrains/JetBrainsMono)\n- **Rajdhani:** Copyright (c) 2014 Indian Type Foundry (info@indiantypefoundry.com)\n- **Share Tech Mono:** Copyright (c) 2012 Carrois Type Design / Ralph du Carrois\n- **Space Grotesk:** Copyright (c) 2020 Florian Karsten (https://github.com/floriankarsten/space-grotesk)\n\n### Texto da Licença SIL Open Font License, Version 1.1\n\n```text\nSIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n\nPREAMBLE\nThe goals of the Open Font License (OFL) are to stimulate worldwide\ndevelopment of collaborative font projects, to support the font creation\nefforts of academic and linguistic communities, and to provide a free and\nopen framework in which fonts may be shared and improved in partnership\nwith others.\n\nThe OFL allows the licensed fonts to be used, studied, modified and\nredistributed freely as long as they are not sold by themselves. The\nfonts, including any derivative works, can be bundled, embedded, \nredistributed and/or sold with any software provided that any reserved\nnames are not used by derivative works. The fonts and derivatives,\nhowever, cannot be released under any other type of license. The\nrequirement for fonts to remain under this license does not apply\nto any document created using the fonts or their derivatives.\n\nDEFINITIONS\n\"Font Software\" refers to the set of files released by the Copyright\nHolder(s) under this license and clearly marked as such. This may include\nsource files, build scripts and documentation.\n\n\"Reserved Font Name\" refers to any names specified as such after the\ncopyright statement(s).\n\n\"Original Version\" refers to the collection of Font Software components as\ndistributed by the Copyright Holder(s).\n\n\"Modified Version\" refers to any derivative made by adding to, deleting,\nor substituting -- in part or in whole -- any of the components of the\nOriginal Version, by changing formats or by porting the Font Software to a\nnew environment.\n\n\"Author\" refers to any designer, engineer, programmer, technical\nwriter or other person who contributed to the Font Software.\n\nPERMISSION & CONDITIONS\nPermission is hereby granted, free of charge, to any person obtaining\na copy of the Font Software, to use, study, copy, merge, embed, modify,\nredistribute, and sell modified and unmodified copies of the Font\nSoftware, subject to the following conditions:\n\n1) Neither the Font Software nor any of its individual components,\nin Original or Modified Versions, may be sold by itself.\n\n2) Original or Modified Versions of the Font Software may be bundled,\nredistributed and/or sold with any software, provided that each copy\ncontains the above copyright notice and this license. These can be\nincluded either as stand-alone text files, human-readable headers or\nin the appropriate machine-readable metadata fields within text or\nbinary files as long as those fields can be easily viewed by the user.\n\n3) No Modified Version of the Font Software may use the Reserved Font\nName(s) unless prominent written permission is granted by the corresponding\nCopyright Holder. This restriction only applies to the primary font name as\npresented to the users.\n\n4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font\nSoftware shall not be used to promote, endorse or advertise any\nModified Version, except to acknowledge the contribution(s) of the\nCopyright Holder(s) and the Author(s) or with their explicit written\npermission.\n\n5) The Font Software, modified or unmodified, in part or in whole,\nmust be distributed entirely under this license, and must not be\ndistributed under any other license. The requirement for fonts to\nremain under this license does not apply to any document created\nusing the Font Software.\n\nTERMINATION\nThis license becomes null and void if any of the above conditions are\nnot met.\n\nDISCLAIMER\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\nOF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE\nCOPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\nINCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL\nDAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\nFROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM\nOTHER DEALINGS IN THE FONT SOFTWARE.\n```\n\n---\n\n## 3. Ferramentas da Versão Desktop (Licença MIT)\n\nPara a compilação e execução da versão desktop para Windows, o projeto utiliza dependências de desenvolvimento regidas pela **Licença MIT**:\n\n- **Electron:** Copyright (c) Electron contributors / OpenJS Foundation (https://github.com/electron/electron)\n- **electron-builder:** Copyright (c) electron-builder contributors (https://github.com/electron-userland/electron-builder)\n\nO runtime empacotado pelo Electron também integra projetos de código aberto como Chromium, Node.js e V8, sob suas respectivas licenças livres (como BSD e MIT).\n\n### Texto da Licença MIT\n\n```text\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n```\n";

  // --- Regras e cálculos ---
  // Regras e cálculos derivados de Shadowrun: Anarchy

  // Retorna o total do atributo (base + modificador)
  function getAttributeTotal(charData, attrKey) {
    if (!charData?.attributes?.[attrKey]) return 0;
    const attr = charData.attributes[attrKey];
    return (Number(attr.base) || 0) + (Number(attr.mod) || 0);
  }

  // Calcula a Essência restante subtraindo custos de ciberware/bioware/amps
  function calculateEssence(charData) {
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
  function calculateEssencePenalty(essenceRemaining) {
    if (essenceRemaining >= 5.5) return 0;
    if (essenceRemaining >= 3.5) return -1;
    if (essenceRemaining >= 1.5) return -2;
    return -3;
  }

  // Monitor Físico: 8 + metade de Força (arredondado para cima)
  function calculatePhysicalTrackMax(charData) {
    const str = getAttributeTotal(charData, "str");
    return 8 + Math.ceil(str / 2);
  }

  // Monitor de Atordoamento: 8 + metade de Vontade (arredondado para cima)
  function calculateStunTrackMax(charData) {
    const wil = getAttributeTotal(charData, "wil");
    return 8 + Math.ceil(wil / 2);
  }

  // Monitor de Armadura: armadura base + bônus de metatipo e ciberware
  function calculateArmorTrackMax(charData) {
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
  function calculateWoundPenalty(charData) {
    const physDamage = Math.max(0, Number(charData?.condition?.physicalDamage) || 0);
    const stunDamage = Math.max(0, Number(charData?.condition?.stunDamage) || 0);

    const physPenalty = Math.floor(physDamage / 3);
    const stunPenalty = Math.floor(stunDamage / 3);

    return -(physPenalty + stunPenalty);
  }

  // Reserva de Defesa: Agilidade + Lógica + bônus de amps - penalidade de dano
  function calculateDefensePool(charData) {
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
  function calculatePerceptionPool(charData) {
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
  function calculateMentalDefensePool(charData) {
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
  function calculateMatrixDefensePool(charData) {
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
  function calculateSkillDicePool(charData, skill, useSpecialization = false) {
    if (!skill) return 0;
    const rating = Number(skill.rating) || 0;
    const attrVal = getAttributeTotal(charData, skill.attr);
    const specBonus = (useSpecialization && skill.spec) ? 2 : 0;
    const wounds = calculateWoundPenalty(charData);

    return Math.max(0, rating + attrVal + specBonus + wounds);
  }

  // Contabiliza pontos gastos na criação de personagem
  function calculateCreationPointsSpent(charData) {
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
  function calculateDerivedStats(charData) {
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

  // --- Rolador de dados D6 ---
  // Rolador de dados d6 para Shadowrun: Anarchy

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function rollD6Pool(poolSize, options = {}) {
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

  function recalculateRollStats(dice, options = {}) {
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
  function rerollFailedDice(currentRoll) {
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



  // --- Persistência local ---
  // Gerenciamento de salvamento local e lista de fichas no navegador e desktop (%APPDATA%)

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
  function loadRoster() {
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
  function saveRoster(roster) {
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
  function getActiveCharacterId() {
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
  function setActiveCharacterId(id) {
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
  function loadCharacter() {
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
  function saveCharacter(charData) {
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
  function createCharacterInRoster(nameOrAlias) {
    const newChar = createDefaultCharacter(nameOrAlias || "Novo Runner");
    const roster = loadRoster();
    roster.push(newChar);
    saveRoster(roster);
    setActiveCharacterId(newChar.id);
    saveCharacter(newChar);
    return newChar;
  }

  // Duplica uma ficha existente com um novo ID
  function duplicateCharacterInRoster(charId) {
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
  function deleteCharacterFromRoster(charId) {
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
  function backupCharacter(charData) {
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
  function clearLocalData() {
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
  function hasSavedData() {
    try {
      return !!(localStorage.getItem(STORAGE_ROSTER_KEY) || localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  }

  // Carrega o tema salvo do localStorage ou do Desktop
  function loadSavedTheme() {
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
  function saveThemeSetting(themeId, customHex = null) {
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

  // --- Importação e exportação ---
  // Importação e exportação de fichas em formato JSON

  // Valida se o objeto importado é uma ficha compatível
  function validateCharacterData(data) {
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
  function migrateCharacterData(rawData) {
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
  function exportCharacterToFile(charData) {
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
  function readJsonFile(file) {
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

  // --- Estado da aplicação ---
  // Gerenciamento de estado da aplicação e salvamento automático

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

  const store = new CharacterStore();
  if (typeof window !== "undefined") {
    window.SRA_STORE = store;
    window.SRA_STATE = store;
  }

  // --- Renderização da interface ---
  // Renderização e atualização da interface do terminal

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

  function showToast(message, type = "info") {
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

  function playTacticalSound(type) {
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

  function initDiceModalListeners() {
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
  function openDiceModal(options = {}) {
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

  function closeDiceModal() {
    const modal = document.getElementById("modal-dice-roller");
    if (modal) modal.classList.remove("active");
  }

  // Executa a rolagem com animação dos dados
  function executeModalRoll() {
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
  function renderSheetsModal(roster = [], activeId = "") {
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
  function renderApp(char, derived, eventMeta = {}) {
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
  function syncCyberSelect(selectEl) {
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
  function initCyberSelects() {
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
  function applyTheme(themeId, customHex = null) {
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
  function renderThemeModal(activeThemeId, activeCustomHex = null) {
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
  function updateThemeIndicators(activeThemeId, activeCustomHex = null) {
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
  function openThemeModal(activeThemeId, activeCustomHex) {
    const modal = document.getElementById("modal-theme-selector");
    if (!modal) return;
    renderThemeModal(activeThemeId, activeCustomHex);
    modal.classList.add("active");
  }

  // Fecha o modal de temas
  function closeThemeModal() {
    const modal = document.getElementById("modal-theme-selector");
    if (modal) modal.classList.remove("active");
  }


  // --- Controle de eventos e abas ---
  // Inicialização da aplicação, eventos, abas e modais

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



})();
