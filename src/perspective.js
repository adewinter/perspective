import * as THREE from "three";
import * as CameraUtils from "three/examples/jsm/utils/CameraUtils.js";

import settings, * as CONSTANTS from "./settings.js";
import PerspectiveGUI from "./gui.js";
import EnvCalibrationRoom, * as roomGenerator from "./room_generate.js";
import WebsocketClient from "./websocket_client.js";
import EnvLittlestTokyo from "./env_littlest_tokyo.js";

let renderer, perspectiveGUI, websocketClient;

let initialized_environments = {};

const pose = {
    position: { x: 0.0, y: -0.0, z: 0.0 },
    rawPosition: { x: 0.0, y: -0.0, z: 0.0 },
};

let refMesh;

function initRenderer() {
    const container = document.getElementById("3dviewcontainer");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(settings.rendererWidth, settings.rendererHeight);
    container.appendChild(renderer.domElement);
    renderer.localClippingEnabled = true;
}

function getCurrentEnvironment() {
    let current_env_name = settings.environment.current_environment;
    let current_env_class =
        settings.environment.available_environments[current_env_name];
    let has_env_been_initialized =
        initialized_environments[current_env_name] !== undefined;

    if (has_env_been_initialized) {
        return initialized_environments[current_env_name];
    } else {
        let new_env = new current_env_class(renderer, settings);
        new_env.generate();
        initialized_environments[current_env_name] = new_env;
        return new_env;
    }
}

function init() {
    initRenderer();
    let current_environment = getCurrentEnvironment();
    refMesh = current_environment.worldWindow;

    websocketClient = new WebsocketClient(settings, pose);
    perspectiveGUI = new PerspectiveGUI(settings, websocketClient);

    if (settings.DEBUG) {
        window.refMesh = refMesh;
        window.settings = settings;
    }

    websocketClient.connect_websocket();
}

function updatePortalCameraPerspective() {
    const refMeshBottomLeft = new THREE.Vector3();
    const refMeshBottomRight = new THREE.Vector3();
    const refMeshTopLeft = new THREE.Vector3();

    // find refMesh corners;
    refMeshBottomLeft.set(
        -settings.sceneWindow.width / 2,
        -settings.sceneWindow.height / 2,
        0
    );
    refMesh.localToWorld(refMeshBottomLeft);

    refMeshBottomRight.set(
        settings.sceneWindow.width / 2,
        -settings.sceneWindow.height / 2,
        0
    );
    refMesh.localToWorld(refMeshBottomRight);

    refMeshTopLeft.set(
        -settings.sceneWindow.width / 2,
        settings.sceneWindow.height / 2,
        0
    );
    refMesh.localToWorld(refMeshTopLeft);

    // render the portal effect
    CameraUtils.frameCorners(
        getCameras().portalCamera,
        refMeshBottomLeft,
        refMeshBottomRight,
        refMeshTopLeft,
        false
    );
}

function getHeadCoordsAndMoveCamera() {
    let camera_position = new THREE.Vector3(0, 0, 0);
    let headPosition = settings.headtracking.SHOULD_USE_RAW_POSITION
        ? pose.position
        : pose.rawPosition;

    // Treat GUI x,y,z values as offset values to be added to value
    // provided by headtracker
    camera_position.x =
        headPosition.x * settings.portalCamOffset.scaleX +
        settings.portalCamOffset.x;
    camera_position.y =
        headPosition.y * settings.portalCamOffset.scaleY +
        settings.portalCamOffset.y;
    camera_position.z =
        headPosition.z * settings.portalCamOffset.scaleZ +
        settings.portalCamOffset.z;

    //Figure out world coordinates of camera_position
    //(which is a vector relative to the origin of refMesh)
    refMesh.localToWorld(camera_position);

    //Set the new position for the portalCamera
    getCameras().portalCamera.position.copy(camera_position);
    getCameras().updateUIWithCameraPositions();
}

function updateRefMeshDimensionsAndMaterial() {
    refMesh.scale.x =
        settings.sceneWindow.width / settings.sceneWindowWidthInitial;
    refMesh.scale.y =
        settings.sceneWindow.height / settings.sceneWindowHeightInitial;
    refMesh.position.x = settings.sceneWindow.x;
    refMesh.position.y = settings.sceneWindow.y;
    refMesh.position.z = settings.sceneWindow.z;

    refMesh.material.transparent = settings.sceneWindow.IS_REFMESH_TRANSPARENT;
    refMesh.material.wireframe = !settings.sceneWindow.IS_REFMESH_TRANSPARENT;
}

function animateEnvironment() {
    getCurrentEnvironment().animateEnvironment();
}

function getCameras() {
    return getCurrentEnvironment().cameras;
}

function animate() {
    requestAnimationFrame(animate);

    getHeadCoordsAndMoveCamera();

    updateRefMeshDimensionsAndMaterial();
    updatePortalCameraPerspective();
    animateEnvironment();

    //Choose which camera to use
    renderer.render(
        getCurrentEnvironment().scene,
        settings.USE_MAIN_CAMERA_FOR_VIEW
            ? getCameras().mainCamera
            : getCameras().portalCamera
    );

    //update metrics like FPS
    perspectiveGUI.updateStats();
}

init();
animate();
