import {Camera} from './camera.js';
import {STATE, setBackendAndEnvFlags} from './params.js';
import {setupStats} from "./stats_panel.js"

let detector, camera, stats;
let startInferenceTime, numInferences = 0;
let inferenceTimeSum = 0, lastPanelUpdate = 0;
let rafId;

const LEFT_EYE_INDEX = 2;
const RIGHT_EYE_INDEX = 5;

let posXEl, posYEl, posZEl, calcZEl;
let posX3dEl, posY3dEl, posZ3dEl, calcZ3dEl;

// const SCREEN_HEIGHT_METERS = 0.2794;
// const SCREEN_WIDTH_METERS = 9999


// const blazepose_distance_ratio_map = {
//   // [z, actual_head_distance_from_screen_in_meters]
//   [-1.00, 0.60],
//   [-2.00, 0.30]
// }

async function createDetector() {

    // let detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
    // detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    let detectorConfig = {
      runtime: 'mediapipe',
      enableSmoothing: true,
      modelType: 'full',
      solutionPath: 'node_modules/@mediapipe/pose',
      // solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
      // detectorModelUrl: '/headtracking/blazepose-detector-model.json',
      // detectorModelUrl: '/headtracking/model.json',
      // landmarkModelUrl: '/headtracking/blazepose-landmark-model.json'
    };
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, detectorConfig);
    return detector;
}

function beginEstimatePosesStats() {
  startInferenceTime = (performance || Date).now();
}

function endEstimatePosesStats() {
  const endInferenceTime = (performance || Date).now();
  inferenceTimeSum += endInferenceTime - startInferenceTime;
  ++numInferences;

  const panelUpdateMilliseconds = 1000;
  if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
    const averageInferenceTime = inferenceTimeSum / numInferences;
    inferenceTimeSum = 0;
    numInferences = 0;
    stats.customFpsPanel.update(
        1000.0 / averageInferenceTime, 120 /* maxValue */);
    lastPanelUpdate = endInferenceTime;
  }
}

function getCoordsFromKeypoint(kp) {
  // For webcam z=-1, the distance of head from camera is ~60cm
  // when z=-2, distance from webcam is ~30cm. (when centered)
  // x and y values given by Keypoint seem to be regular pixel values of where the landmark occurs in the image
  let kp_left = kp[LEFT_EYE_INDEX];
  let kp_right = kp[RIGHT_EYE_INDEX];

  let avgz = (kp_left['z'] + kp_right['z'])/2;
  let avgx = (kp_left['x'] + kp_right['x'])/2;
  let avgy = (kp_left['y'] + kp_right['y'])/2;
  let calcz = 0.6/avgz;



  // console.log("Distance: ", (0.6/avgz)*-1, "x:", avgx, "y:", avgy, "z: ", avgz);
  return [avgx, avgy, avgz, calcz];
}

function rendercoords (kp, kp3d) {
    let [avgx, avgy, avgz, calcz] = getCoordsFromKeypoint(kp);
    posXEl.innerText = avgx.toFixed(4);
    posYEl.innerText = avgy.toFixed(4);
    posZEl.innerText = avgz.toFixed(4);
    calcZEl.innerText = (0.6/avgz).toFixed(4);

    stats.xPanel.update(avgx, 370);
    stats.yPanel.update(avgy, 370);
    stats.zPanel.update(-200/avgz, 370);


    [avgx, avgy, avgz, calcz] = getCoordsFromKeypoint(kp3d);
    posX3dEl.innerText = avgx.toFixed(4);
    posY3dEl.innerText = avgy.toFixed(4);
    posZ3dEl.innerText = avgz.toFixed(4);
    calcZ3dEl.innerText = (0.6/avgz).toFixed(4);

    // stats.xPanel.update((avgx+0.2)*100, 100);
    // stats.yPanel.update(-100*avgy, 100);
    // stats.zPanel.update(-100*avgz, 100);
}

let counter = 0;
async function renderResult() {
  if (camera.video.readyState < 2) {
    await new Promise((resolve) => {
      camera.video.onloadeddata = () => {
        resolve(video);
      };
    });
  }

  let poses = null;

  // Detector can be null if initialization failed (for example when loading
  // from a URL that does not exist).
  if (detector != null) {
    // FPS only counts the time it takes to finish estimatePoses.
    beginEstimatePosesStats();

    // Detectors can throw errors, for example when using custom URLs that
    // contain a model that doesn't provide the expected output.
    try {
      poses = await detector.estimatePoses(
          camera.video,
          {maxPoses: STATE.modelConfig.maxPoses, flipHorizontal: false});
    } catch (error) {
      detector.dispose();
      detector = null;
      alert(error);
    }

    endEstimatePosesStats();
  }

  camera.drawCtx();

  // The null check makes sure the UI is not in the middle of changing to a
  // different model. If during model change, the result is from an old model,
  // which shouldn't be rendered.
  if (poses && poses.length > 0 && !STATE.isModelChanged) {
    let hasKeypoints = poses[0] && poses[0].keypoints && poses[0].keypoints.length > 3;
    let kp = poses[0].keypoints;
    let kp3d = poses[0].keypoints3D;
    if(hasKeypoints) {
      counter += 1;
      if(counter % 1 == 0) {
        rendercoords(kp, kp3d)
      }
    }
    camera.drawResults(poses);
  }
}
const shouldStop = false;
function handleshouldStop() {
  if (shouldStop) {
    shouldStop = false;
    renderPrediction();
  } else {
    shouldStop = true;
  }
}

let prev_timestamp = 0
async function renderPrediction(ts) {
  // console.log("DT IS:", prev_timestamp - ts);
  if (!shouldStop) {
    prev_timestamp = ts;
    await renderResult();
    rafId = requestAnimationFrame(renderPrediction);
  }
};

function initMisc() {
  posXEl = document.querySelector('#posx pre');
  posYEl = document.querySelector('#posy pre');
  posZEl = document.querySelector('#posz pre');
  calcZEl = document.querySelector('#calcz pre');

  posX3dEl = document.querySelector('#posx3d pre');
  posY3dEl = document.querySelector('#posy3d pre');
  posZ3dEl = document.querySelector('#posz3d pre');
  calcZ3dEl = document.querySelector('#calcz3d pre');
}

async function app() {
  // Gui content will change depending on which model is in the query string.
  // const urlParams = new URLSearchParams(window.location.search);
  // if (!urlParams.has('model')) {
  //   alert('Cannot find model in the query string.');
  //   return;
  // }

  // await setupDatGui(urlParams);

  initMisc();
  stats = setupStats();

  camera = await Camera.setupCamera(STATE.camera);
  console.log("hello", camera);

  await setBackendAndEnvFlags(STATE.flags, STATE.backend);

  detector = await createDetector();

  renderPrediction();
};

app();