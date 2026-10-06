import { Link } from "react-router-dom";
import { getIdFromUrl, capitalize, getArtworkUrl } from "../utils.js";

function PokemonCard({ pokemon, index = 0 }) {
  const id = getIdFromUrl(pokemon.url);
  return (
    <li
      className="pokemon-list-item"
      style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
    >
      <Link to={`/pokemon/${pokemon.name}`} className="pokemon-link">
        <img
          className="pokemon-sprite"
          src={getArtworkUrl(id)}
          alt={pokemon.name}
          width={96}
          height={96}
          loading="lazy"
          onError={(e) => {
            e.target.style.visibility = "hidden";
          }}
        />
        <span className="pokemon-id">#{id.padStart(3, "0")}</span>
        <span className="pokemon-name">{capitalize(pokemon.name)}</span>
      </Link>
    </li>
  );
}

export default PokemonCard;
