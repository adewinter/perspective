import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';

console.log("in params.js", poseDetection);

export const DEFAULT_LINE_WIDTH = 2;
export const DEFAULT_RADIUS = 4;

export const VIDEO_SIZE = {
  '640 X 480': {width: 640, height: 480},
  '640 X 360': {width: 640, height: 360},
  '360 X 270': {width: 360, height: 270}
};


export const BLAZEPOSE_CONFIG = {
  maxPoses: 1,
  type: 'full',
  scoreThreshold: 0.65,
  render3D: true,
  enableSmoothing: true,
};

export const MOVENET_CONFIG = {
  maxPoses: 1,
  type: 'lightning',
  scoreThreshold: 0.3,
  customModel: '',
  enableTracking: false,
  // render3D: true
};


export const STATE = {
  camera: {targetFPS: 60, sizeOption: '360 X 270'},
  backend: 'mediapipe-gpu',
  flags: {},
  // modelConfig: MOVENET_CONFIG,
  // model: poseDetection.SupportedModels.MoveNet,
  modelConfig: BLAZEPOSE_CONFIG,
  model: poseDetection.SupportedModels.BlazePose,
};

/**
 * This map descripes tunable flags and theior corresponding types.
 *
 * The flags (keys) in the map satisfy the following two conditions:
 * - Is tunable. For example, `IS_BROWSER` and `IS_CHROME` is not tunable,
 * because they are fixed when running the scripts.
 * - Does not depend on other flags when registering in `ENV.registerFlag()`.
 * This rule aims to make the list streamlined, and, since there are
 * dependencies between flags, only modifying an independent flag without
 * modifying its dependents may cause inconsistency.
 * (`WEBGL_RENDER_FLOAT32_CAPABLE` is an exception, because only exposing
 * `WEBGL_FORCE_F16_TEXTURES` may confuse users.)
 */
export const TUNABLE_FLAG_VALUE_RANGE_MAP = {
  WEBGL_VERSION: [1, 2],
  WASM_HAS_SIMD_SUPPORT: [true, false],
  WASM_HAS_MULTITHREAD_SUPPORT: [true, false],
  WEBGL_CPU_FORWARD: [true, false],
  WEBGL_PACK: [true, false],
  WEBGL_FORCE_F16_TEXTURES: [true, false],
  WEBGL_RENDER_FLOAT32_CAPABLE: [true, false],
  WEBGL_FLUSH_THRESHOLD: [-1, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  CHECK_COMPUTATION_FOR_ERRORS: [true, false],
};

export const BACKEND_FLAGS_MAP = {
  ['tfjs-wasm']: ['WASM_HAS_SIMD_SUPPORT', 'WASM_HAS_MULTITHREAD_SUPPORT'],
  ['tfjs-webgl']: [
    'WEBGL_VERSION', 'WEBGL_CPU_FORWARD', 'WEBGL_PACK',
    'WEBGL_FORCE_F16_TEXTURES', 'WEBGL_RENDER_FLOAT32_CAPABLE',
    'WEBGL_FLUSH_THRESHOLD'
  ],
  ['mediapipe-gpu']: []
};

export const MODEL_BACKEND_MAP = {
  [poseDetection.SupportedModels.PoseNet]: ['tfjs-webgl'],
  [poseDetection.SupportedModels.MoveNet]: ['tfjs-webgl', 'tfjs-wasm'],
  [poseDetection.SupportedModels.BlazePose]: ['mediapipe-gpu', 'tfjs-webgl']
}

const TUNABLE_FLAG_NAME_MAP = {
  PROD: 'production mode',
  WEBGL_VERSION: 'webgl version',
  WASM_HAS_SIMD_SUPPORT: 'wasm SIMD',
  WASM_HAS_MULTITHREAD_SUPPORT: 'wasm multithread',
  WEBGL_CPU_FORWARD: 'cpu forward',
  WEBGL_PACK: 'webgl pack',
  WEBGL_FORCE_F16_TEXTURES: 'enforce float16',
  WEBGL_RENDER_FLOAT32_CAPABLE: 'enable float32',
  WEBGL_FLUSH_THRESHOLD: 'GL flush wait time(ms)'
};

export const params = {
  VIDEO_SIZE: VIDEO_SIZE,
  STATE: STATE,
  DEFAULT_RADIUS: DEFAULT_RADIUS,
  DEFAULT_LINE_WIDTH, DEFAULT_LINE_WIDTH
}

export async function setBackendAndEnvFlags(flagConfig, backend) {
  if (flagConfig == null) {
    return;
  } else if (typeof flagConfig !== 'object') {
    throw new Error(
        `An object is expected, while a(n) ${typeof flagConfig} is found.`);
  }

  // Check the validation of flags and values.
  for (const flag in flagConfig) {
    // TODO: check whether flag can be set as flagConfig[flag].
    if (!(flag in TUNABLE_FLAG_VALUE_RANGE_MAP)) {
      throw new Error(`${flag} is not a tunable or valid environment flag.`);
    }
    if (TUNABLE_FLAG_VALUE_RANGE_MAP[flag].indexOf(flagConfig[flag]) === -1) {
      throw new Error(
          `${flag} value is expected to be in the range [${
              TUNABLE_FLAG_VALUE_RANGE_MAP[flag]}], while ${flagConfig[flag]}` +
          ' is found.');
    }
  }

  tf.env().setFlags(flagConfig);

  const [runtime, $backend] = backend.split('-');

  if (runtime === 'tfjs') {
    await resetBackend($backend);
  }
}

/**
 * Reset the target backend.
 *
 * @param backendName The name of the backend to be reset.
 */
async function resetBackend(backendName) {
  const ENGINE = tf.engine();
  if (!(backendName in ENGINE.registryFactory)) {
    throw new Error(`${backendName} backend is not registed.`);
  }

  if (backendName in ENGINE.registry) {
    const backendFactory = tf.findBackendFactory(backendName);
    tf.removeBackend(backendName);
    tf.registerBackend(backendName, backendFactory);
  }

  await tf.setBackend(backendName);
}
