const STORAGE_KEYS = {
  roles: "lg_roles",
  compositions: "lg_compositions",
};

const MODE_LABELS = {
  clair: "Clair (Thiercelieux)",
  flou: "Flou (Ultimate)",
  obscur: "Obscur (Jin-Rou DX)",
};

const TEMPO_LABELS = {
  express: "Express",
  equilibree: "Équilibrée",
  lente: "Lente",
};

const TYPE_LABELS = {
  voyance: "Voyance",
  elimination: "Élimination",
  protection: "Protection",
};

const ALIGN_LABELS = {
  bon: "Bon",
  mauvais: "Mauvais",
  neutre: "Neutre",
};

const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("[data-target]");
const composeForm = document.getElementById("compose-form");
const precompList = document.getElementById("precomp-list");
const precompMeta = document.getElementById("precomp-meta");
const editButton = document.getElementById("edit-precomp");
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

let currentDraft = null;
let editingRoleId = null;

const defaultRoles = [
  {
    id: "loup-garou",
    name: "Loup-Garou",
    alignment: "mauvais",
    types: ["elimination"],
    weight: "2 - 0.8*N",
    description: "Se réveille la nuit afin de tuer un membre du village, en se concertant avec ses pairs.",
    modes: ["clair", "flou", "obscur"],
    repeatable: true,
  },
  {
    id: "villageois",
    name: "Simple Villageois",
    alignment: "bon",
    types: [],
    weight: "1",
    description: "Aucun pouvoir. Débat et vote chaque jour pour l'élimination d'un membre du village.",
    modes: ["clair", "flou", "obscur"],
    repeatable: true,
  },
  {
    id: "voyante",
    name: "Voyante",
    alignment: "bon",
    types: ["voyance"],
    weight: "1.5",
    description: "Peut consulter l'alignement d'un joueur chaque nuit.",
    modes: ["clair", "flou"],
    repeatable: false,
  },
  {
    id: "garde",
    name: "Garde",
    alignment: "bon",
    types: ["protection"],
    weight: "1.2",
    description: "Protège un joueur chaque nuit.",
    modes: ["clair", "flou", "obscur"],
    repeatable: false,
  },
  {
    id: "chasseur",
    name: "Chasseur",
    alignment: "bon",
    types: ["elimination"],
    weight: "0.8",
    description: "Peut éliminer un joueur en mourant.",
    modes: ["clair", "flou"],
    repeatable: false,
  },
  {
    id: "loup-blanc",
    name: "Loup Blanc",
    alignment: "mauvais",
    types: ["elimination"],
    weight: "-1.2",
    description: "Loup solitaire qui cherche à éliminer d'autres loups.",
    modes: ["flou", "obscur"],
    repeatable: false,
  },
];

const tempoTargets = {
  express: {
    elimination: 0.55,
    voyance: 0.2,
    protection: 0,
  },
  equilibree: {
    elimination: 0.4333,
    voyance: 0.2,
    protection: 0.0666,
  },
  lente: (playerCount) => {
    const clamp = Math.min(Math.max(playerCount, 9), 15);
    const ratio = (clamp - 9) / 6;
    const voyance = 0.0666 + ratio * (0.3 - 0.0666);
    const protection = 0.3 - ratio * (0.3 - 0.0666);
    return {
      elimination: 0.3666,
      voyance,
      protection,
    };
  },
};

const alignPercentMin = 0.6666;

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

const normalizeRoles = (roles) =>
  roles.map((role) => ({
    ...role,
    repeatable: role.repeatable ?? true,
    types: role.types ?? [],
    modes: role.modes ?? [],
  }));

const ensureRolesFromFile = async () => {
  const stored = readStorage(STORAGE_KEYS.roles, null);
  if (stored && stored.length) {
    const normalized = normalizeRoles(stored);
    writeStorage(STORAGE_KEYS.roles, normalized);
    return normalized;
  }
  try {
    const response = await fetch("assets/roles.json");
    if (!response.ok) {
      throw new Error("Impossible de charger le fichier des rôles.");
    }
    const roles = normalizeRoles(await response.json());
    writeStorage(STORAGE_KEYS.roles, roles);
    return roles;
  } catch (error) {
    writeStorage(STORAGE_KEYS.roles, normalizeRoles(defaultRoles));
    return defaultRoles;
  }
};

