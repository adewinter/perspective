const rendererWidth = document.body.clientWidth;
const rendererHeight = document.documentElement.clientHeight;
const sceneWindowWidthInitial = 0.34; //meters
const sceneWindowHeightInitial =
    1 * (rendererHeight / rendererWidth) * sceneWindowWidthInitial; //meters

let settings = {
    DEBUG: false,
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
        z: 0.0,
        scaleX: 1,
        scaleY: -1,
        scaleZ: 1,
        lockX: false,
        lockY: false,
        lockZ: false,
    },

    headtracking: {
        SHOULD_USE_RAW_POSITION: false,
    },

    SHOULD_LAUNCH_HEADTRACKING: false,
    USE_PORTAL_CAMERA_HELPER: true,
    USE_MAIN_CAMERA_FOR_VIEW: false,
};

export default settings;
