import React, { useState, useRef, useEffect } from 'react';
import { Camera, UserPlus, Search, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function App() {
  const [mode, setMode] = useState('home');
  const [stream, setStream] = useState(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [databaseCount, setDatabaseCount] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadDatabaseCount();
  }, []);

  const loadDatabaseCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/count`);
      const data = await response.json();
      setDatabaseCount(data.count);
    } catch (err) {
      console.error('Failed to load count:', err);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFace = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const registerFace = async () => {
    if (!newPersonName.trim()) {
      setError('Please enter a name');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const imageData = captureFace();
      if (!imageData) {
        setError('Failed to capture image');
        return;
      }

      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPersonName,
          imageData: {
            data: Array.from(imageData.data),
            width: imageData.width,
            height: imageData.height
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(result.message);
        setNewPersonName('');
        setDatabaseCount(result.count);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to register');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsProcessing(false);
    }
  };

  const recognizeFace = async () => {
    setIsProcessing(true);
    setError('');
    setRecognitionResult(null);

    try {
      const imageData = captureFace();
      if (!imageData) {
        setError('Failed to capture image');
        return;
      }

      const response = await fetch(`${API_URL}/api/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: {
            data: Array.from(imageData.data),
            width: imageData.width,
            height: imageData.height
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setRecognitionResult(result);
      } else {
        setError(result.error || 'Failed to recognize');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (mode === 'register' || mode === 'recognize') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [mode]);

  return (
    
      
        
          
            Face Recognition System
          
          Database: {databaseCount} registered faces
        

        {mode === 'home' && (
          
            <button
              onClick={() => setMode('register')}
              style={{
                background: 'linear-gradient(to right, #3182ce, #2c5282)',
                padding: '32px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '600',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              
              Register Face
              
                Add new person to database
              
            
            
            <button
              onClick={() => setMode('recognize')}
              style={{
                background: 'linear-gradient(to right, #38a169, #2f855a)',
                padding: '32px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '600',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              
              Recognize Face
              
                Identify registered person
              
            
          
        )}

        {mode === 'register' && (
          
            <button
              onClick={() => {
                setMode('home');
                setError('');
                setSuccess('');
              }}
              style={{
                background: '#4a5568',
                padding: '8px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                width: 'fit-content'
              }}
            >
              Back to Home
            

            
              
                
                Register New Face
              
              
              {error && (
                
                  
                  {error}
                
              )}

              {success && (
                
                  
                  {success}
                
              )}

              
                
                  
                

                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter person's name"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'rgba(74, 85, 104, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid #4a5568',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  disabled={isProcessing}
                />

                
                  {isProcessing ? 'Processing...' : 'Capture and Register'}
                
              
            
          
        )}

        {mode === 'recognize' && (
          
            <button
              onClick={() => {
                setMode('home');
                setError('');
                setRecognitionResult(null);
              }}
              style={{
                background: '#4a5568',
                padding: '8px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                width: 'fit-content'
              }}
            >
              Back to Home
            

            
              
                
                Recognize Face
              
              
              {error && (
                
                  
                  {error}
                
              )}

              
                
                  
                

                
                  {isProcessing ? 'Processing...' : 'Recognize Face'}
                

                {recognitionResult && (
                  
                    
                      {recognitionResult.match ? 'Match Found' : 'No Match'}
                    
                    
                      
                        Name: {recognitionResult.name}
                      
                      
                        Confidence: {recognitionResult.confidence}%
                      
                    
                  
                )}
              
            
          
        )}

        
      
    
  );
}

export default App;
