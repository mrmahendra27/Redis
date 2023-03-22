const express = require("express");
const cors = require("cors");
const redis = require("redis");
const axios = require("axios");

const redisClient = redis.createClient();
const DEFAULT_EXPIRATION_TIME = 30;
redisClient.connect();
redisClient.on("error", (err) => console.log("Redis Client Error", err));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/posts", async (req, res) => {
  redisClient
    .get("posts")
    .then(async (post) => {
      if (post != null) {
        console.log("redis worked");
        return res.json(JSON.parse(post));
      } else {
        await axios
          .get("https://jsonplaceholder.typicode.com/posts")
          .then((posts) => {
            console.log("normal api worked");
            redisClient.setEx(
              "posts",
              DEFAULT_EXPIRATION_TIME,
              JSON.stringify(posts.data)
            );
            return res.json(posts.data);
          })
          .catch((err) => {
            return res.json(err);
          });
      }
    })
    .catch((err) => res.json(err));
});

app.get("/post/:id", async (req, res) => {
  const postId = req.params.id;
  redisClient.get("post:" + postId).then(async (post) => {
    if (post != null) {
      console.log("redis worked");
      return res.json(JSON.parse(post));
    } else {
      await axios
        .get(`https://jsonplaceholder.typicode.com/posts/${postId}`)
        .then((post) => {
          console.log("normal worked");
          redisClient.setEx(
            "post:" + postId,
            DEFAULT_EXPIRATION_TIME,
            JSON.stringify(post.data)
          );
          res.json(post.data);
        })
        .catch((err) => {
          res.json(err);
        });
    }
  });
});

app.listen(3000, () => console.log("Connected to server 3000."));
