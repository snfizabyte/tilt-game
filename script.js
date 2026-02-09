// --- 1. EDIT YOUR QUESTIONS HERE ---
const questions = [
    {
        prompt: "Which animal lives in the ocean?",
        optionA: "Lion",
        optionB: "Whale",
        correctAnswer: "RIGHT",
        explanation: "Whales are mammals that live in the water!"
    },
    {
        prompt: "Is 5 + 5 = 10?",
        optionA: "Yes",
        optionB: "No",
        correctAnswer: "LEFT",
        explanation: "Correct! Five plus five makes ten."
    },
    {
        prompt: "Which word is a NOUN?",
        optionA: "Run",
        optionB: "Apple",
        correctAnswer: "RIGHT",
        explanation: "An apple is a thing, so it's a noun!"
    }
];

// --- 2. GAME LOGIC ---
let currentQuestionIndex = 0;
let isAnswered = false;
let faceLandmarker;
let video;
const tiltThreshold = 15; // Degrees to trigger answer

async function setupGame() {
    video = document.getElementById('webcam');
    const vision = await ff_vision.FaceLandmarker.createFromOptions(
        await ff_vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"),
        {
            runningMode: "VIDEO",
            numFaces: 1
        }
    );
    faceLandmarker = vision;
    
    // Start Camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
    
    showQuestion();
}

function showQuestion() {
    isAnswered = false;
    document.getElementById('feedback-overlay').classList.add('hidden');
    const q = questions[currentQuestionIndex];
    document.getElementById('prompt').innerText = q.prompt;
    document.getElementById('label-left').innerText = q.optionA;
    document.getElementById('label-right').innerText = q.optionB;
}

async function predictWebcam() {
    if (!faceLandmarker) return;

    const results = faceLandmarker.detectForVideo(video, performance.now());
    
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        
        // Calculate tilt using eye positions (Landmarks 33 and 263 are outer corners)
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        
        // Calculate angle in degrees
        const dy = rightEye.y - leftEye.y;
        const dx = rightEye.x - leftEye.x;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        handleTilt(angle);
    }
    
    window.requestAnimationFrame(predictWebcam);
}

function handleTilt(angle) {
    if (isAnswered) return;

    const leftCard = document.getElementById('option-left');
    const rightCard = document.getElementById('option-right');

    // Logic: If angle is positive/negative beyond threshold
    // Note: We use -angle because the webcam is mirrored
    if (angle > (tiltThreshold / 100)) { 
        rightCard.classList.add('active-right');
        checkAnswer("RIGHT");
    } else if (angle < -(tiltThreshold / 100)) {
        leftCard.classList.add('active-left');
        checkAnswer("LEFT");
    } else {
        leftCard.classList.remove('active-left');
        rightCard.classList.remove('active-right');
    }
}

function checkAnswer(side) {
    isAnswered = true;
    const q = questions[currentQuestionIndex];
    const feedbackText = document.getElementById('feedback-text');
    const explanationText = document.getElementById('explanation-text');
    
    if (side === q.correctAnswer) {
        feedbackText.innerText = "🌟 Correct! 🌟";
        feedbackText.style.color = "green";
    } else {
        feedbackText.innerText = "❌ Try Again Next Time! ❌";
        feedbackText.style.color = "red";
    }
    
    explanationText.innerText = q.explanation;
    document.getElementById('feedback-overlay').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
    showQuestion();
}

// Initialize
setupGame();