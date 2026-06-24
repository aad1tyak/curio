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
    length INTEGER,
    viewed_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
    `);
const addHistory = db.prepare(`
    INSERT INTO history (title, length)
    VALUES (?, ?)
    ON CONFLICT(title) DO UPDATE SET
      viewed_at = datetime('now', 'localtime');
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
      const endpoint = `https://${subdomain}.wikipedia.org/w/rest.php/v1/page/${topic}/html`;
      const response = await axios.get(endpoint, {
        headers: {
          "User-Agent":
            "CurioWorkstationApp/1.0 (Contact: aad1tyak; personal development project)",
        },
      });
      console.log(response);
      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];

      if (pageId === "-1") {
        return {
          title: "Not Found",
          length: 0,
          sections: [
            {
              title: "No Article Found for this topic!",
              content: "Please try searching for another term.",
            },
          ],
        };
      }

      const txt = pages[pageId].extract;
      const subtitle = pages[pageId].title;
      const contentList = separateStringContent(txt);
      const length = pages[pageId].length;

      return {
        title: subtitle,
        length: Math.floor(length / 1200),
        sections: contentList,
      };
    } else {
      console.log("Article not found!");

      return {
        title: "Not Found",
        length: 0,
        sections: [
          {
            title: "No Article Found for this topic!",
            content: "Please try searching for another term.",
          },
        ],
      };
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
    const contentList = [];
    //const contentList = await fetchArticle(topic, subdomain);

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

app.post("/db/add", async (req, res) => {
  const { title, length } = req.body;
  if (title && length) {
    await addHistory.run(title, length);
  }
  res.sendStatus(200);
});

app.get("/db/get", async (req, res) => {
  res.json(getHistory.all());
});

app.post("/db/delete", (req, res) => {
  const { id } = req.body;

  const result = deleteHistory.run(id);

  if (result.changes > 0) {
    res.json({ status: "Success" });
  } else {
    res.json({ status: "Failed" });
  }
});

const fetchHtml = async (topic, subdomain) => {
  const endpoint = `https://${subdomain}.wikipedia.org/w/rest.php/v1/page/${topic}/html`;
  const response = await axios.get(endpoint, {
    headers: {
      "User-Agent":
        "CurioWorkstationApp/1.0 (Contact: aad1tyak; personal development project)",
    },
  });

  return response.data;
};

app.get("/get/html", async (req, res) => {
  const output = await fetchHtml("jupiter", "simple");
  res.json({ output: output });
});

app.listen(port, () => {
  console.log(`Server running!`);
});
