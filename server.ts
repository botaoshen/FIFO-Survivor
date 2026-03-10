import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { createClient } from '@supabase/supabase-js';

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

// Dynamic Icon Generation
app.get("/icon.png", (req, res) => {
  const style = req.query.style || '1';
  
  // We'll generate a simple SVG icon based on the style parameter
  // and return it as an image
  let svgContent = '';
  
  if (style === '1') {
    // Style 1: Mining theme (Orange/Dark)
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <rect width="512" height="512" rx="112" fill="#1a1a1a"/>
        <rect x="32" y="32" width="448" height="448" rx="80" fill="#2d2d2d"/>
        <path d="M256 120 L380 256 L256 392 L132 256 Z" fill="#f97316"/>
        <path d="M256 160 L330 256 L256 352 L182 256 Z" fill="#fdba74"/>
        <text x="256" y="440" font-family="Arial, sans-serif" font-weight="bold" font-size="64" fill="#f97316" text-anchor="middle">FIFO</text>
      </svg>
    `;
  } else if (style === '2') {
    // Style 2: Australian theme (Green/Gold)
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <rect width="512" height="512" rx="112" fill="#00843D"/>
        <circle cx="256" cy="256" r="180" fill="#FFCD00"/>
        <path d="M256 120 L290 200 L380 210 L310 270 L330 360 L256 310 L182 360 L202 270 L132 210 L222 200 Z" fill="#00843D"/>
      </svg>
    `;
  } else if (style === '3') {
    // Style 3: Pixel Art theme (Retro)
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <rect width="512" height="512" rx="112" fill="#4338ca"/>
        <rect x="128" y="128" width="256" height="256" fill="#1e1b4b"/>
        <rect x="160" y="160" width="64" height="64" fill="#a855f7"/>
        <rect x="288" y="160" width="64" height="64" fill="#a855f7"/>
        <rect x="160" y="288" width="192" height="64" fill="#a855f7"/>
        <rect x="128" y="256" width="32" height="32" fill="#a855f7"/>
        <rect x="352" y="256" width="32" height="32" fill="#a855f7"/>
      </svg>
    `;
  } else {
    // Default fallback
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <rect width="512" height="512" rx="112" fill="#3b82f6"/>
        <text x="256" y="290" font-family="Arial, sans-serif" font-weight="bold" font-size="200" fill="white" text-anchor="middle">F</text>
      </svg>
    `;
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svgContent);
});

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
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn("Supabase credentials missing. Skipping leaderboard submit.");
      return res.json({ success: true, warning: "Leaderboard not configured" });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { name, score, characterId } = req.body;
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: "Invalid name or score" });
    }

    const { error } = await supabase
      .from('Leaderboard')
      .insert([{ name, score, characterId }]);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Leaderboard submit error:", error.message || JSON.stringify(error));
    res.status(500).json({ error: error.message || "Failed to submit score" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn("Supabase credentials missing. Returning empty leaderboard.");
      return res.json([]);
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('Leaderboard')
      .select('name, score, characterId')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error("Leaderboard fetch error:", error.message || JSON.stringify(error));
    res.status(500).json({ error: error.message || "Failed to fetch leaderboard" });
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
