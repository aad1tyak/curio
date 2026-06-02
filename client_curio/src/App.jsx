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
    <div className="bg-[#f6f4f0] flex flex-col items-center justify-center min-h-screen bg-neutral-primary px-4">
      <div className="mb-8 h-full flex items-center justify-center select-none">
        <img src="../assests/curio_logo.svg" className="h-full w-100" />
      </div>
      <form onSubmit={submitQuery} className="w-full max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full p-3 ps-9 bg-white border-1 broder-gray-100 text-black text-sm rounded-none focus:outline-none focus:border-[#f0f0f0] focus:ring-1 focus:ring-gray-500 placeholder:text-gray-400 font-mono"
            placeholder="Search..."
            value={query}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="absolute end-2 top-1/2 -translate-y-1/2 text-black bg-[#f0f0f0] hover:bg-gray-300 active:bg-gray-300 font-mono text-xs px-4 py-1.5 rounded-none font-semibold tracking-wide uppercase transition-colors"
          >
            Search
          </button>
        </div>
      </form>
      <div
        className="font-monospace border-3 m-4 px-1 py-2 shadow-[5px_5px_0px_#000] hover:bg-[#f0f0f0] active:shadow-[0px_0px_0px_#000] active:translate-x-[5px] active:translate-y-[5px] duration:250 cursor-pointer"
        onClick={handleSurprize}
      >
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
