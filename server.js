
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://127.0.0.1:5500',                     // for local frontend
  'https://starlit-shortbread-b10e48.netlify.app', // your Netlify URL
  'https://speaksmart-938x.onrender.com'              // your Render URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));


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
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/feedback', async (req, res) => {
  const text = req.body.text || req.body.transcript;

//   const prompt = `You are a helpful English speaking coach. The student said:\n"${text}"
// \nGive feedback ONLY on their spoken English...`;

const prompt = `
You're an English language coach. Your job is to evaluate a student's spoken English response and return clear, encouraging, and useful feedback in **JSON format**.

The student said:
"${text}"

Your JSON response MUST have the following keys:
{
  "strengths": "What the student did well (clarity, tone, vocabulary, etc.)",
  "grammarTips": "Correct any grammar or sentence structure issues, with examples",
  "pronunciationTips": "Highlight mispronounced or unclear words (if any)",
  "improvementSuggestions": "Give practical suggestions to help the student improve"
}

Make sure each section is at least 2-3 sentences long. Be polite, specific, and helpful. DO NOT return text outside the JSON. Format it cleanly.
`;



  // try {
  //   const result = await model.generateContent(prompt);
  //   const response = await result.response;
  //   const feedback = response.text().trim();
  //   console.log("Gemini Feedback:", feedback);
  //   res.json({ feedback });
  // } catch (err) {
  //   console.error("Error with Gemini API:", err);
  //   res.status(500).json({ feedback: "❌ Failed to get feedback." });
  // }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let raw = response.text().trim();

    raw = raw.replace(/```json\n?/, '').replace(/```$/, '').trim();

    const feedback = JSON.parse(raw); // ✅ This is your final structured object
    res.json(feedback);
  } catch (e) {
    console.error("Error with Gemini API or JSON parsing:", e);

    if (e.status === 429) {
      return res.status(429).json({ feedback: "⚠️ Rate limit exceeded. Please try again later." });
    }

    res.status(500).json({ feedback: "❌ Failed to get feedback." });
  }
});

// Fallback to index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
