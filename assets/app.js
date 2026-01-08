const STORAGE_KEYS = {
  roles: "lg_roles",
  compositions: "lg_compositions",
};

const MODE_LABELS = {
  clair: "Clair (Thiercelieux)",
  flou: "Flou (Ultimate)",
  obscur: "Obscur (Jin-Rou DX)",
};

const MODE_SHORT_LABELS = {
  clair: "Clair",
  flou: "Flou",
  obscur: "Obscur",
};

const TEMPO_LABELS = {
  express: "Express",
  equilibree: "Standard",
  lente: "Lente",
};

const TYPE_LABELS = {
  elimination: "Rôle d'élimination",
  protection: "Rôle de protection",
  "voyance-major": "Rôle de voyance majeure",
  "voyance-minor": "Rôle de voyance mineure",
  solitaire: "Rôle solitaire",
  day: "Rôle de mécanique de jour",
};

const ALIGN_LABELS = {
  bon: "Bon",
  mauvais: "Mauvais",
};

const CORE_ROLE_IDS = ["villageois", "loup-garou"];

const coreRoles = [
  {
    id: "villageois",
    name: "Simple Villageois",
    alignment: "bon",
    types: [],
    handicap: false,
    wolf: false,
    weight: "1",
    description: "Aucun pouvoir. Vote le jour pour éliminer un membre du village.",
    modes: ["clair", "flou", "obscur"],
    locked: true,
  },
  {
    id: "loup-garou",
    name: "Loup-garou",
    alignment: "mauvais",
    types: ["elimination"],
    handicap: false,
    wolf: true,
    weight: "(2-8*N)",
    description: "Peut se concerter avec ses pairs afin d'éliminer un membre du village, la nuit.",
    modes: ["clair", "flou", "obscur"],
    locked: true,
  },
];

const defaultRoles = [
  ...coreRoles,
  {
    id: "voyante",
    name: "Voyante",
    alignment: "bon",
    types: ["voyance-major"],
    handicap: false,
    wolf: false,
    weight: "1.5",
    description: "Peut consulter l'alignement d'un joueur chaque nuit.",
    modes: ["clair", "flou"],
  },
  {
    id: "garde",
    name: "Garde",
    alignment: "bon",
    types: ["protection"],
    handicap: false,
    wolf: false,
    weight: "1.2",
    description: "Protège un joueur chaque nuit.",
    modes: ["clair", "flou", "obscur"],
  },
  {
    id: "chasseur",
    name: "Chasseur",
    alignment: "bon",
    types: ["elimination"],
    handicap: false,
    wolf: false,
    weight: "0.8",
    description: "Peut éliminer un joueur en mourant.",
    modes: ["clair", "flou"],
  },
  {
    id: "loup-blanc",
    name: "Loup Blanc",
    alignment: "mauvais",
    types: ["solitaire"],
    handicap: false,
    wolf: false,
    weight: "-1.2",
    description: "Loup solitaire qui cherche à éliminer d'autres loups.",
    modes: ["flou", "obscur"],
  },
  {
    id: "voyante-mineure",
    name: "Divinateur",
    alignment: "bon",
    types: ["voyance-minor"],
    handicap: false,
    wolf: false,
    weight: "0.6",
    description: "Obtient des indices mineurs sur un joueur chaque nuit.",
    modes: ["clair", "flou", "obscur"],
  },
  {
    id: "notaire",
    name: "Notaire",
    alignment: "bon",
    types: ["day"],
    handicap: false,
    wolf: false,
    weight: "0.2",
    description: "Apporte une mécanique de jour lors des votes.",
    modes: ["clair", "flou", "obscur"],
  },
];

const precompRules = {
  8: { minGood: 6, maxWolves: 2, minVillagers: 2, maxVisionProtection: 2, maxSoloHandicap: 0, maxDay: 1 },
  9: { minGood: 6, maxWolves: 2, minVillagers: 3, maxVisionProtection: 2, maxSoloHandicap: 0, maxDay: 1 },
  10: { minGood: 7, maxWolves: 2, minVillagers: 3, maxVisionProtection: 3, maxSoloHandicap: 1, maxDay: 1 },
  11: { minGood: 7, maxWolves: 2, minVillagers: 4, maxVisionProtection: 3, maxSoloHandicap: 1, maxDay: 1 },
  12: {
    minGood: 8,
    maxWolves: 3,
    minVillagers: 3,
    maxVisionProtection: 3,
    maxSoloHandicap: 1,
    maxDay: 1,
    wolvesIfSoloHandicap: 2,
  },
  13: {
    minGood: 9,
    maxWolves: 3,
    minVillagers: 3,
    maxVisionProtection: 3,
    maxSoloHandicap: 1,
    maxDay: 2,
    wolvesIfSoloHandicap: 2,
  },
  14: { minGood: 9, maxWolves: 3, minVillagers: 4, maxVisionProtection: 4, maxSoloHandicap: 1, maxDay: 2 },
  15: {
    minGood: 10,
    maxWolves: 3,
    minVillagers: 5,
    maxVisionProtection: 4,
    minSoloHandicap: 1,
    maxSoloHandicap: 2,
    maxDay: 2,
    wolvesIfTwoSoloHandicap: 2,
    maxSolo: 1,
  },
};

