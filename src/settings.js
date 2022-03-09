import EnvCalibrationRoom, * as roomGenerator from "./room_generate.js";
import EnvLittlestTokyo from "./env_littlest_tokyo.js";

const LOGITECH_C720P_HORIZONTAL_FOV_DEGREES = 31.3;
const LOGITECH_C720P_VERTICAL_FOV_DEGREES = 29.9;

const rendererWidth = document.body.clientWidth; //pixels
const rendererHeight = document.documentElement.clientHeight; //pixels

const SCREEN_HORIZONTAL_PIXELS_PER_METER = (80 / 1.85) * 100;
const SCREEN_VERTICAL_PIXELS_PER_METER = (48 / 1.11) * 100;

function calculateSceneWindowDims(rendererWidth, rendererHeight) {
    let sceneWindowWidthInitial =
        rendererWidth / SCREEN_HORIZONTAL_PIXELS_PER_METER; //meters
    let sceneWindowHeightInitial =
        rendererHeight / SCREEN_VERTICAL_PIXELS_PER_METER; //meters
    return [sceneWindowWidthInitial, sceneWindowHeightInitial];
}

function updateSettingsWithNewRendererDims(rendererWidth, rendererHeight) {
    let [sceneWindowWidthInitial, sceneWindowHeightInitial] =
        calculateSceneWindowDims(rendererWidth, rendererHeight);
    this.rendererWidth = rendererWidth;
    this.rendererHeight = rendererHeight;

    this.sceneWindow.width = sceneWindowWidthInitial;
    this.sceneWindow.height = sceneWindowHeightInitial;

    this.sceneWindowWidthInitial = sceneWindowWidthInitial;
    this.sceneWindowHeightInitial = sceneWindowHeightInitial;
}

let settings = {
    DEBUG: true,
    rendererWidth: rendererWidth,
    rendererHeight: rendererHeight,
    sceneWindow: {
        // dimensions of our 'window into the world'
        // x: 0, //offset
        // y: 2.3, //offset
        // z: 5, //offset
        x: 0, //offset
        y: 0, //offset
        z: 0, //offset
        rotateX: 0, //offset
        rotateY: 0, //offset
        rotateZ: 0, //offset
        IS_REFMESH_TRANSPARENT: true,
    },
    portalCamOffset: {
        x: 0,
        y: 0,
        z: 0.2257,
        scaleX: -1.476,
        scaleY: -1.086,
        scaleZ: 1,
        lockX: false,
        lockY: false,
        lockZ: false,
    },
    headtracking: {
        SHOULD_USE_RAW_POSITION: false,
    },
    USE_PORTAL_CAMERA_HELPER: true,
    USE_MAIN_CAMERA_FOR_VIEW: false,
    updateSettingsWithNewRendererDims: updateSettingsWithNewRendererDims,
    environment: {
        current_environment: "Littlest Tokyo",
        available_environments: {
            "Calibration Room": EnvCalibrationRoom,
            "Littlest Tokyo": EnvLittlestTokyo,
        },
    },
};

settings.updateSettingsWithNewRendererDims(rendererWidth, rendererHeight);

export default settings;
