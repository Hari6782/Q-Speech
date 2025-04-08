declare module '@tensorflow-models/pose-detection' {
  export enum SupportedModels {
    MoveNet = 'MoveNet',
    BlazePose = 'BlazePose',
    PoseNet = 'PoseNet'
  }

  export namespace movenet {
    export enum modelType {
      SINGLEPOSE_LIGHTNING = 'SinglePose.Lightning',
      SINGLEPOSE_THUNDER = 'SinglePose.Thunder',
      MULTIPOSE_LIGHTNING = 'MultiPose.Lightning'
    }
  }

  export interface ModelConfig {
    modelType?: movenet.modelType;
    enableSmoothing?: boolean;
  }

  export interface Keypoint {
    x: number;
    y: number;
    z?: number;
    score?: number;
    name?: string;
  }

  export interface Pose {
    keypoints: Keypoint[];
    score?: number;
  }

  export interface PoseDetector {
    estimatePoses(
      image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
      config?: {
        flipHorizontal?: boolean;
        maxPoses?: number;
      }
    ): Promise<Pose[]>;
    dispose(): void;
  }

  export function createDetector(
    model: SupportedModels,
    config?: ModelConfig
  ): Promise<PoseDetector>;
}