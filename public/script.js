let recognition;
let transcript = '';
let timer;
let timeLeft = 0;
let isPaused = false;
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const stopBtn = document.getElementById('stopBtn');
const timeInput = document.getElementById('timeInput');
const timerDisplay = document.getElementById('timerDisplay');
const transcriptBox = document.getElementById('transcriptBox');
const transcriptDiv = document.getElementById('transcript');
const aiFeedbackBox = document.getElementById('aiFeedbackBox');
const aiFeedback = document.getElementById('aiFeedback');
const getFeedbackBtn = document.getElementById('getFeedbackBtn');
const audioBox = document.getElementById('audioBox');
const audioPlayback = document.getElementById('audioPlayback');
const restartBtn = document.getElementById('restartBtn');


function updateTimerDisplay() {
  timerDisplay.textContent = timeLeft > 0 ? `Time left: ${timeLeft}s` : '';
}

function setButtonStates(state) {
  // state: 'idle', 'recording', 'paused', 'finished'
  startBtn.style.display = state === 'idle' ? '' : 'none';
  pauseBtn.style.display = state === 'recording' ? '' : 'none';
  resumeBtn.style.display = state === 'paused' ? '' : 'none';
  stopBtn.style.display = (state === 'recording' || state === 'paused') ? '' : 'none';
}

function stopRecognition(final = false) {
    restartBtn.style.display = 'block';
 restartBtn.addEventListener('click', () => {
  // Reset everything to default state
  transcript = '';
  transcriptDiv.textContent = '';
  transcriptBox.style.display = 'none';

  aiFeedbackBox.style.display = 'none';
  aiFeedback.textContent = '';
  getFeedbackBtn.style.display = 'none';

  audioBox.style.display = 'none';
  audioPlayback.src = '';
  audioChunks = [];
  audioBlob = null;

  timerDisplay.textContent = '';
  timeInput.value = 30;

  setButtonStates('idle');
  restartBtn.style.display = 'none';
});


  if (recognition) recognition.stop();
  clearInterval(timer);
  timerDisplay.textContent = final ? '\u23f9\ufe0f Stopped.' : '\u23f9\ufe0f Time is up!';
  transcriptBox.style.display = 'block';
  transcriptDiv.textContent = transcript || '(No speech detected)';
  setButtonStates('finished');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (audioChunks.length > 0) {
    audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayback.src = audioUrl;
    audioPlayback.style.display = 'block';
    audioPlayback.controls = true;
    audioBox.style.display = 'block';
  }
  getFeedbackBtn.style.display = 'block';
}

startBtn.addEventListener('click', () => {
  transcript = '';
  timeLeft = parseInt(timeInput.value, 10) || 0;
  updateTimerDisplay();
  setButtonStates('recording');
  transcriptBox.style.display = 'block';
  transcriptDiv.textContent = '';
  aiFeedbackBox.style.display = 'none';
  getFeedbackBtn.style.display = 'none';
  audioBox.style.display = 'none';
  audioPlayback.src = '';
  audioChunks = [];
  audioBlob = null;
  isPaused = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;


    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      transcriptDiv.textContent = transcript + interim;
    };

    recognition.onerror = (event) => {
      alert('Speech recognition error: ' + event.error);
      stopRecognition(true);
    };

    recognition.onend = () => {
      if (!isPaused && timeLeft > 0) {
        recognition.start();
      } else if (!isPaused) {
        stopRecognition(true);
      }
    };

    recognition.start();
  } else {
    alert('Speech recognition is not supported in this browser.');
    setButtonStates('idle');
    return;
  }

  clearInterval(timer);
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      stopRecognition();
    }
  }, 1000);

  // Start audio recording
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      mediaRecorder.start();
    })
    .catch(error => console.error('Error accessing media devices.', error));
});

pauseBtn.addEventListener('click', () => {
  isPaused = true;
  setButtonStates('paused');
  clearInterval(timer);
  if (recognition) recognition.stop();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
});

