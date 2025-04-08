import { useEffect, useRef, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
// We need to explicitly import and register the WebGL backend
import '@tensorflow/tfjs-backend-webgl';

export interface PoseMetrics {
  frames: number;
  validPoses: number;
  poseConfidence: number;
  posture: number;
  stability: number;
  movement: number;
  gestures: number;
  keypoints: poseDetection.Keypoint[];
}

export function Posedetector({ 
  videoRef, 
  onPoseDetected 
}: { 
  videoRef: React.RefObject<any>,
  onPoseDetected?: (pose: poseDetection.Pose, metrics: PoseMetrics) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);

  // Helper function to find keypoint by name
  const keypointByName = (pose: poseDetection.Pose, name: string): poseDetection.Keypoint | null => {
    if (!pose.keypoints) return null;
    return pose.keypoints.find(kp => kp.name === name) || null;
  };
  
  // Helper function to calculate variance of an array
  const calculateVariance = (array: number[]): number => {
    if (array.length < 2) return 0;
    
    const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
    const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / array.length;
  };

  // Calculate pose metrics for analysis
  const calculatePoseMetrics = (currentPose: poseDetection.Pose): PoseMetrics => {
    const m = metricsRef.current;
    
    // Calculate pose confidence (average of available keypoint scores)
    let avgConfidence = 0;
    let validKeypoints = 0;
    
    if (currentPose.keypoints && currentPose.keypoints.length > 0) {
      currentPose.keypoints.forEach(kp => {
        if (kp.score && kp.score > 0.2) {
          avgConfidence += kp.score;
          validKeypoints++;
        }
      });
      
      if (validKeypoints > 0) {
        avgConfidence = (avgConfidence / validKeypoints) * 100; // Scale to 0-100
      }
    }
    
    // Calculate stability (lower movement variance = higher stability)
    let stabilityScore = 50; // Default midpoint
    let postureDifferences = [];
    const importantPoints = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];
    
    if (m.poseHistory.length > 10) {
      // Calculate stability from position variance of important landmarks
      let totalVariance = 0;
      let pointCount = 0;
      
      importantPoints.forEach(name => {
        const history = m.keypointHistory[name];
        if (history && history.x.length > 10) {
          // Calculate variance in positions
          const xVariance = calculateVariance(history.x);
          const yVariance = calculateVariance(history.y);
          
          // Normalize by canvas size to get relative movement
          const canvas = canvasRef.current;
          if (canvas) {
            const normalizedVariance = 
              (xVariance / (canvas.width * canvas.width) + 
               yVariance / (canvas.height * canvas.height)) / 2;
            
            totalVariance += normalizedVariance;
            pointCount++;
          }
        }
      });
      
      if (pointCount > 0) {
        const avgVariance = totalVariance / pointCount;
        // Convert to stability score (inverse relationship)
        // Lower variance = higher stability
        stabilityScore = Math.min(100, Math.max(0, 100 - (avgVariance * 50000)));
      }
    }
    
    // Calculate posture score
    let postureScore = 50; // Default midpoint
    
    if (currentPose.keypoints && currentPose.keypoints.length > 15) {
      // Check shoulder alignment
      const leftShoulder = keypointByName(currentPose, 'left_shoulder');
      const rightShoulder = keypointByName(currentPose, 'right_shoulder');
      
      // Check hip alignment
      const leftHip = keypointByName(currentPose, 'left_hip');
      const rightHip = keypointByName(currentPose, 'right_hip');
      
      // Check spine alignment
      const nose = keypointByName(currentPose, 'nose');
      
      if (leftShoulder && rightShoulder && leftHip && rightHip && nose) {
        // Shoulders should be level
        const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y) / 
                            Math.abs(leftShoulder.x - rightShoulder.x);
        
        // Hips should be level
        const hipTilt = Math.abs(leftHip.y - rightHip.y) / 
                       Math.abs(leftHip.x - rightHip.x);
        
        // Calculate midpoints
        const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
        const hipMidX = (leftHip.x + rightHip.x) / 2;
        
        // Spine should be straight (nose should align with shoulder and hip midpoints)
        const spineTilt = Math.abs(nose.x - shoulderMidX) / Math.abs(shoulderMidX - hipMidX);
        
        // Combine factors for posture score
        const shoulderFactor = Math.max(0, 1 - shoulderTilt);
        const hipFactor = Math.max(0, 1 - hipTilt);
        const spineFactor = Math.max(0, 1 - spineTilt);
        
        postureScore = Math.round((shoulderFactor * 0.3 + hipFactor * 0.3 + spineFactor * 0.4) * 100);
      }
    }
    
    // Calculate movement score (based on appropriate amount of movement)
    let movementScore = 50; // Default midpoint
    
    if (m.frameCount > 30) {
      // Calculate movement as percentage of frames with significant position changes
      const movementRatio = Math.min(1, m.gestureCount / Math.max(1, m.frameCount / 30));
      movementScore = Math.round(movementRatio * 100);
    }
    
    // Calculate gesture score
    let gestureScore = 50; // Default midpoint
    
    if (m.frameCount > 0) {
      // A good rate is about 1 gesture every 3 seconds (90 frames)
      const optimalGestureRate = m.frameCount / 90;
      const actualGestures = m.gestureCount;
      
      // Score based on how close to optimal gesture rate
      const ratioToOptimal = Math.min(actualGestures / Math.max(1, optimalGestureRate), 2);
      
      if (ratioToOptimal <= 1) {
        // Below optimal: scale from 0-100
        gestureScore = Math.round(ratioToOptimal * 100);
      } else {
        // Above optimal (too many gestures): penalize
        gestureScore = Math.round((2 - ratioToOptimal) * 100);
      }
    }
    
    return {
      frames: m.frameCount,
      validPoses: m.validPoseCount,
      poseConfidence: Math.round(avgConfidence),
      posture: Math.round(postureScore),
      stability: Math.round(stabilityScore),
      movement: Math.round(movementScore),
      gestures: Math.round(gestureScore),
      keypoints: currentPose.keypoints || []
    };
  };

  // Metrics tracking state
  const metricsRef = useRef<{
    frameCount: number;
    validPoseCount: number;
    poseHistory: poseDetection.Pose[];
    keypointHistory: Record<string, { x: number[], y: number[], score: number[] }>;
    lastPositions: Record<string, { x: number, y: number, score: number }>;
    gestureCount: number;
    lastMetricsTime: number;
  }>({
    frameCount: 0,
    validPoseCount: 0,
    poseHistory: [],
    keypointHistory: {},
    lastPositions: {},
    gestureCount: 0,
    lastMetricsTime: 0
  });

  useEffect(() => {
    // Initialize the detector
    const initializeDetector = async () => {
      // Make sure TensorFlow.js is ready
      if (!navigator.mediaDevices || !videoRef.current?.video) {
        console.error('Video element or mediaDevices not available');
        return;
      }

      try {
        // Explicitly set up the WebGL backend
        await tf.setBackend('webgl');
        console.log('TensorFlow.js backend initialized:', tf.getBackend());
        
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
        console.log('Pose detector initialized successfully');
      } catch (error) {
        console.error('Error initializing pose detector:', error);
      }
    };

    // Make sure we've loaded TensorFlow before initializing
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
        
        // Update metrics
        metricsRef.current.frameCount++;
        
        // Detect poses
        const poses = await detector.estimatePoses(video);
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (poses.length > 0) {
          const pose = poses[0];
          
          // Track valid poses
          if (pose.score && pose.score > 0.2) {
            metricsRef.current.validPoseCount++;
            metricsRef.current.poseHistory.push(pose);
            
            // Cap history at 90 frames (about 3 seconds at 30fps)
            if (metricsRef.current.poseHistory.length > 90) {
              metricsRef.current.poseHistory.shift();
            }
            
            // Track keypoints for stability analysis
            pose.keypoints.forEach(keypoint => {
              if (!keypoint.name) return;
              
              if (!metricsRef.current.keypointHistory[keypoint.name]) {
                metricsRef.current.keypointHistory[keypoint.name] = {
                  x: [],
                  y: [],
                  score: []
                };
              }
              
              const history = metricsRef.current.keypointHistory[keypoint.name];
              history.x.push(keypoint.x);
              history.y.push(keypoint.y);
              history.score.push(keypoint.score || 0);
              
              // Cap history at 30 frames
              if (history.x.length > 30) {
                history.x.shift();
                history.y.shift();
                history.score.shift();
              }
              
              // Detect gestures (simple version: significant hand movement)
              if (
                (keypoint.name === 'left_wrist' || keypoint.name === 'right_wrist') && 
                keypoint.score && keypoint.score > 0.5
              ) {
                const lastPos = metricsRef.current.lastPositions[keypoint.name];
                if (lastPos) {
                  const dx = keypoint.x - lastPos.x;
                  const dy = keypoint.y - lastPos.y;
                  const distance = Math.sqrt(dx*dx + dy*dy);
                  
                  // If moving more than 5% of the width, count as gesture
                  if (distance > canvas.width * 0.05) {
                    metricsRef.current.gestureCount++;
                  }
                }
                
                // Update last position
                metricsRef.current.lastPositions[keypoint.name] = {
                  x: keypoint.x,
                  y: keypoint.y,
                  score: keypoint.score
                };
              }
            });
          }
          
          drawPose(pose, ctx);
          
          // Calculate and send metrics every second
          const now = Date.now();
          if (now - metricsRef.current.lastMetricsTime > 1000 && onPoseDetected) {
            const metrics = calculatePoseMetrics(pose);
            onPoseDetected(pose, metrics);
            metricsRef.current.lastMetricsTime = now;
          }
        }
      } catch (error) {
        console.error('Error detecting pose:', error);
      }
      
      // Continue detection loop
      requestRef.current = requestAnimationFrame(detectPose);
    };
    
    // Start the detection loop
    detectPose();
  }, [detector, videoRef, onPoseDetected]);
  
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