import * as THREE from "three";
import * as CameraUtils from "three/examples/jsm/utils/CameraUtils.js";

import settings, * as CONSTANTS from "./settings.js";
import Cameras from "./cameras.js";
import PerspectiveGUI from "./gui.js";
import * as roomGenerator from "./room_generate.js";
import WebsocketClient from "./websocket_client.js";
import EnvLittlestTokyo from "./env_littlest_tokyo.js";

let cameras, scene, renderer, perspectiveGUI, websocketClient, perspective_env;

const pose = {
    position: { x: 0.0, y: -0.0, z: 0.0 },
    rawPosition: { x: 0.0, y: -0.0, z: 0.0 },
};

let refMesh;

function initRendererAndScene() {
    const container = document.getElementById("3dviewcontainer");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(settings.rendererWidth, settings.rendererHeight);
    container.appendChild(renderer.domElement);
    renderer.localClippingEnabled = true;
    scene = new THREE.Scene();
}

function createWorldWindow() {
    const planeGeo = new THREE.PlaneGeometry(
        settings.sceneWindow.width,
        settings.sceneWindow.height
    );
    const planeMat = new THREE.MeshBasicMaterial({
        opacity: 0.0,
        transparent: settings.sceneWindow.IS_REFMESH_TRANSPARENT,
        wireframe: !settings.sceneWindow.IS_REFMESH_TRANSPARENT,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    return planeMesh;
}

function generateCalibrationRoom() {
    const room1 = roomGenerator.createRoomWithOrnaments(
        settings.sceneWindow.width,
        settings.sceneWindow.height,
        settings.sceneWindow.width,
        5
    );
    room1.position.y -= settings.sceneWindow.height / 2;

    scene.add(room1);

    return;
}

function generateLittlestTokyoEnv() {
    const littlest_tokyo = new EnvLittlestTokyo(renderer);
    const width = settings.sceneWindow.width;
    const height = settings.sceneWindow.height;
    const depth = settings.sceneWindow.width;
    const sceneToAdd = littlest_tokyo.generate_environment(
        width,
        height,
        depth
    );
    // littlest_tokyo.model.rotateY(Math.PI / 3);
    // littlest_tokyo.model.position.set(2, 3, 5);
    scene = sceneToAdd;
    window.scene = scene;
    window.lt = littlest_tokyo;
    return littlest_tokyo;
}

function generateSceneEnvironment() {
    let output;
    switch (settings.environment.current_environment) {
        case CONSTANTS.CALIBRATION_ROOM:
            output = generateCalibrationRoom();
            break;

        case CONSTANTS.LITTLEST_TOKYO:
            output = generateLittlestTokyoEnv();
            break;
    }
    return output;
}

function init() {
    initRendererAndScene();
    perspective_env = generateSceneEnvironment();
    refMesh = createWorldWindow();
    scene.add(refMesh);

    refMesh.rotateX(settings.sceneWindow.rotateX);
    refMesh.rotateY(settings.sceneWindow.rotateY);
    refMesh.rotateZ(settings.sceneWindow.rotateZ);

    cameras = new Cameras(settings, scene, renderer);
    cameras.portalCamera;
    websocketClient = new WebsocketClient(settings, pose);
    perspectiveGUI = new PerspectiveGUI(settings, websocketClient, cameras);

    window.addEventListener("resize", onWindowResize);

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
        cameras.portalCamera,
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

    //Set the new position for the cameras.portalCamera
    cameras.portalCamera.position.copy(camera_position);
    cameras.updateUIWithCameraPositions();
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

function onWindowResize() {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    settings.updateSettingsWithNewRendererDims(canvasWidth, canvasHeight);
    renderer.setSize(settings.rendererWidth, settings.rendererHeight);
    let camera = settings.USE_MAIN_CAMERA_FOR_VIEW
        ? cameras.mainCamera
        : cameras.portalCamera;
    camera.aspect = settings.rendererWidth / settings.rendererHeight;
    camera.updateProjectionMatrix();
}

function updateEnvironment() {
    if (perspective_env) {
        perspective_env.updateEnvironment();
    }
}

function animate() {
    requestAnimationFrame(animate);
    cameras.updateControls();

    getHeadCoordsAndMoveCamera();

    updateRefMeshDimensionsAndMaterial();
    updatePortalCameraPerspective();

    //Choose which camera to use
    renderer.render(
        scene,
        settings.USE_MAIN_CAMERA_FOR_VIEW
            ? cameras.mainCamera
            : cameras.portalCamera
    );

    //update metrics like FPS
    perspectiveGUI.updateStats();
}

init();
animate();
