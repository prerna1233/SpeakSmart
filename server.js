// // server.js
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const path = require('path');

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// // Accept both JSON and form data for /feedback
// // ✅ MOVE THIS UP ABOVE app.get('*')
// app.post('/feedback', async (req, res) => {
//   const text = req.body.text || req.body.transcript;
//   const prompt = `You are a helpful English speaking coach. The student said:\n"${text}"
// \nGive feedback ONLY on their spoken English, such as:\n- Fluency, clarity, and pronunciation\n- Use of vocabulary and grammar (but do NOT mention punctuation, full stops, or capitalization)\n- Filler words, hesitations, or unclear phrases\n- Suggestions to improve spoken English (not writing)\n- Recommend 1-2 resources for spoken English improvement\nReturn your feedback in simple HTML. Do NOT mention punctuation or capitalization at all.`;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const feedback = response.text().trim();
//     console.log("Gemini Feedback:", feedback);
//     res.json({ feedback });
//   } catch (err) {
//     console.error("Error with Gemini API:", err);
//     res.status(500).json({ feedback: "❌ Failed to get feedback." });
//   }
// });

// // ⚠️ Keep this as the LAST route (for handling unknown GET requests)



// // Serve static files from the public directory
// app.use(express.static(path.join(__dirname, 'public')));

// // Fallback to index.html for SPA routing (must be last)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
















const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();

// ✅ CORS fix to allow local frontend
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// ✅ Handle preflight (OPTIONS) requests
app.options('*', cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/feedback', async (req, res) => {
  const text = req.body.text || req.body.transcript;

  const prompt = `You are a helpful English speaking coach. The student said:\n"${text}"
\nGive feedback ONLY on their spoken English...`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text().trim();
    console.log("Gemini Feedback:", feedback);
    res.json({ feedback });
  } catch (err) {
    console.error("Error with Gemini API:", err);
    res.status(500).json({ feedback: "❌ Failed to get feedback." });
  }
});

// Fallback to index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
