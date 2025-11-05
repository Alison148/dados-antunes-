// ===================== FACE ID LOGIN ==========================
const MODEL_URL = 'assets/models';
let modelsLoaded = false;

async function carregarModelosFaceAPI() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log("✅ Modelos carregados com sucesso!");
  } catch (err) {
    console.error("Erro ao carregar modelos:", err);
  }
}

async function iniciarFaceID() {
  const video = document.getElementById('video-faceid');
  const alertBox = document.getElementById('alert');
  const btnFaceID = document.getElementById('faceid-btn');

  // Função para exibir alertas estilizados
  function showAlert(msg, success = false) {
    alertBox.innerText = msg;
    alertBox.style.display = 'block';
    alertBox.style.borderColor = success ? '#00ff99' : '#ff0066';
    alertBox.style.color = success ? '#00ff99' : '#ff0066';
    alertBox.style.boxShadow = success ?
      '0 0 20px rgba(0,255,153,0.6)' : '0 0 20px rgba(255,0,102,0.6)';
    setTimeout(() => (alertBox.style.display = 'none'), 3000);
  }

  // Clique no botão FaceID
  btnFaceID.addEventListener('click', async () => {
    if (!modelsLoaded) {
      showAlert('⏳ Carregando modelos...');
      await carregarModelosFaceAPI();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      showAlert('📷 Câmera ativada! Posicione seu rosto.', true);
    } catch (err) {
      showAlert('❌ Erro ao acessar câmera: ' + err.message);
      return;
    }

    // Aguarda 3 segundos e captura o rosto
    setTimeout(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        showAlert('⚠️ Nenhum rosto detectado. Tente novamente.');
        return;
      }

      showAlert('✅ Rosto detectado! Acesso liberado.', true);
      setTimeout(() => {
        const overlay = document.getElementById('faceLogin');
        overlay.style.display = 'none';
      }, 1000);
    }, 3000);
  });
}

// Inicializa o sistema FaceID ao carregar
document.addEventListener('DOMContentLoaded', iniciarFaceID);