const getRoles = () => {
  const stored = readStorage(STORAGE_KEYS.roles, null);
  if (!stored || stored.length === 0) {
    writeStorage(STORAGE_KEYS.roles, defaultRoles);
    return normalizeRoles(defaultRoles);
  }
  return normalizeRoles(stored);
};

const getCompositions = () => readStorage(STORAGE_KEYS.compositions, []);

const persistCompositions = (compositions) => writeStorage(STORAGE_KEYS.compositions, compositions);

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

const computeDistribution = (composition, roles) => {
  const totals = {
    elimination: 0,
    voyance: 0,
    protection: 0,
    goodNeutral: 0,
    bad: 0,
    total: 0,
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
      totals.goodNeutral += entry.count;
    }
    role.types.forEach((type) => {
      if (type in totals) {
        totals[type] += entry.count;
      }
    });
  });
  return totals;
};

const buildTypeTargets = (players, tempo) => {
  const targets = getTempoTargets(tempo, players);
  return {
    elimination: targets.elimination > 0 ? 1 : 0,
    voyance: targets.voyance > 0 ? 1 : 0,
    protection: targets.protection > 0 ? 1 : 0,
  };
};

const canRemoveRole = (role, totals, minTargets) => {
  if (!role) {
    return false;
  }
  return role.types.every((type) => {
    if (!(type in minTargets)) {
      return true;
    }
    return totals[type] - 1 >= minTargets[type];
  });
};

