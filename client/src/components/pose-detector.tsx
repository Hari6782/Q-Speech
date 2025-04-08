import { useEffect, useRef, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

export function Posedetector({ videoRef }: { videoRef: React.RefObject<any> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize the detector
    const initializeDetector = async () => {
      // Make sure TensorFlow.js is ready
      if (!navigator.mediaDevices || !videoRef.current?.video) {
        console.error('Video element or mediaDevices not available');
        return;
      }

      try {
        // Initialize the detector with MoveNet model
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true
        };
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet, 
          detectorConfig
        );
        
        setDetector(detector);
        console.log('Pose detector initialized');
      } catch (error) {
        console.error('Error initializing pose detector:', error);
      }
    };

    initializeDetector();

    // Cleanup function
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [videoRef]);

  useEffect(() => {
    if (!detector || !videoRef.current?.video || !canvasRef.current) return;
    
    const video = videoRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Function to detect poses and draw them
    const detectPose = async () => {
      // Check if video is playing
      if (video.readyState < 2 || video.paused || video.ended) {
        requestRef.current = requestAnimationFrame(detectPose);
        return;
      }
      
      try {
        // Update canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Detect poses
        const poses = await detector.estimatePoses(video);
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (poses.length > 0) {
          drawPose(poses[0], ctx);
        }
      } catch (error) {
        console.error('Error detecting pose:', error);
      }
      
      // Continue detection loop
      requestRef.current = requestAnimationFrame(detectPose);
    };
    
    // Start the detection loop
    detectPose();
  }, [detector, videoRef]);
  
  // Function to draw the detected pose
  const drawPose = (pose: poseDetection.Pose, ctx: CanvasRenderingContext2D) => {
    if (!pose.keypoints) return;
    
    // Define connections between keypoints to draw a skeleton
    const connections = [
      ['nose', 'left_eye'],
      ['nose', 'right_eye'],
      ['left_eye', 'left_ear'],
      ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle']
    ];
    
    // Create a map for quick lookups
    const keypointMap: Record<string, poseDetection.Keypoint> = {};
    pose.keypoints.forEach(keypoint => {
      keypointMap[keypoint.name || ''] = keypoint;
    });
    
    // Draw the connections (skeleton)
    ctx.strokeStyle = 'rgba(80, 128, 255, 0.7)';
    ctx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
      const startPoint = keypointMap[start];
      const endPoint = keypointMap[end];
      
      if (startPoint && endPoint && startPoint.score && endPoint.score && 
          startPoint.score > 0.5 && endPoint.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });
    
    // Draw the keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw a bigger circle for the main body parts
        if (['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'].includes(keypoint.name || '')) {
          ctx.strokeStyle = 'rgba(255, 197, 66, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });
  };

  return <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />;
}