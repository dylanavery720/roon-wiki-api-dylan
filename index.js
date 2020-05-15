const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser());
app.use(cors());

const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/articles/:topic", async (req, res) => {
  const { topic } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM articles WHERE topic = '${topic}'`
    );
    const results = { results: result ? result.rows : null };
    res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.put("/articles/:topic", async (req, res) => {
  const { topic, key, newcontent, oldcontent } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      `UPDATE articles SET ${key} = '${newcontent}' WHERE topic = '${topic}'`
    );
    await client.query(
      "INSERT INTO edits (article, oldcontent, newcontent) VALUES ($1, $2, $3)",
      [topic, JSON.stringify(oldcontent), JSON.stringify(newcontent)],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(201).send(`Success`);
      }
    );
    // const results = { results: result ? result.rows : null };
    // res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.get("/articles", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM articles`);
    const results = { results: result ? result.rows : null };
    res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.get("/edits/:topic", async (req, res) => {
  const { topic } = req.params;
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM edits WHERE article = '${topic}'`
    );
    const results = { results: result ? result.rows : null };
    res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.post("/articles", async (req, res) => {
  try {
    const client = await pool.connect();
    const { topic, content, introduction, infobox, category } = req.body;

    pool.query(
      "INSERT INTO articles (topic, content, introduction, infobox, category) VALUES ($1, $2, $3, $4, $5)",
      [topic, content, introduction, infobox, category],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(201).send(`Success`);
      }
    );
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});
