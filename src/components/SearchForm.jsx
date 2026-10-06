import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchForm({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const name = query.trim().toLowerCase().replace(/\s+/g, "-");

    if (name === "") {
      setError("Type a Pokémon name first.");
      return;
    }

    setError(null);
    navigate(`/search/${encodeURIComponent(name)}`);
  }

  return (
    <div className="search">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a Pokémon… (try “ivy”)"
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>
      {error && <p className="status status-error">{error}</p>}
    </div>
  );
}

export default SearchForm;