const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("[data-target]");
const composeForm = document.getElementById("compose-form");
const precompList = document.getElementById("precomp-list");
const precompMeta = document.getElementById("precomp-meta");
const editButton = document.getElementById("edit-precomp");
const regenButton = document.getElementById("regen-precomp");
const editRolesList = document.getElementById("edit-roles");
const editSummary = document.getElementById("edit-summary");
const balanceInfo = document.getElementById("balance-info");
const availableRoles = document.getElementById("available-roles");
const saveCompositionButton = document.getElementById("save-composition");
const savedList = document.getElementById("saved-list");
const rolesTable = document.getElementById("roles-table");
const roleForm = document.getElementById("role-form");
const roleFormTitle = document.getElementById("role-form-title");
const roleSubmit = document.getElementById("role-submit");
const roleCancel = document.getElementById("role-cancel");
const exportRolesButton = document.getElementById("export-roles");
const importRolesInput = document.getElementById("import-roles");
const compositionNameInput = document.getElementById("composition-name");
const ruleWarnings = document.getElementById("rule-warnings");
const warningList = document.getElementById("warning-list");

let currentDraft = null;
let editingRoleId = null;

const showScreen = (id) => {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });
};

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.target);
  });
});

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const mapLegacyType = (type) => {
  const trimmed = type?.toString().trim();
  if (trimmed === "voyance") {
    return "voyance-major";
  }
  if (trimmed === "voyance-majeure") {
    return "voyance-major";
  }
  if (trimmed === "voyance-mineure") {
    return "voyance-minor";
  }
  if (trimmed === "jour") {
    return "day";
  }
  return trimmed;
};

const normalizeRoles = (roles) =>
  roles.map((role) => {
    const types = Array.from(
      new Set((role.types ?? []).map(mapLegacyType).filter((type) => type && TYPE_LABELS[type]))
    );
    const isSolitaire = types.includes("solitaire");
    const alignment = role.alignment === "mauvais" ? "mauvais" : "bon";
    return {
      ...role,
      alignment,
      types,
      modes: role.modes?.length ? role.modes : ["clair", "flou", "obscur"],
      handicap: isSolitaire ? false : role.handicap ?? false,
      wolf: isSolitaire ? false : role.wolf ?? false,
      description: role.description ?? "",
      weight: role.weight ?? "0",
      locked: role.locked ?? CORE_ROLE_IDS.includes(role.id),
    };
  });

const ensureCoreRoles = (roles) => {
  const map = new Map(roles.map((role) => [role.id, role]));
  coreRoles.forEach((coreRole) => {
    map.set(coreRole.id, coreRole);
  });
  return Array.from(map.values());
};

const ensureRolesFromFile = async () => {
  const stored = readStorage(STORAGE_KEYS.roles, null);
  if (stored && stored.length) {
    const normalized = ensureCoreRoles(normalizeRoles(stored));
    writeStorage(STORAGE_KEYS.roles, normalized);
    return normalized;
  }
  try {
    const response = await fetch("assets/roles.json");
    if (!response.ok) {
      throw new Error("Impossible de charger le fichier des rôles.");
    }
    const roles = ensureCoreRoles(normalizeRoles(await response.json()));
    writeStorage(STORAGE_KEYS.roles, roles);
    return roles;
  } catch (error) {
    const normalized = ensureCoreRoles(normalizeRoles(defaultRoles));
    writeStorage(STORAGE_KEYS.roles, normalized);
    return normalized;
  }
};

const getRoles = () => {
  const stored = readStorage(STORAGE_KEYS.roles, null);
  if (!stored || stored.length === 0) {
    const normalized = ensureCoreRoles(normalizeRoles(defaultRoles));
    writeStorage(STORAGE_KEYS.roles, normalized);
    return normalized;
  }
  const normalized = ensureCoreRoles(normalizeRoles(stored));
  writeStorage(STORAGE_KEYS.roles, normalized);
  return normalized;
};

