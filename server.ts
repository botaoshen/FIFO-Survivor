import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { kv } from "@vercel/kv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = process.env.VERCEL ? "/tmp/uploads" : path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), "public")));

// Serve static files from public/uploads
app.use("/uploads", express.static(uploadDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// API Routes
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Leaderboard APIs
app.use(express.json());

app.post("/api/leaderboard", async (req, res) => {
  try {
    const { name, score, characterId } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: "Invalid name or score" });
    }

    const memberData = JSON.stringify({ name, score, characterId, date: new Date().toISOString() });
    
    await kv.zadd('leaderboard', { score, member: memberData });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Leaderboard submit error:", error);
    res.status(500).json({ error: "Failed to submit score" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const topScores = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: false });
    
    const parsedScores = topScores.map((member: string) => {
      try {
        return JSON.parse(member);
      } catch (e) {
        return { name: "Unknown", score: 0 };
      }
    });

    res.json(parsedScores);
  } catch (error: any) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).send("URL is required");

  console.log(`Proxying: ${targetUrl}`);

  try {
    const axios = (await import("axios")).default;
    const response = await axios.get(targetUrl, { 
      responseType: "arraybuffer",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const contentType = response.headers["content-type"];
    console.log(`Proxy success: ${contentType}`);
    res.setHeader("Content-Type", contentType);
    res.send(response.data);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    res.status(500).send("Failed to fetch resource");
  }
});

// If NOT running in Vercel, start the server locally
if (!process.env.VERCEL) {
  async function startLocalServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startLocalServer();
}

// Export the Express API for Vercel Serverless Functions
export default app;
