const MODEL_URL = 'assets/models';
const video = document.getElementById('video-faceid');
const alertBox = document.getElementById('alert');
let modelsLoaded = false;
let labeledFaceDescriptors;

function showAlert(msg, success = false) {
  alertBox.innerText = msg;
  alertBox.style.display = 'block';
  alertBox.style.borderColor = success ? '#00ff99' : '#ff0066';
  alertBox.style.color = success ? '#00ff99' : '#ff0066';
  alertBox.style.boxShadow = success ?
    '0 0 20px rgba(0,255,153,0.6)' : '0 0 20px rgba(255,0,102,0.6)';
  setTimeout(() => (alertBox.style.display = 'none'), 3000);
}

async function loadModels() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ]);
  modelsLoaded = true;
  console.log('✅ Modelos carregados');
}

async function loadLabeledImages() {
  const labels = ['Alison Antunes Miranda'];
  return Promise.all(
    labels.map(async label => {
      const imgUrl = `assets/faces/alison.jpg`;
      const img = await faceapi.fetchImage(imgUrl);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detections) throw new Error('❌ Rosto não detectado em alison.jpg');
      return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
    })
  );
}

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    video.style.display = 'block';
    await video.play();
  } catch (err) {
    showAlert('Erro ao acessar a câmera: ' + err.message);
  }
}

async function recognizeFace() {
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (!detections.length) return;

  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));
  results.forEach(result => {
    if (result.label !== 'unknown') {
      showAlert(`✅ Rosto reconhecido: ${result.label}`, true);
      stopVideo();
    }
  });
}

function stopVideo() {
  const stream = video.srcObject;
  if (stream) stream.getTracks().forEach(track => track.stop());
  video.style.display = 'none';
}

document.getElementById('faceid-btn').addEventListener('click', async () => {
  if (!modelsLoaded) await loadModels();
  if (!labeledFaceDescriptors) labeledFaceDescriptors = await loadLabeledImages();
  await startVideo();
  setTimeout(async function loop() {
    await recognizeFace();
    if (video.style.display !== 'none') setTimeout(loop, 1000);
  }, 1000);
});
