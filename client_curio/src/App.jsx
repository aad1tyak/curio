import { useState } from "react";
import "./App.css";

function App() {
  const [searchItem, setSearchItem] = useState("");
  const onSearch = (query) => {};
  return (
    <>
      <HomePage />
    </>
  );
}

const HomePage = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) onSearch(value);
  };
  const handleClear = () => {
    setQuery("");
    if (onSearch) onSearch(value);
  };
  return (
    <div className="">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={handleChange}
      />
      {query && (
        <button onClick={handleChange} aria-label="Submit search">
          Search
        </button>
      )}
      {query && (
        <button onClick={handleClear} aria-label="Clear search">
          X
        </button>
      )}
      <div className="">Surprize Me?</div>
    </div>
  );
};

export default App;
