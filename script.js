const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const sound = document.getElementById('sound');
const overlayText = document.getElementById('overlay-text');

let lastYs = [];
let gestureCooldown = false;

function isFist(landmarks) {
  const tipIds = [8, 12, 16, 20];
  return tipIds.every(id => landmarks[id].y > landmarks[id - 2].y);
}

function detectFistBump(landmarks) {
  const y = landmarks[0].y;
  lastYs.push(y);
  if (lastYs.length > 10) lastYs.shift();

  const movements = lastYs.map((val, i, arr) => i > 0 ? val - arr[i - 1] : 0);
  const upDowns = movements.filter(d => Math.abs(d) > 0.01);

  return upDowns.length >= 6;
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#0F0', lineWidth: 3 });
    drawLandmarks(canvasCtx, landmarks, { color: '#F00', lineWidth: 2 });

    if (isFist(landmarks) && detectFistBump(landmarks)) {
      if (!gestureCooldown) {
        overlayText.textContent = 'Wa Na Nag Lulu Na!';
        sound.currentTime = 0;
        sound.play();

        gestureCooldown = true;
        setTimeout(() => {
          overlayText.textContent = '';
          gestureCooldown = false;
        }, 1500);
      }
    }
  }

  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();

videoElement.addEventListener('loadedmetadata', () => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
});
