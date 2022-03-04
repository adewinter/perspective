import * as THREE from "three";
import * as CameraUtils from "three/examples/jsm/utils/CameraUtils.js";

import settings from "./settings.js";
import Cameras from "./cameras.js";
import PerspectiveGUI from "./gui.js";
import * as roomGenerator from "./room_generate.js";
import WebsocketClient from "./websocket_client.js";

let cameras, scene, renderer, perspectiveGUI, websocketClient;

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

function generateSceneEnvironment() {
    refMesh = createWorldWindow();
    scene.add(refMesh);

    const room1 = roomGenerator.createRoomWithOrnaments(
        settings.sceneWindow.width,
        settings.sceneWindow.height,
        settings.sceneWindow.width,
        5
    );
    room1.position.y -= settings.sceneWindow.height / 2;

    scene.add(room1);

    return room1;
}

function init() {
    initRendererAndScene();
    generateSceneEnvironment();

    cameras = new Cameras(settings, scene, renderer);
    cameras.portalCamera;
    websocketClient = new WebsocketClient(settings, pose);
    perspectiveGUI = new PerspectiveGUI(settings, websocketClient, cameras);

    window.addEventListener("resize", onWindowResize);

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
