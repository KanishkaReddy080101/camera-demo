import { useState, useRef } from 'react';
import AWS from 'aws-sdk';

// Initialize AWS SDK
AWS.config.update({
  accessKeyId: 'AKIA5FTZEE4RJZYNYVPX',
  secretAccessKey: '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',
  region: 'Europe (Frankfurt) eu-central-1',
});

const s3 = new AWS.S3();

const Home = () => {
  const videoElement = useRef(null);
  const [stream, setStream] = useState(null);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(userStream);
      if (videoElement.current) {
        videoElement.current.srcObject = userStream;
        mediaRecorder.current = new MediaRecorder(userStream);
        mediaRecorder.current.ondataavailable = handleDataAvailable;
        mediaRecorder.current.onstop = uploadToS3; // Call uploadToS3 directly
        mediaRecorder.current.start();
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      if (videoElement.current) {
        videoElement.current.srcObject = null;
      }
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
      }
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.current.push(event.data);
    }
  };

  const uploadToS3 = async () => {
    if (recordedChunks.current.length > 0) {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const fileName = 'recorded-video.webm';

      const params = {
        Bucket: 'reson-videos',
        Key: fileName,
        Body: blob,
        ContentType: 'video/webm',
      };

      try {
        await s3.upload(params).promise();
        console.log('Video uploaded to S3 successfully!');
      } catch (error) {
        console.error('Error uploading video to S3:', error);
      }
    }
  };

  return (
    <div style={{ fontFamily: 'Arial', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Camera and Microphone Demo</h1>
      <div style={{ marginBottom: '20px' }}>
        <video ref={videoElement} style={{ width: '640px', height: '480px' }} autoPlay></video>
      </div>
      <div>
        <button style={{ fontSize: '16px', margin: '5px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} onClick={startCamera}>Start Recording</button>
        <button style={{ fontSize: '16px', margin: '5px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} onClick={stopCamera}>Stop Recording</button>
      </div>
    </div>
  );
};

export default Home;
