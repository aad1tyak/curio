import { useState, useEffect } from "react";
import "./App.css";

function App() {
  //Search Query function
  const [searchItem, setSearchItem] = useState("");
  const onSearch = (query) => {
    console.log(query);
    setSearchItem(query);
    setIsReading(true);
  };

  //Reading state function
  const [isReading, setIsReading] = useState(() => {
    const savedState = localStorage.getItem("onReadingPage");
    return savedState === "true";
  });
  useEffect(() => {
    localStorage.setItem("onReadingPage", isReading);
  }, [isReading]);

  //Exit reading
  const exitReading = () => {
    setIsReading(false);
  };

  return (
    <>
      {isReading ? (
        <ReadingPage exit={exitReading} />
      ) : (
        <HomePage onSearch={onSearch} />
      )}
    </>
  );
}

const HomePage = ({ onSearch }) => {
  //Functions dealing with input query
  const [query, setQuery] = useState("");
  const handleChange = (e) => {
    setQuery(e.target.value);
  };
  const submitQuery = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) onSearch(query);
  };

  //Surprize button function
  const handleSurprize = () => {
    console.log("Surprize");
  };

  return (
    <div className="">
      <form onSubmit={submitQuery}>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleChange}
        />
        <button type="submit">Search</button>
      </form>
      <div className="" onClick={handleSurprize}>
        Surprize Me?
      </div>
    </div>
  );
};

const ReadingPage = ({ exit }) => {
  return (
    <>
      <h1>Loading...</h1>
      <button onClick={exit}> Exit </button>
    </>
  );
};

export default App;
