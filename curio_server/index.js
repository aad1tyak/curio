const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

const parseHtmlArticle = (rawText) => {
  const $ = cheerio.load(rawText);
};

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
    const endpoint = `https://${subdomain}.wikipedia.org/w/api.php`;
    const response = await axios.get(endpoint, {
      params: {
        action: "query",
        format: "json",
        prop: "extracts",
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
    //console.log(pages);
    console.log(response.data.query);
    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") {
      return [{ title: "Error", content: "No Article Found for this topic!" }];
    }
    const txt = pages[pageId].extract;
    const subtitle = pages[pageId].title;
    const contentList = separateStringContent(txt);

    return {
      title: subtitle,
      sections: contentList,
    };
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

app.listen(port, () => {
  console.log(`Server running!`);
});
