import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

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

  app.post("/api/gemini-generate", async (req, res) => {
    try {
      const { imageUrl, geminiApiKey, googleAccessToken } = req.body;
      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is missing. Please set it in your AI Studio secrets panel or configure it in the Admin settings." });
      }
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      // Download and convert image to base64
      let base64Data = "";
      let mimeType = "image/jpeg";

      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          return res.status(400).json({ error: "Invalid data URI format" });
        }
      } else if (imageUrl.startsWith('http')) {
        try {
          const headers: Record<string, string> = {};
          if (imageUrl.includes('drive.google.com') && googleAccessToken) {
            headers['Authorization'] = `Bearer ${googleAccessToken}`;
          }
          const imgRes = await fetch(imageUrl, { headers });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            mimeType = imgRes.headers.get("content-type") || "image/jpeg";
            base64Data = Buffer.from(buffer).toString("base64");
          } else {
            return res.status(400).json({ error: `Failed to fetch image: ${imgRes.status} ${imgRes.statusText}` });
          }
        } catch (e: any) {
          return res.status(500).json({ error: `Error downloading image: ${e.message}` });
        }
      } else {
        return res.status(400).json({ error: "Unsupported image URL format" });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Analyze this image and return an SEO-optimized JSON object suitable for a premium photography portfolio website. The response must contain a captivating, elegant 'title'; a single 'category' that matches exactly one of ['portrait', 'boudoir', 'family', 'event', 'editorial']; a refined, 1-2 sentence search-optimized 'description' capturing the mood, depth, and aesthetics; and an array of 3 to 5 'seoKeywords' representing the photo tags."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A captivating, evocative title that tells a story and is search-friendly."
              },
              category: {
                type: Type.STRING,
                description: "Must be exactly one of: 'portrait', 'boudoir', 'family', 'event', 'editorial'."
              },
              description: {
                type: Type.STRING,
                description: "A short, polished 1-2 sentence description including visual keywords for maximum SEO discoverability."
              },
              seoKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 relevant SEO keywords/tags for the photograph."
              }
            },
            required: ["title", "category", "description", "seoKeywords"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned from Gemini API");
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.warn("Failed to parse Gemini JSON directly, trying to match braces...");
        const matchBraces = text.match(/\{[\s\S]*\}/);
        if (matchBraces) {
          result = JSON.parse(matchBraces[0]);
        } else {
          throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("Gemini generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate metadata using Gemini" });
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
