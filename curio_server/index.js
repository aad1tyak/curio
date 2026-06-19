const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());
app.use(cors());
const db = new Database("curio.db");
const port = 3000;

db.exec(`
  CREATE TABLE IF NOT EXISTS history(
    id  INTEGER PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    summary TEXT,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);
const addHistory = db.prepare(`
    INSERT INTO history (title, summary)
    VALUES (?, ?)
    ON CONFLICT(title) DO UPDATE SET
      viewed_at = CURRENT_TIMESTAMP;
  `);
const getHistory = db.prepare(`
  SELECT * FROM history
  ORDER BY viewed_at DESC
  `);
const deleteHistory = db.prepare(`
  DELETE FROM history
  WHERE id = ?
  `);

const separateStringContent = (rawText) => {
  if (!rawText) return [];

  const tokens = rawText.split(/(={2,4}\s*[^=]+\s*={2,4})/g);

  const resultList = [];

  let currentTitle = "Introduction";
  let currentParagraphs = "";
  const blackSheepSections = [
    "Related pages",
    "References",
    "Other websites",
    "Works cited",
    "Citations",
    "See also",
    "External Links",
    "Further Reading",
  ];

  tokens.forEach((token) => {
    if (/^={2,4}\s*[^=]+\s*={2,4}$/.test(token)) {
      if (currentParagraphs.trim()) {
        if (!blackSheepSections.includes(currentTitle)) {
          resultList.push({
            title: currentTitle,
            content: currentParagraphs.trim(),
          });
        }
      }

      currentTitle = token.replace(/=/g, "").trim();
      currentParagraphs = "";
    } else {
      currentParagraphs += token;
    }
  });

  if (currentParagraphs.trim() && !blackSheepSections.includes(currentTitle)) {
    resultList.push({
      title: currentTitle,
      content: currentParagraphs.trim(),
    });
  }

  return resultList;
};

const fetchArticle = async (topic, subdomain) => {
  try {
    if (await checkWiki(topic, subdomain)) {
      const endpoint = `https://${subdomain}.wikipedia.org/w/api.php`;
      const response = await axios.get(endpoint, {
        params: {
          action: "query",
          format: "json",
          prop: "extracts|info",
          titles: topic,
          explaintext: 1,
          exlimit: "max",
          origin: "*",
        },
        headers: {
          "User-Agent":
            "CurioWorkstationApp/1.0 (Contact: aad1tyak; personal development project)",
        },
      });

      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pageId === "-1") {
        return [
          {
            title: "Sorry!",
            section: [
              {
                title: "No Article Found for this topic!",
                content: "...",
              },
            ],
          },
        ];
      }
      const txt = pages[pageId].extract;
      const subtitle = pages[pageId].title;
      const contentList = separateStringContent(txt);
      const length = pages[pageId].length;

      return {
        title: subtitle,
        length: length,
        sections: contentList,
      };
    } else {
      console.log("Article not found!");
      return [
        {
          title: "Sorry!",
          length: 0,
          section: [
            {
              title: "No Article Found for this topic!",
              content: "...",
            },
          ],
        },
      ];
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

app.post("/send/topic", async (req, res) => {
  const { topic, subdomain } = req.body;
  console.log("Recevied: ", topic);

  try {
    const contentList = await fetchArticle(topic, subdomain);

    res.json({
      status: "Success",
      content: contentList,
      err: "",
    });
  } catch (err) {
    res.json({
      status: "Failed",
      content: "",
      err: err,
    });
  }
});

const fetchAutoComplete = async (q) => {
  const resultList = [];
  try {
    const endpoint = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${q}&limit=5`;
    const response = await axios.get(endpoint, {
      headers: {
        "User-Agent":
          "CurioWorkstationApp/1.0 (Contact: aad1tyak; personal development project)",
      },
    });
    if (response.data.pages.length > 0) {
      response.data.pages.map((page, i) => {
        resultList.push({ title: page.title, description: page.description });
      });
    }
  } catch (err) {
    console.log(err);
  }
  return resultList;
};

app.post("/send/recomdList", async (req, res) => {
  const { query } = req.body;
  console.log("Recevied: ", query);

  try {
    const contentList = await fetchAutoComplete(query);
    res.json({
      status: "Success",
      content: contentList,
      err: "",
    });
  } catch (err) {
    res.json({
      status: "Failed",
      content: "",
      err: err,
    });
  }
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkWiki = async (topic, subdomain, retries = 3, delayMs = 1000) => {
  console.log(`Checking ${subdomain} Wikipedia availability for: ${topic}`);
  try {
    const endpoint = `https://${subdomain}.wikipedia.org/w/rest.php/v1/page/${encodeURIComponent(topic)}/bare`;

    const response = await axios.get(endpoint, {
      headers: {
        "User-Agent":
          "CurioWorkstationApp/1.0 (Contact: aad1tyak; personal development project)",
      },
    });
    return true;
  } catch (err) {
    if (err.response.data?.errorKey === "rest-nonexistent-title") {
      return false;
    } else if (err.response.status === 429 && retries > 0) {
      await delay(delayMs);
      return checkWiki(topic, subdomain, retries - 1, delay * 2);
    }
    return false;
  }
};

app.post("/check/isSimpleAvailable", async (req, res) => {
  const { topic } = req.body;

  if (await checkWiki(topic, "simple")) {
    return res.json({ available: true });
  } else {
    return res.json({ available: false });
  }
});

app.get("/db/:title", (req, res) => {
  addHistory.run(req.params.title);
});

app.listen(port, () => {
  console.log(`Server running!`);
});
