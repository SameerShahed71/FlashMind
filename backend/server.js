// import express from "express";
// import cors from "cors";
// import fileUpload from "express-fileupload";
// import dotenv from "dotenv";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse");

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(fileUpload());

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// app.post("/generate", async (req, res) => {
//   let text = "";

//   if (req.files?.pdf) {
//     const pdfData = await pdfParse(req.files.pdf.data);
//     text = pdfData.text;
//   } else text = req.body.text || "";

//   const prompt = `
//   Generate 8 flashcards from this text.
//   Each should be a JSON object with "question" and "answer".
//   Return only JSON array: [{"question": "...", "answer": "..."}, ...]
//   Text:
//   ${text.slice(0, 2000)}
//   `;
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
//     const result = await model.generateContent(prompt);
//     const output = result.response.text();
//     console.log("Raw AI output:", output);
//     const json = JSON.parse(output.match(/\[.*\]/s)[0]);
//     res.json(json);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Generation failed" });
//   }
// });

  
// app.listen(3000, () => console.log("⚡ Backend running on http://localhost:3000"));
import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createRequire } from "module";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse").default || require("pdf-parse");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate", async (req, res) => {
  let text = "";

  // Extract text from PDF or raw text
  if (req.files?.pdf) {
    text = await extractTextFromPDF(req.files.pdf.data);
  } else {
    text = req.body.text || "";
  }

  // Build prompt for Gemini
  const prompt = `
  Generate 8 concise flashcards from this text.
  Each flashcard should be a JSON object with "question" and "answer".
  Return valid JSON array only:
  [{"question": "...", "answer": "..."}, ...]
  Text:
  ${text.slice(0, 2000)}
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    console.log("Raw AI output:\n", output);

    // Extract JSON safely
    const match = output.match(/\[([\s\S]*)\]/);
    if (!match) throw new Error("No JSON found in output");
    const flashcards = JSON.parse(match[0]);

    res.json(flashcards);
  } catch (err) {
    console.error("❌ Error generating flashcards:", err.message);
    res.status(500).json({ error: "Generation failed" });
  }
});

async function extractTextFromPDF(buffer) {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      text += strings.join(" ") + "\n";
    }
    return text;
  }

app.listen(3000, () => console.log("⚡ Backend running on http://localhost:3000"));
