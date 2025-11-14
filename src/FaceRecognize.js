import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { listFaces, deleteFace } from './api';

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export default function FaceRecognize() {
  const videoRef = useRef();
  const overlayRef = useRef();
  const [running, setRunning] = useState(false);
  const [knownFaces, setKnownFaces] = useState([]);
  const [log, setLog] = useState('');

  useEffect(() => {
    fetchFaces();
  }, []);

  async function fetchFaces() {
    try {
      const faces = await listFaces();
      setKnownFaces(faces);
    } catch (e) {
      console.error(e);
    }
  }

  async function start() {
    setLog('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);
      runRecognition();
    } catch (e) {
      console.error(e);
      setLog('Cannot access camera.');
    }
  }

  function stop() {
    setRunning(false);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    videoRef.current.srcObject = null;
    const ctx = overlayRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
  }

  async function runRecognition() {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');

    const threshold = 0.6; // distance threshold (lower = more strict)

    const known = knownFaces.map(k => ({ id: k.id, name: k.name, descriptor: k.descriptor }));

    async function step() {
      if (!running) return;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
      detections.forEach(det => {
        const { detection, descriptor } = det;
        const box = detection.box;
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // find best match
        let best = { dist: Infinity, name: 'Unknown', id: null };
        for (const k of known) {
          const d = euclideanDistance(k.descriptor, Array.from(descriptor));
          if (d < best.dist) best = { dist: d, name: k.name, id: k.id };
        }

        let label = 'Unknown';
        let conf = 0;
        if (best.dist < threshold) {
          // convert distance to approximate confidence %
          conf = Math.round(Math.max(0, (1 - best.dist / threshold)) * 100);
          label = `${best.name} (${conf}%)`;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(box.x, box.y + box.height - 20, box.width, 20);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.fillText(label, box.x + 4, box.y + box.height - 6);
      });

      requestAnimationFrame(step);
    }

    step();
  }

  async function removeFace(id) {
    if (!window.confirm('Delete this face?')) return;
    try {
      await deleteFace(id);
      await fetchFaces();
      setLog('Deleted');
    } catch (e) {
      console.error(e);
      setLog('Failed to delete');
    }
  }

  return (
    <div className="recognize">
      <div className="left">
        <video ref={videoRef} className="video" playsInline autoPlay muted />
        <canvas ref={overlayRef} className="overlay" />
        <div className="controls">
          {!running && <button onClick={start}>Start Camera</button>}
          {running && <button onClick={stop}>Stop Camera</button>}
          <button onClick={fetchFaces}>Refresh Known Faces</button>
        </div>
        <div className="log">{log}</div>
      </div>

      <div className="right">
        <h3>Known Faces ({knownFaces.length})</h3>
        {knownFaces.length === 0 && <div>No faces registered on server yet.</div>}
        <div className="registered-list">
          {knownFaces.map(k => (
            <div className="person" key={k.id}>
              <img alt={k.name} src={k.image_base64 || ''} />
              <div>
                <div className="pname">{k.name}</div>
                <div className="pmeta">id: {k.id}</div>
                <button onClick={() => removeFace(k.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
