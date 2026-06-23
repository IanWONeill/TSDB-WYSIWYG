import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // CORS-Free Proxy Route for TheSportsDB images to allow html2canvas to render them without cross-origin tainting
  app.get("/api/tsdb-media", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('Missing url parameter');
    }
    
    // Safety check: only proxy images from thesportsdb domain
    if (!url.includes('thesportsdb.com/images/')) {
      return res.status(403).send('Forbidden: Only TheSportsDB images can be proxied');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).send('Failed to fetch image');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }
      
      // Ensure permissive CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('Error proxying image:', error);
      return res.status(500).send('Internal server error');
    }
  });

  // CORS-Free Proxy Route for TheSportsDB API requests
  app.get("/api/tsdb/:key/:endpoint", async (req, res) => {
    const { key, endpoint } = req.params;
    
    // Build query params string from request query
    const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
    const targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/${endpoint}${queryParams ? '?' + queryParams : ''}`;
    
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        // Return 200 with empty data instead of breaking the app with 500/404
        return res.json({ error: `TSDB returned status ${response.status}`, teams: [], players: [], events: [], table: [] });
      }
      
      const text = await response.text();
      if (!text || text.trim() === "") {
        return res.json({ teams: [], players: [], events: [], table: [] });
      }
      
      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch (parseErr) {
        console.warn(`TSDB endpoint ${endpoint} returned non-JSON text:`, text.substring(0, 100));
        return res.json({ teams: [], players: [], events: [], table: [], raw: text.substring(0, 200) });
      }
    } catch (error) {
      console.error(`Error proxying to TSDB ${endpoint}:`, error);
      // Return 200 with empty data arrays to allow the client UI to render gracefully
      return res.json({ error: 'Failed to fetch from sports database', teams: [], players: [], events: [], table: [] });
    }
  });

  // Vite middleware for development vs static build files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