const getCompositions = () => readStorage(STORAGE_KEYS.compositions, []);

const persistCompositions = (compositions) => writeStorage(STORAGE_KEYS.compositions, compositions);

const sanitizeFormula = (formula) => /^[0-9N+\-*/().\s]+$/.test(formula);

const evaluateWeight = (formula, count) => {
  const value = formula?.toString().trim();
  if (!value) {
    return 0;
  }
  if (!sanitizeFormula(value)) {
    return 0;
  }
  const expression = value.replace(/N/g, `${count}`);
  try {
    return Number(new Function(`return (${expression});`)());
  } catch (error) {
    return 0;
  }
};

const computeBalance = (composition, roles) => {
  return composition.roles.reduce((sum, roleEntry) => {
    const role = roles.find((item) => item.id === roleEntry.roleId);
    if (!role) {
      return sum;
    }
    const weight = evaluateWeight(role.weight, roleEntry.count);
    return sum + weight;
  }, 0);
};

const countComposition = (composition, roles) => {
  const totals = {
    total: 0,
    good: 0,
    bad: 0,
    wolves: 0,
    villagers: 0,
    solo: 0,
    handicap: 0,
    day: 0,
    visionProtection: 0,
    voyanceMajorGood: 0,
    protectionGood: 0,
    elimination: 0,
    voyance: 0,
    protection: 0,
  };

  composition.roles.forEach((entry) => {
    const role = roles.find((item) => item.id === entry.roleId);
    if (!role) {
      return;
    }
    totals.total += entry.count;
    if (role.alignment === "mauvais") {
      totals.bad += entry.count;
    } else {
      totals.good += entry.count;
    }
    if (role.wolf) {
      totals.wolves += entry.count;
    }
    if (role.id === "villageois") {
      totals.villagers += entry.count;
    }
    if (role.types.includes("solitaire")) {
      totals.solo += entry.count;
    }
    if (role.handicap) {
      totals.handicap += entry.count;
    }
    if (role.types.includes("day")) {
      totals.day += entry.count;
    }
    if (role.types.includes("elimination")) {
      totals.elimination += entry.count;
    }
    if (role.types.includes("voyance-major") || role.types.includes("voyance-minor")) {
      totals.voyance += entry.count;
    }
    if (role.types.includes("protection")) {
      totals.protection += entry.count;
    }
    if (role.types.some((type) => ["protection", "voyance-major", "voyance-minor"].includes(type))) {
      totals.visionProtection += entry.count;
    }
    if (role.alignment === "bon" && role.types.includes("voyance-major")) {
      totals.voyanceMajorGood += entry.count;
    }
    if (role.alignment === "bon" && role.types.includes("protection")) {
      totals.protectionGood += entry.count;
    }
  });

  return totals;
};

const labelTypes = (types) => {
  if (!types.length) {
    return "Aucun";
  }
  return types.map((type) => TYPE_LABELS[type]).join(", ");
};

const labelModes = (modes) => modes.map((mode) => MODE_LABELS[mode]).join(", ");

