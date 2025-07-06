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
const BASE_URL = "https://your-actual-render-url.onrender.com";

  try {
//    const response = await fetch('http://localhost:3000/feedback', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ text: transcript })
// });
const response = await fetch(`${BASE_URL}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: transcript })
});



    const data = await response.json();
    aiFeedback.innerHTML = data.feedback || 'No feedback.';
  } catch (err) {
    aiFeedback.textContent = 'Error getting feedback.';
  }
});
