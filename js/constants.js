// Constantes e configurações padrão de Shadowrun: Anarchy

export const SCHEMA_VERSION = 1;
export const SYSTEM_NAME = "Shadowrun: Anarchy";
export const STORAGE_KEY = "sra_sheet_active_char_v2";
export const STORAGE_ROSTER_KEY = "sra_characters_roster_v2";
export const STORAGE_ACTIVE_ID_KEY = "sra_active_character_id_v2";
export const STORAGE_BACKUP_PREFIX = "sra_sheet_backup_";
export const STORAGE_THEME_KEY = "sra_terminal_theme_v1";

export const DEFAULT_THEME_ID = "matrix";

export const THEME_PRESETS = [
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

export function hexToRgb(hex) {
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

export const METATYPES = {
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

export const GAME_LEVELS = {
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

export const AWAKENED_TYPES = [
  { id: "", label: "—" },
  { id: "awakened", label: "Desperto" },
  { id: "emerged", label: "Emergido" }
];

export const ATTRIBUTES = [
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

export const DEFAULT_ANARCHY_SKILLS = [
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

export const ATTRIBUTE_SKILL_PRESETS = {
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

export const ACTION_SKILL_ATTRIBUTES = [
  { key: "agi", name: "Agilidade", short: "AGI" },
  { key: "wil", name: "Vontade", short: "WIL" },
  { key: "log", name: "Lógica", short: "LOG" },
  { key: "cha", name: "Carisma", short: "CHA" }
];

export const OFFICIAL_SKILL_DESCRIPTIONS = {};
Object.entries(ATTRIBUTE_SKILL_PRESETS).forEach(([attrKey, list]) => {
  list.forEach(item => {
    OFFICIAL_SKILL_DESCRIPTIONS[`${attrKey}_${item.name}`] = item.desc;
    if (!OFFICIAL_SKILL_DESCRIPTIONS[item.name]) {
      OFFICIAL_SKILL_DESCRIPTIONS[item.name] = item.desc;
    }
  });
});

export function getSkillDescription(name, attr) {
  if (attr && ATTRIBUTE_SKILL_PRESETS[attr]) {
    const found = ATTRIBUTE_SKILL_PRESETS[attr].find(p => p.name === name);
    if (found) return found.desc;
  }
  return OFFICIAL_SKILL_DESCRIPTIONS[name] || "";
}


// Normaliza as perícias e limpa dados legados ou vazios
export function normalizeCharacterSkills(rawChar) {
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

export const SHADOW_AMP_TYPES = [
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

export const SRA_QUALITIES_PRESETS = [
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

export const OFFICIAL_SRA_WEAPONS = [
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
export function createDefaultCharacter(customAlias = "") {
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

export const APP_AUTHOR = "Pedro Moreira de Souza";
export const APP_COPYRIGHT = "© 2026 Pedro Moreira de Souza. Direitos reservados aos respectivos titulares.";
export const LICENSE_TEXT = "# Licença de Uso e Informações de Autoria\n\n**Projeto:** Terminal Clandestino de Gerenciamento de Runner (Shadowrun: Anarchy — Gerenciador de Fichas)  \n**Autor dos Materiais Originais:** Pedro Moreira de Souza  \n**Ano:** 2026  \n\n---\n\n## 1. Contexto e Finalidade\n\nEste aplicativo foi desenvolvido de forma independente como uma ferramenta pessoal e recreativa para auxiliar no gerenciamento de fichas de personagens e na rolagem de dados durante sessões privadas de RPG entre amigos, utilizando as regras de *Shadowrun: Anarchy*.\n\nO projeto não tem finalidade comercial, publicitária ou de distribuição pública neste momento.\n\n---\n\n## 2. Autoria e Materiais Originais\n\nSão de autoria e titularidade de **Pedro Moreira de Souza** os materiais originais que ele efetivamente desenvolveu neste projeto, compreendendo:\n- O código-fonte original da aplicação (arquivos HTML, CSS, JavaScript e scripts de suporte);\n- A arquitetura, estrutura dos módulos e lógica de funcionamento da ficha;\n- O design de interface, elementos visuais originais e estilos do terminal;\n- A documentação e os textos explicativos redigidos pelo autor.\n\n---\n\n## 3. Condições de Uso (Uso Privado entre Amigos)\n\n- **Permissão de uso pessoal:** O aplicativo pode ser utilizado livremente para fins pessoais e não comerciais por mim e pelos participantes das nossas partidas de RPG, incluindo criação, preenchimento, edição, importação e exportação de fichas.\n- **Propriedade dos dados:** As fichas, anotações e arquivos (JSON ou PDF) gerados durante o uso pertencem aos seus respectivos criadores e jogadores.\n- **Distribuição restrita:** Como se trata de um projeto de uso privado, é vedada a comercialização, venda, cobrança por acesso ou redistribuição pública do código-fonte ou dos executáveis sem autorização prévia do autor.\n- **Créditos:** Os avisos de autoria originais devem ser preservados.\n\n---\n\n## 4. Direitos de Terceiros e Marcas\n\n- **Shadowrun:** O autor não é proprietário e não reivindica direitos sobre o nome *Shadowrun*, *Shadowrun: Anarchy*, regras oficiais, livros, ilustrações ou o universo ficcional do jogo, que pertencem aos seus respectivos titulares (como The Topps Company, Inc. e Catalyst Game Labs). O uso de termos do jogo ocorre unicamente para compatibilidade com as regras nas sessões de RPG.\n- **Componentes e Fontes:** As fontes tipográficas locais e as ferramentas de desenvolvimento utilizadas no projeto pertencem aos seus respectivos autores e continuam regidas por suas licenças originais, detalhadas no arquivo `THIRD-PARTY-NOTICES.md`.\n\n---\n\n## 5. Eventual Publicação Futura\n\nCaso o projeto venha a ser disponibilizado publicamente, compartilhado amplamente ou integrado a um portfólio profissional no futuro, este documento e as atribuições de terceiros serão revistos para assegurar a conformidade com o novo cenário de divulgação.\n\n---\n\n## 6. Isenção Simples de Responsabilidade\n\nO aplicativo é fornecido \"no estado em que se encontra\" (*as is*), para uso recreativo. O autor empenhou-se na estabilidade do sistema, mas não garante funcionamento livre de imprevistos. Recomenda-se aos jogadores manterem cópias de suas fichas por meio das opções de exportação e backup do próprio sistema.\n";
export const THIRD_PARTY_NOTICES_TEXT = "# Avisos de Terceiros e Componentes de Código Aberto\n\nEste documento relaciona os avisos de atribuição, marcas e licenças de componentes de terceiros utilizados no projeto **Terminal Clandestino de Gerenciamento de Runner** (Shadowrun: Anarchy — Gerenciador de Fichas).\n\n---\n\n## 1. Referências ao Universo Shadowrun\n\n- **Shadowrun** e **Shadowrun: Anarchy** são marcas e propriedades intelectuais pertencentes aos seus respectivos detentores (como The Topps Company, Inc. e Catalyst Game Labs).\n- Este projeto é uma ferramenta amadora, complementar e independente, desenvolvida sem fins lucrativos ou comerciais, destinada ao uso pessoal em partidas privadas de RPG entre amigos.\n- O projeto não possui afiliação, patrocínio ou endosso por parte dos titulares oficiais da franquia. O uso de nomes de atributos, perícias e termos do sistema tem finalidade puramente referencial para viabilizar as fichas de jogo.\n\n---\n\n## 2. Fontes Tipográficas Locais (SIL Open Font License 1.1)\n\nO aplicativo utiliza as seguintes famílias tipográficas armazenadas localmente para permitir o funcionamento offline. Todas são distribuídas sob a **SIL Open Font License, Version 1.1 (OFL)**:\n\n- **Chakra Petch:** Copyright (c) 2018 Cadson Demak (https://github.com/cadsondemak/chakra-petch)\n- **JetBrains Mono:** Copyright (c) 2020 JetBrains s.r.o. (https://github.com/JetBrains/JetBrainsMono)\n- **Rajdhani:** Copyright (c) 2014 Indian Type Foundry (info@indiantypefoundry.com)\n- **Share Tech Mono:** Copyright (c) 2012 Carrois Type Design / Ralph du Carrois\n- **Space Grotesk:** Copyright (c) 2020 Florian Karsten (https://github.com/floriankarsten/space-grotesk)\n\n### Texto da Licença SIL Open Font License, Version 1.1\n\n```text\nSIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n\nPREAMBLE\nThe goals of the Open Font License (OFL) are to stimulate worldwide\ndevelopment of collaborative font projects, to support the font creation\nefforts of academic and linguistic communities, and to provide a free and\nopen framework in which fonts may be shared and improved in partnership\nwith others.\n\nThe OFL allows the licensed fonts to be used, studied, modified and\nredistributed freely as long as they are not sold by themselves. The\nfonts, including any derivative works, can be bundled, embedded, \nredistributed and/or sold with any software provided that any reserved\nnames are not used by derivative works. The fonts and derivatives,\nhowever, cannot be released under any other type of license. The\nrequirement for fonts to remain under this license does not apply\nto any document created using the fonts or their derivatives.\n\nDEFINITIONS\n\"Font Software\" refers to the set of files released by the Copyright\nHolder(s) under this license and clearly marked as such. This may include\nsource files, build scripts and documentation.\n\n\"Reserved Font Name\" refers to any names specified as such after the\ncopyright statement(s).\n\n\"Original Version\" refers to the collection of Font Software components as\ndistributed by the Copyright Holder(s).\n\n\"Modified Version\" refers to any derivative made by adding to, deleting,\nor substituting -- in part or in whole -- any of the components of the\nOriginal Version, by changing formats or by porting the Font Software to a\nnew environment.\n\n\"Author\" refers to any designer, engineer, programmer, technical\nwriter or other person who contributed to the Font Software.\n\nPERMISSION & CONDITIONS\nPermission is hereby granted, free of charge, to any person obtaining\na copy of the Font Software, to use, study, copy, merge, embed, modify,\nredistribute, and sell modified and unmodified copies of the Font\nSoftware, subject to the following conditions:\n\n1) Neither the Font Software nor any of its individual components,\nin Original or Modified Versions, may be sold by itself.\n\n2) Original or Modified Versions of the Font Software may be bundled,\nredistributed and/or sold with any software, provided that each copy\ncontains the above copyright notice and this license. These can be\nincluded either as stand-alone text files, human-readable headers or\nin the appropriate machine-readable metadata fields within text or\nbinary files as long as those fields can be easily viewed by the user.\n\n3) No Modified Version of the Font Software may use the Reserved Font\nName(s) unless prominent written permission is granted by the corresponding\nCopyright Holder. This restriction only applies to the primary font name as\npresented to the users.\n\n4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font\nSoftware shall not be used to promote, endorse or advertise any\nModified Version, except to acknowledge the contribution(s) of the\nCopyright Holder(s) and the Author(s) or with their explicit written\npermission.\n\n5) The Font Software, modified or unmodified, in part or in whole,\nmust be distributed entirely under this license, and must not be\ndistributed under any other license. The requirement for fonts to\nremain under this license does not apply to any document created\nusing the Font Software.\n\nTERMINATION\nThis license becomes null and void if any of the above conditions are\nnot met.\n\nDISCLAIMER\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\nOF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE\nCOPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\nINCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL\nDAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\nFROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM\nOTHER DEALINGS IN THE FONT SOFTWARE.\n```\n\n---\n\n## 3. Ferramentas da Versão Desktop (Licença MIT)\n\nPara a compilação e execução da versão desktop para Windows, o projeto utiliza dependências de desenvolvimento regidas pela **Licença MIT**:\n\n- **Electron:** Copyright (c) Electron contributors / OpenJS Foundation (https://github.com/electron/electron)\n- **electron-builder:** Copyright (c) electron-builder contributors (https://github.com/electron-userland/electron-builder)\n\nO runtime empacotado pelo Electron também integra projetos de código aberto como Chromium, Node.js e V8, sob suas respectivas licenças livres (como BSD e MIT).\n\n### Texto da Licença MIT\n\n```text\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n```\n";