const shuffleArray = (array) => {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const getRuleWarnings = (composition, roles, { includeMode = false } = {}) => {
  const rules = precompRules[composition.players];
  if (!rules) {
    return [];
  }
  const totals = countComposition(composition, roles);
  const warnings = [];

  if (totals.good < rules.minGood) {
    warnings.push(`Minimum ${rules.minGood} rôle(s) d'alignement Bon.`);
  }
  if (totals.wolves > rules.maxWolves) {
    warnings.push(`Maximum ${rules.maxWolves} rôle(s) cochés comme loup.`);
  }
  if (totals.villagers < rules.minVillagers) {
    warnings.push(`Minimum ${rules.minVillagers} rôle(s) de Simple Villageois.`);
  }
  if (totals.visionProtection > rules.maxVisionProtection) {
    warnings.push(`Maximum ${rules.maxVisionProtection} rôle(s) de voyance et de protection cumulés.`);
  }
  if (rules.maxSoloHandicap !== undefined && totals.solo + totals.handicap > rules.maxSoloHandicap) {
    warnings.push(`Maximum ${rules.maxSoloHandicap} rôle(s) solitaire ou d'handicap.`);
  }
  if (rules.minSoloHandicap && totals.solo + totals.handicap < rules.minSoloHandicap) {
    warnings.push(`Minimum ${rules.minSoloHandicap} rôle(s) solitaire ou d'handicap.`);
  }
  if (rules.maxSolo !== undefined && totals.solo > rules.maxSolo) {
    warnings.push("Impossible d'avoir plus d'un rôle solitaire.");
  }
  if (rules.maxDay !== undefined && totals.day > rules.maxDay) {
    warnings.push(`Maximum ${rules.maxDay} rôle(s) de mécanique de jour.`);
  }
  if (rules.wolvesIfSoloHandicap && totals.solo + totals.handicap > 0 && totals.wolves > rules.wolvesIfSoloHandicap) {
    warnings.push(`Avec un rôle solitaire ou handicap, maximum ${rules.wolvesIfSoloHandicap} rôle(s) loup.`);
  }
  if (
    rules.wolvesIfTwoSoloHandicap &&
    totals.solo + totals.handicap >= 2 &&
    totals.wolves > rules.wolvesIfTwoSoloHandicap
  ) {
    warnings.push(`Avec deux rôles solitaire/handicap, maximum ${rules.wolvesIfTwoSoloHandicap} rôle(s) loup.`);
  }
  if (totals.voyanceMajorGood > 1) {
    warnings.push("Maximum 1 rôle de voyance majeure d'alignement Bon.");
  }
  if (totals.protectionGood > 2) {
    warnings.push("Maximum 2 rôles de protection d'alignement Bon.");
  }

  const balance = computeBalance(composition, roles);
  if (balance < -2 || balance > 3) {
    warnings.push("Le poids d'équilibrage doit rester entre -2 et +3.");
  }

  const duplicateNonCore = composition.roles.some((entry) => {
    if (entry.count <= 1) {
      return false;
    }
    return !CORE_ROLE_IDS.includes(entry.roleId);
  });
  if (duplicateNonCore) {
    warnings.push("Un seul exemplaire autorisé pour chaque rôle non par défaut.");
  }

  if (includeMode) {
    const invalidMode = composition.roles.some((entry) => {
      const role = roles.find((item) => item.id === entry.roleId);
      return role ? !role.modes.includes(composition.mode) : false;
    });
    if (invalidMode) {
      warnings.push("Certains rôles ne correspondent pas au mode de jeu sélectionné.");
    }
  }

  return warnings;
};

const buildTempoScore = (role, tempo) => {
  let score = 0;
  const hasType = (type) => role.types.includes(type);
  if (hasType("elimination")) {
    score += tempo === "express" ? 3 : tempo === "equilibree" ? 2 : 1;
  }
  if (hasType("voyance-major") || hasType("voyance-minor")) {
    score += tempo === "lente" ? 3 : tempo === "equilibree" ? 2 : 1;
  }
  if (hasType("protection")) {
    score += tempo === "lente" ? 3 : tempo === "equilibree" ? 2 : 1;
  }
  if (hasType("day")) {
    score += tempo === "express" ? 2 : 1;
  }
  if (hasType("solitaire")) {
    score += tempo === "lente" ? 2 : 1;
  }
  return score;
};

const canAddRoleToPrecomp = ({ composition, role, rules, roles }) => {
  const totals = countComposition(composition, roles);
  const maxBad = composition.players - rules.minGood;
  if (role.alignment === "mauvais" && totals.bad + 1 > maxBad) {
    return false;
  }
  if (role.wolf && totals.wolves + 1 > rules.maxWolves) {
    return false;
  }
  const nextSolo = totals.solo + (role.types.includes("solitaire") ? 1 : 0);
  const nextHandicap = totals.handicap + (role.handicap ? 1 : 0);
  const nextWolves = totals.wolves + (role.wolf ? 1 : 0);
  if (rules.maxSoloHandicap !== undefined && nextSolo + nextHandicap > rules.maxSoloHandicap) {
    return false;
  }
  if (rules.maxSolo !== undefined && nextSolo > rules.maxSolo) {
    return false;
  }
  if (rules.wolvesIfSoloHandicap && nextSolo + nextHandicap > 0 && nextWolves > rules.wolvesIfSoloHandicap) {
    return false;
  }
  if (
    rules.wolvesIfTwoSoloHandicap &&
    nextSolo + nextHandicap >= 2 &&
    nextWolves > rules.wolvesIfTwoSoloHandicap
  ) {
    return false;
  }
  if (rules.maxDay !== undefined && totals.day + (role.types.includes("day") ? 1 : 0) > rules.maxDay) {
    return false;
  }
  const nextVisionProtection =
    totals.visionProtection +
    (role.types.some((type) => ["protection", "voyance-major", "voyance-minor"].includes(type)) ? 1 : 0);
  if (nextVisionProtection > rules.maxVisionProtection) {
    return false;
  }
  if (role.alignment === "bon" && role.types.includes("voyance-major") && totals.voyanceMajorGood + 1 > 1) {
    return false;
  }
  if (role.alignment === "bon" && role.types.includes("protection") && totals.protectionGood + 1 > 2) {
    return false;
  }
  return true;
};

const buildPrecomposition = ({ players, mode, tempo }) => {
  const roles = getRoles().filter((role) => role.modes.includes(mode));
  const rules = precompRules[players];
  if (!rules) {
    return null;
  }
  const wolfRole = roles.find((role) => role.id === "loup-garou");
  const villagerRole = roles.find((role) => role.id === "villageois");

  const attempts = 40;
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const wolfCountOptions = wolfRole ? Array.from({ length: rules.maxWolves }, (_, idx) => idx + 1) : [0];
    const weightedWolfCounts = wolfCountOptions.flatMap((count) => {
      let weight = 1;
      if (tempo === "express") {
        weight = count;
      } else if (tempo === "lente") {
        weight = rules.maxWolves - count + 1;
      } else {
        weight = Math.max(1, Math.round(rules.maxWolves / 2) - Math.abs(count - Math.round(rules.maxWolves / 2)) + 1);
      }
      return Array.from({ length: weight }, () => count);
    });
    const wolfCount = Math.max(
      0,
      Math.min(weightedWolfCounts[Math.floor(Math.random() * weightedWolfCounts.length)], players - rules.minVillagers)
    );
    const composition = {
      id: crypto.randomUUID(),
      name: `Composition ${new Date().toLocaleDateString("fr-FR")}`,
      players,
      mode,
      tempo,
      roles: [],
    };

    if (wolfRole && wolfCount > 0) {
      composition.roles.push({ roleId: wolfRole.id, count: wolfCount });
    }
    if (villagerRole && rules.minVillagers > 0) {
      composition.roles.push({ roleId: villagerRole.id, count: rules.minVillagers });
    }

    const candidates = shuffleArray(
      roles.filter((role) => !CORE_ROLE_IDS.includes(role.id))
    ).sort((a, b) => buildTempoScore(b, tempo) - buildTempoScore(a, tempo));

    let remaining = players - countComposition(composition, roles).total;

    candidates.forEach((role) => {
      if (remaining <= 0) {
        return;
      }
      if (!canAddRoleToPrecomp({ composition, role, rules, roles })) {
        return;
      }
      composition.roles.push({ roleId: role.id, count: 1 });
      remaining -= 1;
    });

    if (remaining > 0 && villagerRole) {
      const villagerEntry = composition.roles.find((entry) => entry.roleId === villagerRole.id);
      if (villagerEntry) {
        villagerEntry.count += remaining;
      } else {
        composition.roles.push({ roleId: villagerRole.id, count: remaining });
      }
    }

    if (rules.minSoloHandicap) {
      const totals = countComposition(composition, roles);
      if (totals.solo + totals.handicap < rules.minSoloHandicap) {
        const soloCandidates = candidates.filter((role) => role.types.includes("solitaire") || role.handicap);
        for (const role of soloCandidates) {
          if (!canAddRoleToPrecomp({ composition, role, rules, roles })) {
            continue;
          }
          const villagerEntry = composition.roles.find((entry) => entry.roleId === villagerRole?.id);
          if (villagerEntry && villagerEntry.count > rules.minVillagers) {
            villagerEntry.count -= 1;
            composition.roles.push({ roleId: role.id, count: 1 });
            break;
          }
        }
      }
    }

    const warnings = getRuleWarnings(composition, roles);
    const balance = computeBalance(composition, roles);
    const score = warnings.length * 10 + Math.abs(Math.min(-2 - balance, 0)) + Math.abs(Math.max(balance - 3, 0));
    if (warnings.length === 0) {
      return composition;
    }
    if (score < bestScore) {
      bestScore = score;
      best = composition;
    }
  }

  return best;
};

