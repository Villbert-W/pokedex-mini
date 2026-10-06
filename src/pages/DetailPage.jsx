import { Fragment, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL, TYPE_COLORS } from "../config.js";
import { capitalize, getSpriteUrl } from "../utils.js";
import { fetchJson, computeMatchups, getRarity, flattenChain } from "../api.js";

const MULT_LABEL = { 4: "×4", 2: "×2", 0.5: "×½", 0.25: "×¼" };

function TypeChips({ label, items }) {
  if (!items.length) return null;
  return (
    <div className="matchup-row">
      <span className="matchup-label">{label}</span>
      <div className="chips">
        {items.map(({ type, mult }) => (
          <span key={type} className="chip" style={{ background: TYPE_COLORS[type] }}>
            {type}
            {mult && MULT_LABEL[mult] ? ` ${MULT_LABEL[mult]}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function EvolutionBar({ stages, currentSpecies }) {
  if (stages.length <= 1 && stages[0].length <= 1) {
    return <p className="muted-note">This Pokémon doesn't evolve.</p>;
  }
  return (
    <div className="evo-bar">
      {stages.map((stage, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="evo-arrow">›</span>}
          <div className="evo-stage">
            {stage.map((m) => (
              <Link
                key={m.name}
                to={`/pokemon/${m.id}`}
                replace
                className={`evo-pill ${m.name === currentSpecies ? "active" : ""}`}
              >
                <img src={getSpriteUrl(m.id)} alt="" width={56} height={56} />
                <span>{capitalize(m.name)}</span>
                {m.how && <small>{m.how}</small>}
              </Link>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function DetailPage() {
  const { name } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [extra, setExtra] = useState(null); // species, matchups, evolution stages
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadPokemon() {
      setIsLoading(true);
      setError(null);
      try {
        let data;
        try {
          data = await fetchJson(`${API_BASE_URL}/pokemon/${name}`);
        } catch (err) {
          throw new Error(
            err.status === 404
              ? `No Pokémon named "${name}" — check the spelling.`
              : "Couldn't load this Pokémon. Check your connection."
          );
        }

        let info = null;
        try {
          const [species, ...typeData] = await Promise.all([
            fetchJson(data.species.url),
            ...data.types.map((t) => fetchJson(t.type.url)),
          ]);
          const chain = await fetchJson(species.evolution_chain.url);
          info = {
            species,
            matchups: computeMatchups(typeData),
            stages: flattenChain(chain.chain),
          };
        } catch {
          info = null; // the extras are optional; still show the basics
        }

        if (isCurrent) {
          setPokemon(data);
          setExtra(info);
        }

        // quietly preload the other evolution stages so tapping them is instant
        if (isCurrent && info) {
          info.stages.flat().forEach((m) => {
            fetchJson(`${API_BASE_URL}/pokemon/${m.id}`)
              .then((d) => {
                fetchJson(d.species.url).catch(() => {});
                d.types.forEach((t) => fetchJson(t.type.url).catch(() => {}));
              })
              .catch(() => {});
          });
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadPokemon();
    return () => {
      isCurrent = false;
    };
  }, [name]);

  if (error)
    return (
      <div className="glass status-card">
        <p className="status status-error">{error}</p>
        <Link to="/" className="back-link">← Back to list</Link>
      </div>
    );
  if (!pokemon) return <div className="spinner" role="status" aria-label="Loading" />;

  const mainType = pokemon.types[0].type.name;
  const accent = TYPE_COLORS[mainType] || "#cc0000";

  const species = extra && extra.species;
  const genus = species && species.genera.find((g) => g.language.name === "en");
  const flavors = species ? species.flavor_text_entries.filter((f) => f.language.name === "en") : [];
  const description = flavors.length
    ? flavors[flavors.length - 1].flavor_text.replace(/[\n\f]/g, " ")
    : null;
  const rarity = species ? getRarity(species) : null;

  return (
    <div
      key={pokemon.id}
      className={`detail-page glass ${isLoading ? "is-loading" : ""}`}
      style={{ "--accent": accent }}
    >
      <Link to="/" className="back-link">‹ Back</Link>
      <div className="hero">
        <img
          src={pokemon.sprites.other["official-artwork"].front_default}
          alt={pokemon.name}
          width={220}
          height={220}
        />
      </div>
      <p className="pokemon-id detail-id">#{String(pokemon.id).padStart(3, "0")}</p>
      <h2>{capitalize(pokemon.name)}</h2>
      {genus && <p className="genus">{genus.genus}</p>}

      <div className="type-badges">
        {pokemon.types.map((t) => (
          <span
            key={t.type.name}
            className="type-badge"
            style={{ background: TYPE_COLORS[t.type.name] || "#888" }}
          >
            {t.type.name}
          </span>
        ))}
      </div>

      {rarity && (
        <div className={`rarity rarity-${rarity.key}`}>
          <span className="rarity-stars">
            {"★".repeat(rarity.level)}
            {"☆".repeat(5 - rarity.level)}
          </span>
          <strong>{rarity.label}</strong>
          <small>Catch rate {species.capture_rate}/255</small>
        </div>
      )}

      {description && <p className="description">{description}</p>}

      {extra && (
        <section className="panel">
          <h3 className="panel-title">Evolution</h3>
          <EvolutionBar stages={extra.stages} currentSpecies={pokemon.species.name} />
        </section>
      )}

      <div className="facts">
        <div><strong>{(pokemon.height / 10).toFixed(1)} m</strong><span>Height</span></div>
        <div><strong>{(pokemon.weight / 10).toFixed(1)} kg</strong><span>Weight</span></div>
      </div>

      {extra && (
        <section className="panel">
          <h3 className="panel-title">Battle matchups</h3>
          <TypeChips label="Weak to" items={extra.matchups.weak} />
          <TypeChips label="Resists" items={extra.matchups.resist} />
          <TypeChips label="Immune to" items={extra.matchups.immune} />
          <TypeChips label="Strong against" items={extra.matchups.strong} />
        </section>
      )}

      <section className="panel">
        <h3 className="panel-title">Base stats</h3>
        <ul className="stat-list">
          {pokemon.stats.map((s) => (
            <li key={s.stat.name}>
              <span className="stat-name">{s.stat.name.replace("-", " ")}</span>
              <span className="stat-value">{s.base_stat}</span>
              <span className="stat-bar">
                <span
                  className="stat-bar-fill"
                  style={{ "--w": `${Math.min(100, (s.base_stat / 150) * 100)}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DetailPage;
