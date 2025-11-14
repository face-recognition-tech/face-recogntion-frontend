import React, { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import FaceRegister from './FaceRegister';
import FaceRecognize from './FaceRecognize';
import { API_URL } from './config';

function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [mode, setMode] = useState('recognize'); // 'recognize' or 'register'

  useEffect(() => {
    // Load models from public/models
    const MODEL_URL = process.env.PUBLIC_URL + '/models';
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // detector
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ])
      .then(() => setModelsLoaded(true))
      .catch(err => {
        console.error('Failed to load face-api models. Make sure /public/models exists and contains the model files.', err);
      });
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Face Recognition (React + Node + SQLite)</h1>
        <div className="controls">
          <button onClick={() => setMode('recognize')} className={mode === 'recognize' ? 'active' : ''}>Recognize</button>
          <button onClick={() => setMode('register')} className={mode === 'register' ? 'active' : ''}>Register New</button>
          <span className={`status ${modelsLoaded ? 'ok' : 'warn'}`}>{modelsLoaded ? 'Models loaded' : 'Loading models...'}</span>
        </div>
        <div className="info">Backend API: {API_URL}</div>
      </header>

      <main>
        {!modelsLoaded && <div className="banner">Loading face detection models — please wait.</div>}
        {modelsLoaded && mode === 'register' && <FaceRegister />}
        {modelsLoaded && mode === 'recognize' && <FaceRecognize />}
      </main>

      <footer>
        <small>Tip: download models into frontend/public/models from the face-api.js model repo.</small>
      </footer>
    </div>
  );
}

export default App;