const updatePrecompView = (composition, roles) => {
  if (!composition) {
    return;
  }
  precompList.innerHTML = "";
  const balance = computeBalance(composition, roles);
  precompMeta.textContent = `${composition.players} joueurs · ${MODE_LABELS[composition.mode]} · ${TEMPO_LABELS[composition.tempo]} · Équilibrage: ${balance.toFixed(2)}`;
  composition.roles.forEach((entry) => {
    const role = roles.find((item) => item.id === entry.roleId);
    if (!role) {
      return;
    }
    const listItem = document.createElement("li");
    listItem.textContent = `${entry.count} × ${role.name}`;
    precompList.appendChild(listItem);
  });
};

const renderWarnings = (composition, roles) => {
  const warnings = getRuleWarnings(composition, roles, { includeMode: true });
  warningList.innerHTML = "";
  if (!warnings.length) {
    ruleWarnings.hidden = true;
    return;
  }
  warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning;
    warningList.appendChild(item);
  });
  ruleWarnings.hidden = false;
};

const renderEditView = (composition) => {
  const roles = getRoles();
  compositionNameInput.value = composition.name ?? "";
  editSummary.textContent = `${composition.players} joueurs · ${MODE_LABELS[composition.mode]} · ${TEMPO_LABELS[composition.tempo]}`;
  const balance = computeBalance(composition, roles);
  const totals = countComposition(composition, roles);
  balanceInfo.innerHTML = `
    <strong>Valeur d'équilibrage :</strong> ${balance.toFixed(2)} (objectif entre -2 et +3)
    <br />
    <strong>Répartition :</strong> ${totals.good} Bon · ${totals.bad} Mauvais · ${totals.villagers} Villageois · ${totals.wolves} Loups
  `;

  editRolesList.innerHTML = "";
  composition.roles.forEach((entry) => {
    const role = roles.find((item) => item.id === entry.roleId);
    if (!role) {
      return;
    }
    const listItem = document.createElement("li");
    const flags = [
      labelTypes(role.types),
      ALIGN_LABELS[role.alignment],
      `Poids ${role.weight}`,
      role.handicap ? "Handicap" : null,
      role.wolf ? "Loup" : null,
    ].filter(Boolean);
    listItem.innerHTML = `
      <div>
        <strong>${role.name}</strong>
        <div class="meta">${flags.join(" · ")}</div>
      </div>
      <div class="counter">
        <button class="decrement" data-role="${role.id}">-</button>
        <input class="count-input" type="number" min="0" value="${entry.count}" data-role="${role.id}" />
        <button class="increment" data-role="${role.id}">+</button>
      </div>
    `;
    editRolesList.appendChild(listItem);
  });

  availableRoles.innerHTML = "";
  roles.forEach((role) => {
    const card = document.createElement("div");
    card.className = "role-card";
    const extra = [
      role.handicap ? "Handicap" : null,
      role.wolf ? "Loup" : null,
      role.types.includes("solitaire") ? "Solitaire" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    card.innerHTML = `
      <strong>${role.name}</strong>
      <div class="meta">${labelTypes(role.types)} · ${ALIGN_LABELS[role.alignment]}${extra ? ` · ${extra}` : ""}</div>
      <p>${role.description || "Aucune description."}</p>
      <button data-role="${role.id}">Ajouter</button>
    `;
    availableRoles.appendChild(card);
  });

  renderWarnings(composition, roles);
};

const updateDraft = (updater) => {
  if (!currentDraft) {
    return;
  }
  updater(currentDraft);
  currentDraft.roles = currentDraft.roles.filter((entry) => entry.count > 0);
  renderEditView(currentDraft);
};

composeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const players = Number(document.getElementById("player-count").value);
  const mode = document.getElementById("game-mode").value;
  const tempo = document.getElementById("game-tempo").value;
  const composition = buildPrecomposition({ players, mode, tempo });
  if (!composition) {
    return;
  }
  currentDraft = composition;
  updatePrecompView(composition, getRoles());
  editButton.disabled = false;
  regenButton.disabled = false;
});

