import * as THREE from "three";

import * as CameraUtils from "three/examples/jsm/utils/CameraUtils.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FlyControls } from "three/examples/jsm/controls/FlyControls.js";

import Stats from "stats.js";

import settings from "./settings.js";
import PerspectiveGUI from "./gui.js";
import HeadtrackingApp from "./headtracking/headtracking.js";
import * as roomGenerator from "./room_generate.js";
import WebsocketClient from "./websocket_client.js";

let mainCamera,
    portalCamera,
    portalCameraHelper,
    scene,
    renderer,
    perspectiveGUI,
    websocketClient;

let cameraControls;

let clock;

let stats;
const pose = {
    position: { x: 0.0, y: -0.0, z: 0.0 },
    rawPosition: { x: 0.0, y: -0.0, z: 0.0 },
};
let portalCamPosXEl;
let portalCamPosYEl;
let portalCamPosZEl;

let portalMesh, portalTexture, refMesh;

let refMeshTL, refMeshBL, refMeshBR;

function initRendererAndScene() {
    const container = document.getElementById("3dviewcontainer");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(settings.rendererWidth, settings.rendererHeight);
    container.appendChild(renderer.domElement);
    renderer.localClippingEnabled = true;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00eeff, 0.18);
}

function createStats() {
    stats = new Stats();
    stats.dom.id = "fps-stats";
    document.getElementById("3dviewcontainer").appendChild(stats.dom);
}

function createClocks() {
    clock = new THREE.Clock();
}

function setupMainCameraControls() {
    cameraControls = new FlyControls(mainCamera, renderer.domElement);
    cameraControls.movementSpeed = 5;
    cameraControls.domElement = renderer.domElement;
    cameraControls.rollSpeed = Math.PI / 2;
    cameraControls.autoForward = false;
    cameraControls.dragToLook = true;
}

function createCameras() {
    mainCamera = new THREE.PerspectiveCamera(
        45,
        settings.rendererWidth / settings.rendererHeight,
        0.01,
        100
    );
    portalCamera = new THREE.PerspectiveCamera(
        45,
        settings.sceneWindowWidthInitial / settings.sceneWindowHeightInitial,
        0.01,
        500.0
    );

    mainCamera.position.set(-3, 3, 3.0);
    mainCamera.lookAt(portalCamera.position);
    scene.add(mainCamera);

    scene.add(portalCamera);

    if (settings.USE_PORTAL_CAMERA_HELPER) {
        portalCameraHelper = new THREE.CameraHelper(portalCamera);
        scene.add(portalCameraHelper);
    }
}

function createWorldWindow() {
    refMeshBL = new THREE.Vector3();
    refMeshBR = new THREE.Vector3();
    refMeshTL = new THREE.Vector3();
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

function createportalMesh() {
    const portalGeo = new THREE.PlaneGeometry(
        settings.sceneWindow.width * 20,
        settings.sceneWindow.height * 20
    );
    const portalTextureXResolution =
        (1024 * settings.portalWidth) / settings.portalHeight;
    const portalTextureYResolution = 1024;
    portalTexture = new THREE.WebGLRenderTarget(
        portalTextureXResolution,
        portalTextureYResolution
    );

    const portal = new THREE.Mesh(
        portalGeo,
        new THREE.MeshBasicMaterial({ map: portalTexture.texture })
    );

    portal.position.y = 3;

    return portal;
}

function vecToString(vec) {
    return (
        "x:" +
        vec.x.toFixed() +
        ",\ty:" +
        vec.y.toFixed() +
        ",\tz:" +
        vec.z.toFixed()
    );
}

let refMeshStartPosition;
function createScene() {
    refMesh = createWorldWindow();
    // refMesh.position.set(-0.5, 0, 0.5);
    scene.add(refMesh);

    const room1 = roomGenerator.createRoomWithOrnaments(
        settings.sceneWindow.width,
        settings.sceneWindow.height,
        settings.sceneWindow.width,
        5
    );
    room1.position.y -= settings.sceneWindow.height / 2;

    scene.add(room1);

    const room2 = roomGenerator.createRoom(10, 10);
    room2.position.x = -15;
    portalMesh = createportalMesh();
    room2.add(portalMesh);
    scene.add(room2);

    return room1;
}

function initDomEls() {
    portalCamPosXEl = document.querySelector("#posxPortalCam pre");
    portalCamPosYEl = document.querySelector("#posyPortalCam pre");
    portalCamPosZEl = document.querySelector("#poszPortalCam pre");
}

function check_url_params() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    if (params.skipheadtrack === "1") {
        console.log("SKIPPING LAUNCH OF HEADTRACKING!");
        settings.SHOULD_LAUNCH_HEADTRACKING = false;
    }
}

