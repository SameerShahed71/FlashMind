# FlashMind 🔮

Turn dense lecture PDFs or pasted notes into AI-generated flashcards you can study immediately. The project pairs a lightweight Vite + React frontend with an Express backend that calls Google’s Gemini models to build question/answer pairs.

<img width="1127" height="845" alt="image" src="https://github.com/user-attachments/assets/808ab9dc-8d31-4206-a250-653b3371e04b" />

## Features
- Drag-and-drop PDF upload or plain text paste area with rich Tailwind styling.
- Smart flashcard generation via `POST /generate`, handling both JSON and multipart bodies.
- Responsive 2-column flashcard grid with reveal-on-click answers.
- Backend PDF text extraction powered by `pdfjs-dist` and Gemini 2.5 Flash.

## Tech Stack
- **Frontend:** Vite, React 19, Tailwind CSS 3, Fetch API.
- **Backend:** Node.js + Express, `google-generative-ai`, `express-fileupload`, `pdfjs-dist`.

## Project Structure
```
FlashMind/
├── backend/        # Express API that talks to Gemini and extracts PDF text
├── frontend/       # Vite + React single-page interface
└── LICENSE         # MIT License
```
## Requirements
- Node.js 20+
- npm 10+
- A valid Google Gemini API key (`GEMINI_API_KEY`) with access to `gemini-2.5-flash`.

## Backend Setup (`http://localhost:3000`)
1. `cd backend`
2. `npm install`
3. Create a `.env` file and add your key:
   ```
   GEMINI_API_KEY=your-key-here
   ```
4. Start the server:
   ```
   node server.js
   ```
   The server registers `POST /generate` and logs any raw Gemini output for troubleshooting.

## Frontend Setup (`http://localhost:5173`)
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open the printed Vite URL (defaults to `http://localhost:5173`). Use the UI to upload a PDF or paste text, then click **Generate Flashcards**. The app will call `http://localhost:3000/generate`.

## API Contract
- **Endpoint:** `POST http://localhost:3000/generate`
- **Request body:**
  - JSON: `{ "text": "plain note content" }`
  - Multipart: `pdf` file field (PDF up to ~20 MB)
- **Response:** `[{ "question": "string", "answer": "string" }, ... ]`
- On errors, the backend returns `500 { "error": "Generation failed" }`.

# Pull Requests Welcome!
- Fork the repo, create a feature branch, and submit changes via pull request.
- Ensure your code follows the existing style and passes basic linting.
- Include a brief description of the changes and any related issue numbers.

## License
MIT © 2025 Sameer Shahed
