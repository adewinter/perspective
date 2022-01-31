const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
  runtime: 'mediapipe',
  solutionPath: 'base/node_modules/@mediapipe/pose'
};
detector = await poseDetection.createDetector(model, detectorConfig);

const estimationConfig = {enableSmoothing: true};
const poses = await detector.estimatePoses(null, estimationConfig);