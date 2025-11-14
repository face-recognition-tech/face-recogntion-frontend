import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { registerFace, listFaces } from './api';

export default function FaceRegister() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [name, setName] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [registered, setRegistered] = useState([]);

  useEffect(() => {
    fetchRegistered();
  }, []);

  async function fetchRegistered() {
    try {
      const data = await listFaces();
      setRegistered(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function startCamera() {
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCapturing(true);
    } catch (e) {
      console.error(e);
      setMessage('Camera access denied or not available.');
    }
  }

  async function stopCamera() {
    setCapturing(false);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  async function captureAndRegister() {
    if (!name) return setMessage('Please enter a name.');
    setMessage('Detecting face...');
    // draw current frame to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
    if (!detection) {
      return setMessage('No face detected. Make sure your face is visible and well-lit.');
    }
    const descriptor = Array.from(detection.descriptor); // Float32Array => Array

    // capture small thumbnail image as base64
    const image_base64 = canvas.toDataURL('image/png');

    setMessage('Uploading face to server...');
    try {
      await registerFace({ name, descriptor, image_base64 });
      setMessage(`Registered ${name} ✅`);
      setName('');
      fetchRegistered();
    } catch (e) {
      console.error(e);
      setMessage('Failed to register face.');
    }
  }

  return (
    <div className="register">
      <div className="left">
        <video ref={videoRef} className="video" playsInline autoPlay muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="controls">
          {!capturing && <button onClick={startCamera}>Start Camera</button>}
          {capturing && <button onClick={stopCamera}>Stop Camera</button>}
        </div>
      </div>

      <div className="right">
        <h2>Register New Person</h2>
        <input placeholder="Person name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={captureAndRegister} disabled={!capturing}>Capture & Register</button>
        <div className="message">{message}</div>

        <hr />
        <h3>Registered Faces</h3>
        <div className="registered-list">
          {registered.length === 0 && <div>No faces registered yet.</div>}
          {registered.map(p => (
            <div key={p.id} className="person">
              <img alt={p.name} src={p.image_base64 || ''} />
              <div>
                <div className="pname">{p.name}</div>
                <div className="pmeta">id: {p.id} • added: {new Date(p.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