regenButton.addEventListener("click", () => {
  const players = Number(document.getElementById("player-count").value);
  const mode = document.getElementById("game-mode").value;
  const tempo = document.getElementById("game-tempo").value;
  const composition = buildPrecomposition({ players, mode, tempo });
  if (!composition) {
    return;
  }
  currentDraft = composition;
  updatePrecompView(composition, getRoles());
});

editButton.addEventListener("click", () => {
  if (!currentDraft) {
    return;
  }
  renderEditView(currentDraft);
  showScreen("edit");
});

compositionNameInput.addEventListener("input", () => {
  if (!currentDraft) {
    return;
  }
  currentDraft.name = compositionNameInput.value.trim() || currentDraft.name;
});

editRolesList.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches("button")) {
    return;
  }
  const roleId = target.dataset.role;
  if (!roleId) {
    return;
  }
  updateDraft((draft) => {
    const entry = draft.roles.find((item) => item.roleId === roleId);
    if (!entry) {
      return;
    }
    if (target.classList.contains("increment")) {
      entry.count += 1;
      return;
    }
    if (target.classList.contains("decrement") && entry.count > 0) {
      entry.count -= 1;
    }
  });
});

editRolesList.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.matches(".count-input")) {
    return;
  }
  const roleId = target.dataset.role;
  const value = Number(target.value);
  updateDraft((draft) => {
    const entry = draft.roles.find((item) => item.roleId === roleId);
    if (!entry) {
      return;
    }
    entry.count = Number.isNaN(value) ? entry.count : Math.max(0, value);
  });
});

