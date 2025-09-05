import express from "express";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const parser = new Parser();
const feedSources = [
{
  name: "Hacker News",
  url: "https://hnrss.org/frontpage" ,
  type: "blog"
},
{
    name: "ArXiv Machine Learning",
  url: "http://export.arxiv.org/rss/cs.LG" ,
  type: "paper"
}
];
// hello
app.use(cors());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

//feeds endpoint (Hacker News frontpage as a demo)
app.get("/feeds", async (_req, res) => {
  try {
    // Fetch all feeds in parallel for better performance
    const promises = feedSources.map(source => parser.parseURL(source.url));
    const results = await Promise.allSettled(promises);

    const allItems = results
      // Filter out any feeds that failed to fetch
      .filter(result => result.status === 'fulfilled')
      // Process the successful feeds
      .flatMap((result, index) => {
        const feed = result.value;
        const sourceInfo = feedSources[index]; // Get our source metadata

        // Apply the same standardization logic as before to each item
        return (feed.items ?? []).map((it) => ({
          id: String(it.guid || it.link || it.title || Math.random()),
          title: String(it.title ?? "Untitled"),
          source: sourceInfo.name, // Use the name from our source object
          link: String(it.link ?? ""),
          authors: it.creator ? [String(it.creator)] : [],
          summary: String(it.contentSnippet ?? it.content ?? "").slice(0, 500),
          type: sourceInfo.type, // Use the type from our source object
          date: it.isoDate || new Date().toISOString(),
          tags: [],
        }));
      });

    // Sort the combined list of items by date, newest first
    allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(allItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_fetch_feed" });
  }
});

app.listen(PORT, () => {
  console.log(`worker listening on http://localhost:${PORT}`);
});
