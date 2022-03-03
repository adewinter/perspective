const LOGITECH_C720P_HORIZONTAL_FOV_DEGREES = 31.3;
const LOGITECH_C720P_VERTICAL_FOV_DEGREES = 29.9;

const rendererWidth = document.body.clientWidth; //pixels
const rendererHeight = document.documentElement.clientHeight; //pixels

const SCREEN_HORIZONTAL_PIXELS_PER_METER = (80 / 1.85) * 100;
const SCREEN_VERTICAL_PIXELS_PER_METER = (48 / 1.11) * 100;

const sceneWindowWidthInitial =
    rendererWidth / SCREEN_HORIZONTAL_PIXELS_PER_METER; //meters
const sceneWindowHeightInitial =
    rendererHeight / SCREEN_VERTICAL_PIXELS_PER_METER; //meters

let settings = {
    DEBUG: true,
    rendererWidth: rendererWidth,
    rendererHeight: rendererHeight,
    portalWidth: 4.0,
    portalHeight: 6.0,
    sceneWindowWidthInitial: sceneWindowWidthInitial,
    sceneWindowHeightInitial: sceneWindowHeightInitial,
    sceneWindow: {
        //dimensions of our 'window into the world'
        width: sceneWindowWidthInitial,
        height: sceneWindowHeightInitial,
        x: 0,
        y: 0,
        z: 0,
        IS_REFMESH_TRANSPARENT: true,
    },
    portalCamOffset: {
        x: 0,
        y: 0.1,
        z: 0.3,
        scaleX: -0.3,
        scaleY: -0.3,
        scaleZ: -0.3,
        lockX: false,
        lockY: false,
        lockZ: false,
    },
    headtracking: {
        SHOULD_USE_RAW_POSITION: false,
    },
    USE_PORTAL_CAMERA_HELPER: true,
    USE_MAIN_CAMERA_FOR_VIEW: false,
};

export default settings;
