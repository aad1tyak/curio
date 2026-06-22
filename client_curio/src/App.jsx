import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import "./App.css";
import relativeTime from "dayjs/plugin/relativeTime";

// Activate the plugin once at the top of your file
dayjs.extend(relativeTime);

function App() {
  //Search Query function
  const [searchItem, setSearchItem] = useState(() => {
    const savedQuery = localStorage.getItem("readingQuery");
    return savedQuery || "";
  });

  const onSearch = (query) => {
    setSearchItem(query);
    setIsReading(true);
    localStorage.setItem("readingQuery", query);
  };

  //Reading state function
  const [isReading, setIsReading] = useState(() => {
    const savedState = localStorage.getItem("onReadingPage");
    return savedState === "true";
  });
  useEffect(() => {
    localStorage.setItem("onReadingPage", isReading);
  }, [isReading]);

  const [history, setHistory] = useState(false);
  const openHistory = () => {
    setHistory(true);
  };

  //Exit reading
  const exitReading = () => {
    localStorage.setItem("readingQuery", "");
    setSearchItem("");
    setIsReading(false);
  };

  return (
    <>
      {isReading ? (
        <ReadingPage topic={searchItem} exit={exitReading} />
      ) : (
        <HomePage onSearch={onSearch} openHistory={openHistory} />
      )}
    </>
  );
}

const HomePage = ({ onSearch, openHistory }) => {
  //Functions dealing with input query
  const [query, setQuery] = useState("");
  const [recomdList, setRecomdList] = useState([]);

  const backend_endpoint = "http://localhost:3000";

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
  const handleHistory = () => {
    console.log("History");
  };

  useEffect(() => {
    const fetchAutoComplete = async () => {
      try {
        const response = await axios.post(
          `${backend_endpoint}/send/recomdList`,
          { query: query },
        );

        if (response.data.status === "Success") {
          setRecomdList(response.data.content);
        }
      } catch (err) {
        console.log(err);
      }
    };

    const timer = setTimeout(() => {
      if (query != "") fetchAutoComplete();
      else setRecomdList([]);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="bg-[#f6f4f0] flex flex-col items-center justify-center min-h-screen bg-neutral-primary px-4">
      <a
        className="absolute top-0 right-0 m-2 py-1 px-2 text-xl font-light underline font-monospace cursor-pointer"
        onClick={handleHistory}
      >
        History
      </a>
      <div className="mb-8 h-full flex items-center justify-center select-none">
        <img src="../assests/curio_logo.svg" className="h-full w-100" />
      </div>
      <form onSubmit={submitQuery} className="w-full max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 inset-s-0 flex items-center ps-3 pointer-events-none">
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
            className="block w-full p-3 ps-9 bg-white border  text-black text-sm rounded-none focus:outline-none focus:border-[#f0f0f0] focus:ring-1 focus:ring-gray-500 placeholder:text-gray-400 font-mono"
            placeholder="Search..."
            value={query}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="absolute inset-e-2 top-1/2 -translate-y-1/2 text-black bg-[#f0f0f0] hover:bg-gray-300 active:bg-gray-300 font-mono text-xs px-4 py-1.5 rounded-none font-semibold tracking-wide uppercase transition-colors"
          >
            Search
          </button>
          {recomdList.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 border border-neutral-300 bg-white shadow-[3px_3px_0px_#000] max-h-48 overflow-y-auto">
              {recomdList.map(
                (
                  item,
                  i, // 🟢 Fixed: Replaced { } with ( ) for implicit return
                ) => (
                  <div
                    key={i}
                    onClick={() => onSearch(item.title)} // Make items clickable to trigger search!
                    className="p-3 border-b border-neutral-100 last:border-0 hover:bg-[#f0f0f0] cursor-pointer text-xs font-mono text-neutral-700 transition-colors"
                  >
                    <span className="font-bold text-black">
                      &gt; {item.title}
                    </span>
                    {item.description && ` - ${item.description}`}
                  </div>
                ),
              )}
            </div>
          )}
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

const ReadingPage = ({ exit, topic }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [simpleButton, setSimpleButton] = useState(false);
  const [isSimple, setIsSimple] = useState(false);
  const [articleText, setArticleText] = useState([]);
  const [articleLength, setArticleLength] = useState(0);
  const [articleTitle, setArticleTitle] = useState("");

  const backend_endpoint = "http://localhost:3000";

  useEffect(() => {
    const fetchArticle = async (topic) => {
      try {
        setIsLoading(true);

        let simpleAvailable = false;
        const canBeSimple = await axios.post(
          `${backend_endpoint}/check/isSimpleAvailable`,
          {
            topic: topic,
          },
        );
        if (canBeSimple.data.available) {
          console.log(canBeSimple.data);
          simpleAvailable = true;
          setSimpleButton(true);
        }

        const response = await axios.post(`${backend_endpoint}/send/topic`, {
          topic: topic,
          subdomain: simpleAvailable ? (isSimple ? "simple" : "en") : "en",
        });
        if (response.data.status === "Success") {
          setArticleTitle(response.data.content.title);
          setArticleLength(response.data.content.length);
          setArticleText(response.data.content.sections);
          await axios.get(
            `${backend_endpoint}/db/${response.data.content.title}`,
          );
        } else if (
          response.data.err.message === "Request failed with status code 429"
        ) {
          setArticleTitle("Sorry!");
          setArticleText([
            {
              title: "Too many request",
              content:
                "Server is a little busy, Can you please wait for few seconds and search for your query again? Or reload the page in few mins",
            },
          ]);
        } else {
          setArticleTitle("");
          setArticleText([{ title: "No Article Found", content: "..." }]);
          console.log("Error in fetching the article: ", response.data.err);
        }
      } catch (err) {
        console.log(err);
        setArticleTitle("Concention Fail");
        setArticleText([
          { title: "Error", content: "There was a issue with server" },
        ]);
      } finally {
        setIsLoading(false);
        console.log(articleText, articleTitle);
      }
    };

    if (topic) fetchArticle(topic);
  }, [topic, isSimple]);

  return (
    <>
      <div className="flex justify-center p-8 font-serif bg-[#f6f4f0] text-neutral-800 min-h-screen">
        <div className=" w-full max-w-3xl">
          <button
            onClick={exit}
            className="mb-6 border border-neutral-400 hover:bg-neutral-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-75"
          >
            [ ESCAPE ]
          </button>
          {isLoading ? (
            <p className="animate-pulse">Loading the terminal stream...</p>
          ) : (
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold uppercase tracking-tight mb-[1.6rem] border-b border-neutral-400 pb-2">
                {articleTitle}
              </h1>
              <p className="text-xl font-medium tracking-tight p-2">
                Reading Time:{" "}
                {articleLength != 0
                  ? Math.floor(articleLength / 1200)
                  : articleLength}{" "}
                mins
              </p>
              {simpleButton && (
                <button
                  onClick={() => {
                    setIsSimple(!isSimple);
                  }}
                  className="mb-6 border border-neutral-400 px-3 py-1.5 font-bold tracking-wide uppercase hover:bg-neutral-200"
                >
                  {isSimple ? "[ SHOW DETAILED ]" : "[ SHOW SIMPLE ]"}{" "}
                </button>
              )}
              {articleText?.map((content, index) => (
                <div key={index} className="mb-6">
                  <h3 className="font-bold text-lg mb-2">{content.title}</h3>
                  <pre className="whitespace-pre-wrap leading-[1.9] font-mono text-sm text-neutral-700">
                    {content.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
