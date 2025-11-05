// ===================== FACE ID LOGIN ==========================
const MODEL_URL = 'assets/models';
let labeledFaceDescriptors;
let faceMatcher;
let modelsLoaded = false;

function showAlert(msg, success = false) {
  const alertBox = document.getElementById('alert');
  alertBox.innerText = msg;
  alertBox.style.display = 'block';
  alertBox.style.color = success ? '#00ff99' : '#ff0066';
  alertBox.style.borderColor = success ? '#00ff99' : '#ff0066';
  setTimeout(() => (alertBox.style.display = 'none'), 4000);
}

async function carregarModelos() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ]);
  modelsLoaded = true;
}

async function carregarRostoLocal() {
  const img = await faceapi.fetchImage('assets/faces/alison.jpg');
  const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  if (!detections) throw new Error("Rosto base não detectado na imagem alison.jpg");
  labeledFaceDescriptors = [new faceapi.LabeledFaceDescriptors('Alison', [detections.descriptor])];
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
}

async function iniciarFaceID() {
  const video = document.getElementById('video-faceid');
  const btnFaceID = document.getElementById('faceid-btn');

  btnFaceID.addEventListener('click', async () => {
    showAlert('🚀 Iniciando Face ID...');
    if (!modelsLoaded) await carregarModelos();
    if (!faceMatcher) await carregarRostoLocal();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();
      showAlert('📷 Câmera ligada! Posicione o rosto.', true);
    } catch (err) {
      showAlert('❌ Erro ao acessar câmera: ' + err.message);
      return;
    }

    // detectar rosto continuamente
    const interval = setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
        if (bestMatch.label === 'Alison') {
          showAlert('✅ Rosto reconhecido: Alison Antunes', true);
          clearInterval(interval);
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          video.srcObject = null;
        } else {
          showAlert('🚫 Rosto diferente detectado.');
        }
      }
    }, 1000);
  });
}

document.addEventListener('DOMContentLoaded', iniciarFaceID);