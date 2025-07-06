

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

















