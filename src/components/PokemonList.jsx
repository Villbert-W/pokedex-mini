import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config.js";
import PokemonCard from "./PokemonCard.jsx";

function PokemonList() {
  const [pokemons, setPokemons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPokemons() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/pokemon?limit=24`);
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();
        setPokemons(data.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadPokemons();
  }, []);

  if (isLoading) {
    return <div className="spinner" role="status" aria-label="Loading" />;
  }

  if (error) {
    return <p className="status status-error">Couldn't load the list: {error}</p>;
  }

  return (
    <ul className="pokemon-list">
      {pokemons.map((pokemon, index) => (
        <PokemonCard key={pokemon.name} pokemon={pokemon} index={index} />
      ))}
    </ul>
  );
}

export default PokemonList;