function init() {
    initDomEls();
    createStats();
    initRendererAndScene();
    createClocks();

    let target = createScene();
    createCameras(target);
    setupMainCameraControls();
    window.portalCamera = portalCamera;
    window.refMesh = refMesh;
    websocketClient = new WebsocketClient(settings, pose);
    perspectiveGUI = new PerspectiveGUI(settings, websocketClient);

    check_url_params();
    if (settings.SHOULD_LAUNCH_HEADTRACKING) {
        HeadtrackingApp();
    }
    websocketClient.connect_websocket();
}

function updateControls() {
    const delta = clock.getDelta();
    cameraControls.update(delta);
}

function renderPortal() {
    // save the original camera properties
    const currentRenderTarget = renderer.getRenderTarget();
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    // find refMesh corners;
    refMeshBL.set(
        -settings.sceneWindow.width / 2,
        -settings.sceneWindow.height / 2,
        0
    );
    // refMeshBR.set(-settings.sceneWindow.width/2, -settings.sceneWindow.height/2, 0);

    refMesh.localToWorld(refMeshBL);

    refMeshBR.set(
        settings.sceneWindow.width / 2,
        -settings.sceneWindow.height / 2,
        0
    );
    // refMeshBL.set(settings.sceneWindow.width/2, -settings.sceneWindow.height/2, 0);

    refMesh.localToWorld(refMeshBR);

    refMeshTL.set(
        -settings.sceneWindow.width / 2,
        settings.sceneWindow.height / 2,
        0
    );
    refMesh.localToWorld(refMeshTL);

    // render the portal effect
    CameraUtils.frameCorners(
        portalCamera,
        refMeshBL,
        refMeshBR,
        refMeshTL,
        false
    );
    // CameraUtils.frameCorners(main, refMeshBL, refMeshBR, refMeshTL, false);

    portalTexture.texture.encoding = renderer.outputEncoding;

    renderer.setRenderTarget(portalTexture);
    renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897
    if (renderer.autoClear === false) renderer.clear();
    portalMesh.visible = false; // hide this portal from its own rendering
    renderer.render(scene, portalCamera);
    portalMesh.visible = true; // re-enable this portal's visibility for general rendering

    // restore the original rendering properties
    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget(currentRenderTarget);
}

function getHeadCoordsAndMoveCamera() {
    let camera_position = new THREE.Vector3(0, 0, 0);
    let headPosition = settings.headtracking.SHOULD_USE_RAW_POSITION
        ? pose.position
        : pose.rawPosition;

    // Treat GUI x,y,z values as offset values to be added to value provided by headtracker
    camera_position.x =
        headPosition.x * settings.portalCamOffset.scaleX +
        settings.portalCamOffset.x;
    camera_position.y =
        headPosition.y * settings.portalCamOffset.scaleY +
        settings.portalCamOffset.y;
    camera_position.z =
        headPosition.z * settings.portalCamOffset.scaleZ +
        settings.portalCamOffset.z;

    //Figure out world coordinates of camera_position (which is a vector relative to the origin of refMesh)
    refMesh.localToWorld(camera_position);

    //Set the new position for the portalCamera
    portalCamera.position.copy(camera_position);

    portalCamPosXEl.innerText = portalCamera.position.x.toFixed(4);
    portalCamPosYEl.innerText = portalCamera.position.y.toFixed(4);
    portalCamPosZEl.innerText = portalCamera.position.z.toFixed(4);
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

function animate() {
    requestAnimationFrame(animate);
    updateControls();

    getHeadCoordsAndMoveCamera();

    updateRefMeshDimensionsAndMaterial();
    renderPortal();
    renderer.render(
        scene,
        settings.USE_MAIN_CAMERA_FOR_VIEW ? mainCamera : portalCamera
    );
    stats.update();
}

init();
animate();
