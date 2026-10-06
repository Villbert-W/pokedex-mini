import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import PokemonCard from "../components/PokemonCard.jsx";
import { getAllPokemon } from "../api.js";

function SearchPage() {
  const { query } = useParams();
  const term = query.trim().toLowerCase();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    getAllPokemon()
      .then((list) => isCurrent && setAll(list))
      .catch((err) => isCurrent && setError(err.message));
    return () => {
      isCurrent = false;
    };
  }, []);

  if (error) {
    return <p className="status status-error">Couldn't search: {error}</p>;
  }
  if (!all) {
    return <div className="spinner" role="status" aria-label="Loading" />;
  }

  const starts = all.filter((p) => p.name.startsWith(term));
  const contains = all.filter((p) => !p.name.startsWith(term) && p.name.includes(term));

  // typed one exact name and nothing else starts with it -> go straight to it
  if (starts.length === 1 && starts[0].name === term) {
    return <Navigate to={`/pokemon/${term}`} replace />;
  }

  const total = starts.length + contains.length;

  return (
    <>
      <SearchForm key={term} initialQuery={term} />

      {total === 0 ? (
        <div className="glass status-card">
          <p className="status">No Pokémon found for “{term}”. Try fewer letters.</p>
        </div>
      ) : (
        <p className="results-heading">
          {total} result{total === 1 ? "" : "s"} for “{term}”
        </p>
      )}

      {starts.length > 0 && (
        <>
          <h3 className="section-label">Starts with “{term}”</h3>
          <ul className="pokemon-list">
            {starts.slice(0, 60).map((p, i) => (
              <PokemonCard key={p.name} pokemon={p} index={i} />
            ))}
          </ul>
        </>
      )}

      {contains.length > 0 && (
        <>
          <h3 className="section-label">Also contains “{term}”</h3>
          <ul className="pokemon-list">
            {contains.slice(0, 24).map((p, i) => (
              <PokemonCard key={p.name} pokemon={p} index={i} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default SearchPage;