resumeBtn.addEventListener('click', () => {
  isPaused = false;
  setButtonStates('recording');
  updateTimerDisplay();
  if (recognition) recognition.start();
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      stopRecognition();
    }
  }, 1000);
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      mediaRecorder.start();
    })
    .catch(error => console.error('Error accessing media devices.', error));
});

stopBtn.addEventListener('click', () => {
  isPaused = false;
  stopRecognition();
});

getFeedbackBtn.addEventListener('click', async () => {
  aiFeedbackBox.style.display = 'block';
  aiFeedback.textContent = 'Loading feedback...';
  const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? "http://localhost:3000" : "https://speaksmart-938x.onrender.com";

  try {
    const response = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcript })
    });
    if (response.status === 429) {
      aiFeedback.innerHTML = `<span style='color:#d32f2f;font-weight:600;'>⚠️ Too many requests to the AI service.<br>Please wait a few minutes and try again.<br>If this happens often, you may need to upgrade your API quota.</span>`;
      return;
    }
    if (!response.ok) {
      aiFeedback.innerHTML = `<span style='color:#d32f2f;font-weight:600;'>❌ Error: Unable to get feedback from AI.<br>Please try again later.</span>`;
      return;
    }
    const data = await response.json();
    // Try to parse as structured feedback
   if (data && typeof data === 'object') {
  // Display structured feedback using your formatter
  aiFeedback.innerHTML = renderStructuredFeedback({
    grammar: [{ issue: data.grammarTips }],
    spelling: [],
    punctuation: [],
    tone: [{ issue: data.strengths }],
    general: [
      { issue: data.pronunciationTips },
      { issue: data.improvementSuggestions }
    ]
  });
} else {
  aiFeedback.innerHTML = 'No feedback received.';
}
if (data && typeof data === 'object') {
  // Display structured feedback using your formatter
  aiFeedback.innerHTML = renderStructuredFeedback({
    grammar: [{ issue: data.grammarTips }],
    spelling: [],
    punctuation: [],
    tone: [{ issue: data.strengths }],
    general: [
      { issue: data.pronunciationTips },
      { issue: data.improvementSuggestions }
    ]
  });
} else {
  aiFeedback.innerHTML = 'No feedback received.';
}

  } catch (err) {
    aiFeedback.innerHTML = `<span style='color:#d32f2f;font-weight:600;'>❌ Network or server error.<br>Please check your connection and try again.</span>`;
  }
});

function renderStructuredFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') return 'No feedback.';
  const sections = [
    { key: 'grammar', label: 'Grammatical Errors', color: '#6c5ce7' },
    { key: 'spelling', label: 'Spelling Issues', color: '#00bfa5' },
    { key: 'punctuation', label: 'Punctuation Mistakes', color: '#ff7043' },
    { key: 'tone', label: 'Tone Suggestions', color: '#388e3c' },
    { key: 'general', label: 'General Feedback', color: '#607d8b' }
  ];
  let html = '';
  let stepIndex = 0;
  sections.forEach(section => {
    if (Array.isArray(feedback[section.key]) && feedback[section.key].length > 0) {
      html += `<div class="feedback-section" style="margin-bottom:18px;">
        <h3 style='color:${section.color};margin-bottom:6px;'>${section.label}</h3>`;
      html += '<ol>';
      feedback[section.key].forEach((item, idx) => {
        html += `<li style='margin-bottom:7px;'><span style='font-weight:600;'>Issue:</span> ${item.issue || ''}`;
        if (item.suggestion) {
          html += `<br><span style='color:#388e3c;font-weight:500;'>Better way of saying it:</span> <em>${item.suggestion}</em>`;
        }
        html += '</li>';
      });
      html += '</ol></div>';
      stepIndex++;
    }
  });
  if (!html) html = '<p>No major issues found. Great job!</p>';
  return html;
}
