

// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// dotenv.config();

// const app = express();




// // ✅ CORS fix to allow local frontend
// app.use(cors({
//   origin: 'http://127.0.0.1:5500',
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
//   credentials: true
// }));

// // ✅ Handle preflight (OPTIONS) requests
// app.options('*', cors({
//   origin: 'http://127.0.0.1:5500',
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
//   credentials: true
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// app.post('/feedback', async (req, res) => {
//   const text = req.body.text || req.body.transcript;

//   const prompt = `You are a helpful English speaking coach. The student said:\n"${text}"
// \nGive feedback ONLY on their spoken English...`;

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

// // Fallback to index.html for unknown routes
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

// ✅ CORS configuration - UPDATE THESE URLs WITH YOUR ACTUAL URLS
const allowedOrigins = [
  'http://127.0.0.1:5500',                     // for local development
  'http://localhost:3000',                     // for local development
  'https://starlit-shortbread-b10e48.netlify.app', // your OLD Netlify URL
  'https://your-new-netlify-url.netlify.app',  // 🔴 REPLACE: your NEW Netlify URL
  'https://your-render-url.onrender.com'       // 🔴 REPLACE: your Render backend URL
];

// ✅ Use the allowedOrigins array properly
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/feedback', async (req, res) => {
  try {
    const text = req.body.text || req.body.transcript;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'No text provided', 
        feedback: 'Please provide text to analyze.' 
      });
    }

    const prompt = `You are a helpful English speaking coach. The student said:
"${text}"

Give feedback ONLY on their spoken English, such as:
- Fluency, clarity, and pronunciation
- Use of vocabulary and grammar (but do NOT mention punctuation, full stops, or capitalization)
- Filler words, hesitations, or unclear phrases
- Suggestions to improve spoken English (not writing)
- Recommend 1-2 resources for spoken English improvement

Return your feedback in simple HTML. Do NOT mention punctuation or capitalization at all.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text().trim();
    
    console.log("Gemini Feedback generated successfully");
    res.json({ feedback });
    
  } catch (err) {
    console.error("Error with Gemini API:", err);
    res.status(500).json({ 
      error: 'Internal server error',
      feedback: "❌ Failed to get feedback. Please try again." 
    });
  }
});

// ✅ Catch-all route for undefined endpoints
app.get('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'This is the backend API. Available endpoints: /health, /feedback' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
