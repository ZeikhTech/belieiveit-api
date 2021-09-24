const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const urlMetadata = require("url-metadata");

const ClickReport = require("../../../models/ClickReport");
const requestValidator = require("../../../middlewares/requestValidator");

const {
  googleSearchApiSchema,
  trackClickSchema,
} = require("../../../validators/google/search");
const authorize = require("../../../middlewares/authorize");

const router = express.Router();

const ZEN_SERP_API = process.env.ZEN_SERP_API;
router.post(
  "/articles",
  requestValidator(googleSearchApiSchema),
  async (req, res) => {
    const { searchQuery } = _.pick(req.body, ["searchQuery"]);
    const result = await axios.get("https://app.zenserp.com/api/v2/search", {
      headers: {
        apiKey: ZEN_SERP_API,
      },
      params: {
        q: searchQuery,
      },
    });

    let filtered = [];

    //filtering
    for (let i = 0; i < result.data.organic.length; ++i) {
      const blog = result.data.organic[i];
      if (blog.title && blog.url) {
        const { title, thumbnail, url, description } = blog;
        filtered.push({ title, thumbnail, url, description });
      }
    }

    filtered = filtered.slice(0, 3);
    //// filtering done

    let article1, article2, article3;

    try {
      console.log("1st loaded");
      if (filtered[0]) {
        article1 = await loadArticleThumbnail(filtered[0]);
      }
      console.log("2nd loaded");
      if (filtered[1]) {
        article2 = await loadArticleThumbnail(filtered[1]);
      }
      console.log("3rd loaded");
      if (filtered[2]) {
        article3 = await loadArticleThumbnail(filtered[2]);
      }

      const scrapped = [];

      if (article1) {
        scrapped.push(article1);
      }

      if (article2) {
        scrapped.push(article2);
      }

      if (article3) {
        scrapped.push(article3);
      }

      return res.send(scrapped);
    } catch (err) {
      return res.send(filtered);
    }
  }
);

const loadArticleThumbnail = async (article) => {
  if (article.thumbnail) {
    article.image = article.thumbnail;
  } else {
    try {
      const metaData = await urlMetadata(article.url);

      article.image = metaData["og:image"] || metaData["twitter:image"] || "";

      article.description =
        metaData["description"] ||
        metaData["og:description"] ||
        article.description ||
        "";
    } catch (err) {
      console.log("Failed TO load -> ", article.title);
    }
  }
  return article;
};
router.post(
  "/track_article_click",
  authorize(),
  requestValidator(trackClickSchema),
  async (req, res) => {
    const { link } = _.pick(req.body, ["link"]);
    const { user } = req.authSession;

    const clickReport = await new ClickReport({ link, user: user._id });

    res.send(clickReport);
  }
);
module.exports = router;
