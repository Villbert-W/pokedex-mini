import { API_BASE_URL } from "./config.js";
import { getIdFromUrl, capitalize } from "./utils.js";

// ---- cached fetch: the same URL is only downloaded once ----
const cache = new Map();

export function fetchJson(url) {
  if (!cache.has(url)) {
    const promise = fetch(url).then((res) => {
      if (!res.ok) {
        const err = new Error(`Request failed (${res.status})`);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
    promise.catch(() => cache.delete(url)); // don't cache failures
    cache.set(url, promise);
  }
  return cache.get(url);
}

// Every Pokémon name (forms with ids >= 10000 are skipped), used for searching.
export async function getAllPokemon() {
  const data = await fetchJson(`${API_BASE_URL}/pokemon?limit=1400`);
  return data.results.filter((p) => Number(getIdFromUrl(p.url)) < 10000);
}

// ---- type matchups ----
export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
  "steel", "fairy",
];

export function computeMatchups(typeDataList) {
  const defense = {};
  ALL_TYPES.forEach((t) => (defense[t] = 1));
  const strong = new Set();

  typeDataList.forEach((td) => {
    const r = td.damage_relations;
    r.double_damage_from.forEach((t) => t.name in defense && (defense[t.name] *= 2));
    r.half_damage_from.forEach((t) => t.name in defense && (defense[t.name] *= 0.5));
    r.no_damage_from.forEach((t) => t.name in defense && (defense[t.name] *= 0));
    r.double_damage_to.forEach((t) => strong.add(t.name));
  });

  const entries = Object.entries(defense).map(([type, mult]) => ({ type, mult }));
  return {
    weak: entries.filter((e) => e.mult > 1).sort((a, b) => b.mult - a.mult),
    resist: entries.filter((e) => e.mult > 0 && e.mult < 1).sort((a, b) => a.mult - b.mult),
    immune: entries.filter((e) => e.mult === 0),
    strong: [...strong].sort().map((type) => ({ type })),
  };
}

// ---- rarity (based on the species data) ----
export function getRarity(species) {
  if (species.is_mythical) return { key: "legendary", label: "Mythical", level: 5 };
  if (species.is_legendary) return { key: "legendary", label: "Legendary", level: 5 };
  const c = species.capture_rate;
  if (c >= 200) return { key: "common", label: "Common", level: 1 };
  if (c >= 120) return { key: "uncommon", label: "Uncommon", level: 2 };
  if (c >= 45) return { key: "rare", label: "Rare", level: 3 };
  return { key: "veryrare", label: "Very rare", level: 4 };
}

// ---- evolution chain -> list of stages ----
function describeEvolution(d) {
  if (!d) return null;
  if (d.min_level) return `Lv. ${d.min_level}`;
  if (d.item) return capitalize(d.item.name.replace(/-/g, " "));
  if (d.trigger && d.trigger.name === "trade") return "Trade";
  if (d.min_happiness) return "Friendship";
  if (d.trigger) return capitalize(d.trigger.name.replace(/-/g, " "));
  return null;
}

export function flattenChain(chain) {
  const stages = [];
  let level = [chain];
  while (level.length) {
    stages.push(
      level.map((node) => ({
        name: node.species.name,
        id: getIdFromUrl(node.species.url),
        how: describeEvolution(node.evolution_details && node.evolution_details[0]),
      }))
    );
    level = level.flatMap((n) => n.evolves_to);
  }
  return stages;
}
