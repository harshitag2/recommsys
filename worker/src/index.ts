import express from "express";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const parser = new Parser();

// hello
app.use(cors());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

//feeds endpoint (Hacker News frontpage as a demo)
app.get("/feeds", async (_req, res) => {
  try {
    const feed = await parser.parseURL("https://hnrss.org/frontpage");
    const items = (feed.items ?? []).map((it) => ({
      id: String(it.guid || it.link || it.title || Math.random()),
      title: String(it.title ?? "Untitled"),
      source: feed.title ?? "Hacker News",
      link: String(it.link ?? ""),
      authors: it.creator ? [String(it.creator)] : [],
      summary: String(it.contentSnippet ?? it.content ?? "").slice(0, 500),
      type: "blog",
      date: it.isoDate || new Date().toISOString(),
      tags: [],
    }));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_fetch_feed" });
  }
});

app.listen(PORT, () => {
  console.log(`worker listening on http://localhost:${PORT}`);
});
