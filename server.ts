import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  // Handle JSON parsing errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      console.error('Bad JSON in request body');
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    if (err.type === 'entity.too.large') {
      console.error('Payload too large');
      return res.status(413).json({ error: 'Payload too large' });
    }
    next(err);
  });

  app.post("/api/groq-generate", async (req, res) => {
    try {
      const { imageUrl, groqApiKey, googleAccessToken } = req.body;
      const apiKey = groqApiKey || process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Groq API Key is missing. Please provide it in the input field or set it in your AI Studio settings." });
      }
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      let finalImageUrl = imageUrl;
      
      // If it's a URL (including Google Drive thumbnails), download it and convert to base64
      if (imageUrl.startsWith('http')) {
        try {
          const headers: Record<string, string> = {};
          if (imageUrl.includes('drive.google.com') && googleAccessToken) {
            headers['Authorization'] = `Bearer ${googleAccessToken}`;
          }
          const imgRes = await fetch(imageUrl, { headers });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
            const base64 = Buffer.from(buffer).toString("base64");
            finalImageUrl = `data:${mimeType};base64,${base64}`;
          } else {
            console.warn(`Failed to fetch image: ${imgRes.status} ${imgRes.statusText}`);
          }
        } catch (e) {
          console.error("Error downloading image:", e);
        }
      }

      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and return a JSON object with a suitable title, category (must be exactly one of: 'portrait', 'boudoir', 'family', 'event', 'editorial'), and a short 1-2 sentence description for a fine-art photography portfolio. Return ONLY the JSON object, nothing else. Format: { \"title\": \"...\", \"category\": \"...\", \"description\": \"...\" }"
              },
              {
                type: "image_url",
                image_url: { url: finalImageUrl }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content returned from Groq");

      let result;
      try {
        result = JSON.parse(content);
      } catch (e) {
        console.warn("Failed to parse JSON directly, trying to extract from markdown...");
        const match = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (match) {
          result = JSON.parse(match[1]);
        } else {
          const matchBraces = content.match(/\{[\s\S]*\}/);
          if (matchBraces) {
            result = JSON.parse(matchBraces[0]);
          } else {
            throw new Error(`Failed to parse Groq response as JSON. Response: ${content}`);
          }
        }
      }
      res.json(result);
    } catch (error: any) {
      console.error("Groq generation error:", error);
      if (error.status === 401 || error.message?.includes("Invalid API Key")) {
        return res.status(401).json({ error: "Invalid Groq API Key. Please verify your GROQ_API_KEY in the app settings (Secrets panel)." });
      }
      res.status(500).json({ error: error.message || "Failed to generate metadata" });
    }
  });

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