const adjustBalanceWithVillagers = (composition, roles) => {
  const minTargets = buildTypeTargets(composition.players, composition.tempo);
  let balance = computeBalance(composition, roles);
  let totals = computeDistribution(composition, roles);
  let safety = 0;

  const getDelta = (role, count, direction) => {
    const current = evaluateWeight(role.weight, count);
    const next = evaluateWeight(role.weight, count + direction);
    return next - current;
  };

  while ((balance > 1 || balance < -1) && safety < 200) {
    const direction = balance > 1 ? -1 : 1;
    const candidates = composition.roles
      .map((entry) => {
        const role = roles.find((item) => item.id === entry.roleId);
        if (!role || entry.count <= 0) {
          return null;
        }
        if (!canRemoveRole(role, totals, minTargets)) {
          return null;
        }
        const delta = getDelta(role, entry.count, direction);
        if ((balance > 1 && delta >= 0) || (balance < -1 && delta <= 0)) {
          return { role, entry, delta };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    if (!candidates.length) {
      break;
    }
    const { entry, role } = candidates[0];
    entry.count = Math.max(0, entry.count - 1);
    if (role.types.length) {
      totals = computeDistribution(composition, roles);
    }
    balance = computeBalance(composition, roles);
    safety += 1;
  }

  composition.roles = composition.roles.filter((entry) => entry.count > 0);
  const total = composition.roles.reduce((sum, roleEntry) => sum + roleEntry.count, 0);
  const diff = composition.players - total;
  if (diff !== 0) {
    const villager = composition.roles.find((entry) => entry.roleId === "villageois");
    if (villager) {
      villager.count += diff;
    }
  }
  return composition;
};

const labelTypes = (types) => {
  if (!types.length) {
    return "Aucun";
  }
  return types.map((type) => TYPE_LABELS[type]).join(", ");
};

const labelModes = (modes) => modes.map((mode) => MODE_LABELS[mode]).join(", ");

const roundPercent = (value) => Math.round(value * 1000) / 10;

const getTempoTargets = (tempo, playerCount) =>
  tempo === "lente" ? tempoTargets.lente(playerCount) : tempoTargets[tempo];

const inferTempo = (composition, roles) => {
  const totals = computeDistribution(composition, roles);
  if (!totals.total) {
    return composition.tempo;
  }
  const ratios = {
    elimination: totals.elimination / totals.total,
    voyance: totals.voyance / totals.total,
    protection: totals.protection / totals.total,
  };
  const tempos = ["express", "equilibree", "lente"];
  let bestTempo = composition.tempo;
  let bestScore = Number.POSITIVE_INFINITY;
  tempos.forEach((tempo) => {
    const targets = getTempoTargets(tempo, composition.players);
    const score =
      Math.abs(ratios.elimination - targets.elimination) +
      Math.abs(ratios.voyance - targets.voyance) +
      Math.abs(ratios.protection - targets.protection);
    if (score < bestScore) {
      bestScore = score;
      bestTempo = tempo;
    }
  });
  return bestTempo;
};

const inferMode = (composition, roles) => {
  const modes = ["clair", "flou", "obscur"];
  const counts = modes.reduce((acc, mode) => {
    acc[mode] = 0;
    return acc;
  }, {});
  composition.roles.forEach((entry) => {
    const role = roles.find((item) => item.id === entry.roleId);
    if (!role) {
      return;
    }
    role.modes.forEach((mode) => {
      counts[mode] += entry.count;
    });
  });
  const compatibleModes = modes.filter((mode) => {
    return composition.roles.every((entry) => {
      const role = roles.find((item) => item.id === entry.roleId);
      return role ? role.modes.includes(mode) : true;
    });
  });
  if (compatibleModes.length === 1) {
    return compatibleModes[0];
  }
  if (compatibleModes.includes(composition.mode)) {
    return composition.mode;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const buildComposition = ({ players, mode, tempo }) => {
  const roles = getRoles().filter((role) => role.modes.includes(mode));
  const targets = getTempoTargets(tempo, players);
  const totalRoles = players;

  const targetCounts = {
    elimination: Math.max(1, Math.round(totalRoles * targets.elimination)),
    voyance: Math.max(1, Math.round(totalRoles * targets.voyance)),
    protection: targets.protection === 0 ? 0 : Math.max(1, Math.round(totalRoles * targets.protection)),
  };

  const chosen = new Map();
  const addRole = (roleId, count = 1) => {
    const role = roles.find((item) => item.id === roleId);
    if (!role) {
      return false;
    }
    const current = chosen.get(roleId) || 0;
    if (!role.repeatable && current >= 1) {
      return false;
    }
    chosen.set(roleId, current + count);
    return true;
  };

  const wolfRole = roles.find((role) => role.id === "loup-garou");
  if (wolfRole) {
    addRole(wolfRole.id, Math.max(1, Math.round(targetCounts.elimination * 0.7)));
  }

  const fillByType = (type, desired) => {
    const available = roles.filter((role) => role.types.includes(type));
    if (!available.length || desired <= 0) {
      return;
    }
    const weighted = [...available].sort(
      (a, b) => evaluateWeight(a.weight, 1) - evaluateWeight(b.weight, 1)
    );
    let remaining = desired - (Array.from(chosen).reduce((sum, [roleId, count]) => {
      const role = roles.find((item) => item.id === roleId);
      return role && role.types.includes(type) ? sum + count : sum;
    }, 0));
    let index = 0;
    while (remaining > 0 && index < weighted.length * 5) {
      const role = weighted[index % weighted.length];
      if (addRole(role.id, 1)) {
        remaining -= 1;
      }
      index += 1;
    }
  };

  fillByType("elimination", targetCounts.elimination);
  fillByType("voyance", targetCounts.voyance);
  fillByType("protection", targetCounts.protection);

  const currentTotal = Array.from(chosen.values()).reduce((sum, value) => sum + value, 0);
  const remainingSlots = totalRoles - currentTotal;
  const villagers = roles.find((role) => role.id === "villageois");
  if (villagers && remainingSlots > 0) {
    addRole(villagers.id, remainingSlots);
  }

  const rolesEntries = Array.from(chosen.entries()).map(([roleId, count]) => ({ roleId, count }));
  const composition = {
    id: crypto.randomUUID(),
    name: `Composition ${new Date().toLocaleDateString("fr-FR")}`,
    players,
    mode,
    tempo,
    roles: rolesEntries,
  };

  return balanceComposition(composition, roles);
};

const balanceComposition = (composition, roles) => {
  const total = composition.roles.reduce((sum, roleEntry) => sum + roleEntry.count, 0);
  if (total !== composition.players) {
    const diff = composition.players - total;
    const villager = composition.roles.find((entry) => entry.roleId === "villageois");
    if (villager) {
      villager.count += diff;
    }
  }

  const totals = computeDistribution(composition, roles);
  const minGoodNeutral = Math.ceil(composition.players * alignPercentMin);
  if (totals.goodNeutral < minGoodNeutral) {
    const villager = composition.roles.find((entry) => entry.roleId === "villageois");
    const wolves = composition.roles.find((entry) => entry.roleId === "loup-garou");
    if (villager && wolves && wolves.count > 1) {
      const shift = Math.min(wolves.count - 1, minGoodNeutral - totals.goodNeutral);
      wolves.count -= shift;
      villager.count += shift;
    }
  }

  const balance = computeBalance(composition, roles);
  if (balance < -1 || balance > 1) {
    return adjustBalanceWithVillagers(composition, roles);
  }

  return adjustBalanceWithVillagers(composition, roles);
};

const updatePrecompView = (composition, roles) => {
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

const renderEditView = (composition) => {
  const roles = getRoles();
  editSummary.textContent = `${composition.players} joueurs · ${MODE_LABELS[composition.mode]} · ${TEMPO_LABELS[composition.tempo]}`;
  const balance = computeBalance(composition, roles);
  const totals = computeDistribution(composition, roles);
  const goodPercent = totals.total ? roundPercent(totals.goodNeutral / totals.total) : 0;
  balanceInfo.innerHTML = `
    <strong>Valeur d'équilibrage :</strong> ${balance.toFixed(2)} (objectif entre -1 et +1)
    <br />
    <strong>Alignements :</strong> ${goodPercent}% Bon/Neutre · ${roundPercent(totals.bad / totals.total)}% Mauvais
  `;

  editRolesList.innerHTML = "";
  composition.roles.forEach((entry) => {
    const role = roles.find((item) => item.id === entry.roleId);
    if (!role) {
      return;
    }
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <div>
        <strong>${role.name}</strong>
        <div class="meta">${labelTypes(role.types)} · ${ALIGN_LABELS[role.alignment]}</div>
      </div>
      <div class="counter">
        <button class="decrement" data-role="${role.id}">-</button>
        <span>${entry.count}</span>
        <button class="increment" data-role="${role.id}" ${!role.repeatable && entry.count >= 1 ? "disabled" : ""}>+</button>
      </div>
    `;
    editRolesList.appendChild(listItem);
  });

  availableRoles.innerHTML = "";
  roles.forEach((role) => {
    const card = document.createElement("div");
    card.className = "role-card";
    card.innerHTML = `
      <strong>${role.name}</strong>
      <div class="meta">${labelTypes(role.types)} · ${ALIGN_LABELS[role.alignment]}</div>
      <p>${role.description || "Aucune description."}</p>
      <button data-role="${role.id}" ${!role.repeatable && composition.roles.some((entry) => entry.roleId === role.id) ? "disabled" : ""}>Ajouter</button>
    `;
    availableRoles.appendChild(card);
  });
};

const updateDraft = (updater) => {
  if (!currentDraft) {
    return;
  }
  const roles = getRoles();
  updater(currentDraft);
  currentDraft.mode = inferMode(currentDraft, roles);
  currentDraft.tempo = inferTempo(currentDraft, roles);
  currentDraft = balanceComposition(currentDraft, roles);
  renderEditView(currentDraft);
};

composeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const players = Number(document.getElementById("player-count").value);
  const mode = document.getElementById("game-mode").value;
  const tempo = document.getElementById("game-tempo").value;
  const composition = buildComposition({ players, mode, tempo });
  currentDraft = composition;
  updatePrecompView(composition, getRoles());
  editButton.disabled = false;
});

editButton.addEventListener("click", () => {
  if (!currentDraft) {
    return;
  }
  renderEditView(currentDraft);
  showScreen("edit");
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
      const role = roles.find((item) => item.id === roleId);
      if (role && !role.repeatable && entry.count >= 1) {
        return;
      }
      entry.count += 1;
      return;
    }
    if (target.classList.contains("decrement") && entry.count > 0) {
      entry.count -= 1;
    }
    draft.roles = draft.roles.filter((item) => item.count > 0);
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
  compositions.push({
    ...currentDraft,
    id: crypto.randomUUID(),
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
    titleInput.value = composition.name;
    meta.textContent = `${composition.players} joueurs · ${MODE_LABELS[composition.mode]} · ${TEMPO_LABELS[composition.tempo]}`;
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
    savedList.innerHTML = "<p class=\"meta\">Aucune composition enregistrée pour le moment.</p>";
  }
};

const renderRolesTable = () => {
  const roles = getRoles();
  rolesTable.innerHTML = "";
  roles.forEach((role) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${role.name}</td>
      <td class="${role.alignment === "bon" ? "good" : role.alignment === "mauvais" ? "bad" : ""}">${ALIGN_LABELS[role.alignment]}</td>
      <td>${labelTypes(role.types)}</td>
      <td>${role.weight}</td>
      <td>${labelModes(role.modes)}</td>
      <td>${role.repeatable ? "Oui" : "Non"}</td>
      <td class="table-action">
        <button class="edit-button" type="button" data-role="${role.id}" aria-label="Éditer ${role.name}">✏️</button>
        <button class="delete-button" type="button" data-role="${role.id}" aria-label="Supprimer ${role.name}">🗑️</button>
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
};

roleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const roles = getRoles();
  const name = document.getElementById("role-name").value.trim();
  const alignment = document.getElementById("role-alignment").value;
  const weight = document.getElementById("role-weight").value.trim();
  const description = document.getElementById("role-description").value.trim();
  const repeatable = document.getElementById("role-repeatable").checked;
  const types = Array.from(roleForm.querySelectorAll("#role-types input:checked")).map(
    (input) => input.value
  );
  const modes = Array.from(roleForm.querySelectorAll("#role-modes input:checked")).map(
    (input) => input.value
  );
  if (!name || modes.length === 0) {
    return;
  }
  if (editingRoleId) {
    const target = roles.find((role) => role.id === editingRoleId);
    if (target) {
      target.name = name;
      target.alignment = alignment;
      target.types = types;
      target.weight = weight;
      target.description = description;
      target.modes = modes;
      target.repeatable = repeatable;
    }
  } else {
    roles.push({
      id: `${name.toLowerCase().replace(/\s+/g, "-")}-${crypto.randomUUID().slice(0, 6)}`,
      name,
      alignment,
      types,
      weight,
      description,
      modes,
      repeatable,
    });
  }
  writeStorage(STORAGE_KEYS.roles, roles);
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
  if (!role) {
    return;
  }
  if (target.matches(".delete-button")) {
    const updatedRoles = roles.filter((item) => item.id !== roleId);
    writeStorage(STORAGE_KEYS.roles, updatedRoles);
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
  document.getElementById("role-alignment").value = role.alignment;
  document.getElementById("role-weight").value = role.weight;
  document.getElementById("role-description").value = role.description;
  document.getElementById("role-repeatable").checked = role.repeatable;
  roleForm.querySelectorAll("#role-types input").forEach((checkbox) => {
    checkbox.checked = role.types.includes(checkbox.value);
  });
  roleForm.querySelectorAll("#role-modes input").forEach((checkbox) => {
    checkbox.checked = role.modes.includes(checkbox.value);
  });
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
    const normalized = normalizeRoles(parsed);
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
};

init();