availableRoles.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches("button")) {
    return;
  }
  const roleId = target.dataset.role;
  updateDraft((draft) => {
    const entry = draft.roles.find((item) => item.roleId === roleId);
    if (entry) {
      entry.count += 1;
    } else {
      draft.roles.push({ roleId, count: 1 });
    }
  });
});

saveCompositionButton.addEventListener("click", () => {
  if (!currentDraft) {
    return;
  }
  const compositions = getCompositions();
  const name = compositionNameInput.value.trim() || currentDraft.name;
  compositions.push({
    ...currentDraft,
    id: crypto.randomUUID(),
    name,
  });
  persistCompositions(compositions);
  renderSavedCompositions();
  showScreen("saved");
});

const renderSavedCompositions = () => {
  savedList.innerHTML = "";
  const template = document.getElementById("saved-template");
  const roles = getRoles();
  const compositions = getCompositions();
  compositions.forEach((composition) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".saved-card");
    const titleInput = clone.querySelector(".saved-title");
    const meta = clone.querySelector(".saved-meta");
    const warningIcon = clone.querySelector(".saved-warning");
    titleInput.value = composition.name;
    meta.textContent = `${composition.players} joueurs · ${MODE_SHORT_LABELS[composition.mode]} · ${TEMPO_LABELS[composition.tempo]}`;
    const warnings = getRuleWarnings(composition, roles, { includeMode: true });
    warningIcon.hidden = warnings.length === 0;
    titleInput.addEventListener("change", () => {
      composition.name = titleInput.value.trim() || composition.name;
      persistCompositions(compositions);
    });
    clone.querySelector(".open").addEventListener("click", () => {
      currentDraft = JSON.parse(JSON.stringify(composition));
      renderEditView(currentDraft);
      showScreen("edit");
    });
    clone.querySelector(".duplicate").addEventListener("click", () => {
      compositions.push({ ...composition, id: crypto.randomUUID(), name: `${composition.name} (copie)` });
      persistCompositions(compositions);
      renderSavedCompositions();
    });
    clone.querySelector(".delete").addEventListener("click", () => {
      const index = compositions.findIndex((item) => item.id === composition.id);
      compositions.splice(index, 1);
      persistCompositions(compositions);
      renderSavedCompositions();
    });
    savedList.appendChild(card);
  });
  if (!compositions.length) {
    savedList.innerHTML = '<p class="meta">Aucune composition enregistrée pour le moment.</p>';
  }
};

const renderRolesTable = () => {
  const roles = getRoles();
  rolesTable.innerHTML = "";
  roles.forEach((role) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${role.name}${role.locked ? " 🔒" : ""}</td>
      <td class="${role.alignment === "bon" ? "good" : "bad"}">${ALIGN_LABELS[role.alignment]}</td>
      <td>${labelTypes(role.types)}</td>
      <td>${role.handicap ? "Oui" : "Non"}</td>
      <td>${role.wolf ? "Oui" : "Non"}</td>
      <td>${role.weight}</td>
      <td>${labelModes(role.modes)}</td>
      <td class="table-action">
        <button class="edit-button" type="button" data-role="${role.id}" aria-label="Éditer ${role.name}" ${
      role.locked ? "disabled" : ""
    }>✏️</button>
        <button class="delete-button" type="button" data-role="${role.id}" aria-label="Supprimer ${role.name}" ${
      role.locked ? "disabled" : ""
    }>🗑️</button>
      </td>
    `;
    rolesTable.appendChild(row);
  });
};

const setRoleFormMode = (mode) => {
  const isEditing = mode === "edit";
  roleFormTitle.textContent = isEditing ? "Modifier un rôle" : "Ajouter un rôle";
  roleSubmit.textContent = isEditing ? "Mettre à jour le rôle" : "Ajouter le rôle";
  roleCancel.hidden = !isEditing;
};

const resetRoleForm = () => {
  roleForm.reset();
  editingRoleId = null;
  setRoleFormMode("add");
  toggleSolitaireRestrictions();
};

const toggleSolitaireRestrictions = () => {
  const solitaireChecked = Array.from(roleForm.querySelectorAll('#role-types input[value="solitaire"]')).some(
    (input) => input.checked
  );
  const handicapInput = document.getElementById("role-handicap");
  const wolfInput = document.getElementById("role-wolf");
  handicapInput.disabled = solitaireChecked;
  wolfInput.disabled = solitaireChecked;
  if (solitaireChecked) {
    handicapInput.checked = false;
    wolfInput.checked = false;
  }
};

roleForm.addEventListener("change", (event) => {
  if (event.target.matches('#role-types input[value="solitaire"]')) {
    toggleSolitaireRestrictions();
  }
});

roleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const roles = getRoles();
  const name = document.getElementById("role-name").value.trim();
  const description = document.getElementById("role-description").value.trim();
  const alignment = document.getElementById("role-alignment").value;
  const weight = document.getElementById("role-weight").value.trim();
  const handicap = document.getElementById("role-handicap").checked;
  const wolf = document.getElementById("role-wolf").checked;
  const types = Array.from(roleForm.querySelectorAll("#role-types input:checked")).map((input) => input.value);
  const modes = Array.from(roleForm.querySelectorAll("#role-modes input:checked")).map((input) => input.value);
  const sanitizedTypes = Array.from(new Set(types.map(mapLegacyType)));
  const isSolitaire = sanitizedTypes.includes("solitaire");
  if (!name || modes.length === 0) {
    return;
  }
  if (editingRoleId) {
    const target = roles.find((role) => role.id === editingRoleId);
    if (target && !target.locked) {
      target.name = name;
      target.description = description;
      target.alignment = alignment;
      target.types = sanitizedTypes;
      target.weight = weight;
      target.modes = modes;
      target.handicap = isSolitaire ? false : handicap;
      target.wolf = isSolitaire ? false : wolf;
    }
  } else {
    roles.push({
      id: `${name.toLowerCase().replace(/\s+/g, "-")}-${crypto.randomUUID().slice(0, 6)}`,
      name,
      description,
      alignment,
      types: sanitizedTypes,
      weight,
      modes,
      handicap: isSolitaire ? false : handicap,
      wolf: isSolitaire ? false : wolf,
    });
  }
  writeStorage(STORAGE_KEYS.roles, ensureCoreRoles(normalizeRoles(roles)));
  resetRoleForm();
  renderRolesTable();
});

roleCancel.addEventListener("click", () => {
  resetRoleForm();
});

rolesTable.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches(".edit-button, .delete-button")) {
    return;
  }
  const roleId = target.dataset.role;
  const roles = getRoles();
  const role = roles.find((item) => item.id === roleId);
  if (!role || role.locked) {
    return;
  }
  if (target.matches(".delete-button")) {
    const updatedRoles = roles.filter((item) => item.id !== roleId);
    writeStorage(STORAGE_KEYS.roles, ensureCoreRoles(normalizeRoles(updatedRoles)));
    if (editingRoleId === roleId) {
      resetRoleForm();
    }
    const compositions = getCompositions();
    const updatedCompositions = compositions.map((composition) => ({
      ...composition,
      roles: composition.roles.filter((entry) => entry.roleId !== roleId),
    }));
    persistCompositions(updatedCompositions);
    if (currentDraft) {
      currentDraft.roles = currentDraft.roles.filter((entry) => entry.roleId !== roleId);
      renderEditView(currentDraft);
    }
    renderRolesTable();
    renderSavedCompositions();
    return;
  }
  editingRoleId = role.id;
  document.getElementById("role-name").value = role.name;
  document.getElementById("role-description").value = role.description;
  document.getElementById("role-alignment").value = role.alignment;
  document.getElementById("role-weight").value = role.weight;
  document.getElementById("role-handicap").checked = role.handicap;
  document.getElementById("role-wolf").checked = role.wolf;
  roleForm.querySelectorAll("#role-types input").forEach((checkbox) => {
    checkbox.checked = role.types.includes(checkbox.value);
  });
  roleForm.querySelectorAll("#role-modes input").forEach((checkbox) => {
    checkbox.checked = role.modes.includes(checkbox.value);
  });
  toggleSolitaireRestrictions();
  setRoleFormMode("edit");
});

const handleRolesImport = async (file) => {
  if (!file) {
    return;
  }
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return;
    }
    const normalized = ensureCoreRoles(normalizeRoles(parsed));
    writeStorage(STORAGE_KEYS.roles, normalized);
    resetRoleForm();
    renderRolesTable();
  } catch (error) {
    return;
  }
};

exportRolesButton.addEventListener("click", () => {
  const roles = getRoles();
  const blob = new Blob([JSON.stringify(roles, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "roles.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

importRolesInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  handleRolesImport(file);
  event.target.value = "";
});

const init = async () => {
  await ensureRolesFromFile();
  renderRolesTable();
  renderSavedCompositions();
  setRoleFormMode("add");
  toggleSolitaireRestrictions();
};

init();
