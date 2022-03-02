import * as THREE from "three";

import * as CameraUtils from "three/examples/jsm/utils/CameraUtils.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FlyControls } from "three/examples/jsm/controls/FlyControls.js";

import Stats from "stats.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

import HeadtrackingApp from "./headtracking/headtracking.js";
import * as roomGenerator from "./room_generate.js";
import * as WebsocketClientApp from "./websocket_client.js";

let mainCamera, portalCamera, portalCameraHelper, scene, renderer;

let cameraControls;

let clock;

let stats;

let portalCamPosXEl;
let portalCamPosYEl;
let portalCamPosZEl;

const portalWidth = 4.0;
const portalHeight = 6.0;

let portalMesh, portalTexture, refMesh;

let refMeshTL, refMeshBL, refMeshBR;

const rendererWidth = document.body.clientWidth;
const rendererHeight = document.documentElement.clientHeight;

const sceneWindowWidthInitial = 0.34; //meters
const sceneWindowHeightInitial =
    1 * (rendererHeight / rendererWidth) * sceneWindowWidthInitial; //meters

const sceneWindow = {
    //dimensions of our 'window into the world'
    width: sceneWindowWidthInitial,
    height: sceneWindowHeightInitial,
    x: 0,
    y: 0,
    z: 0,
    IS_REFMESH_TRANSPARENT: true,
};

// we will treat 1 ThreeJS/WebGL unit as 1 meter when working with x/y/z etc
let flagLookOnce = false;

let gui;

let portalCamOffset = {
    x: 0,
    y: 0.1,
    z: 0.0,
    scaleX: 1,
    scaleY: -1,
    scaleZ: 1,
    lockX: false,
    lockY: false,
    lockZ: false,
};

let SHOULD_LAUNCH_HEADTRACKING = false;
let USE_PORTAL_CAMERA_HELPER = true;
let USE_MAIN_CAMERA_FOR_VIEW = false;

function initRendererAndScene() {
    const container = document.getElementById("3dviewcontainer");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(rendererWidth, rendererHeight);
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

function toggleCamera() {
    USE_MAIN_CAMERA_FOR_VIEW = !USE_MAIN_CAMERA_FOR_VIEW;
}

function createGUI() {
    gui = new GUI();
    const viewFolder = gui.addFolder("View");
    viewFolder.open();
    viewFolder
        .add({ toggleCamera: toggleCamera }, "toggleCamera")
        .name("Swap Between Main and Portal Camera");
    const websocketFolder = gui.addFolder("Websocket");
    websocketFolder
        .add({ toggle: WebsocketClientApp.toggleWebsocketConnection }, "toggle")
        .name("Connect/Disconnect Headtracker");
    websocketFolder.open();
    const positionDataFolder = gui.addFolder("Position Data");
    positionDataFolder
        .add(
            { toggleDataFeed: WebsocketClientApp.toggleUseRawPosition },
            "toggleDataFeed"
        )
        .name("Toggle Raw/Smooth data");
    positionDataFolder.open();
    const perspFolder = gui.addFolder("Perspective Camera");
    perspFolder.add(portalCamOffset, "lockX");
    perspFolder.add(portalCamOffset, "lockY");
    perspFolder.add(portalCamOffset, "lockZ");
    perspFolder.add(portalCamOffset, "x", -3.1, 3);
    perspFolder.add(portalCamOffset, "y", -3.1, 3);
    perspFolder.add(portalCamOffset, "z", -3.1, 3);
    perspFolder.open();

    const perspScaleFolder = perspFolder.addFolder(
        "Movement scaling multipliers"
    );
    perspScaleFolder.add(portalCamOffset, "scaleX", -3, 3);
    perspScaleFolder.add(portalCamOffset, "scaleY", -3, 3);
    perspScaleFolder.add(portalCamOffset, "scaleZ", -3, 3);
    perspScaleFolder.open();

    const sceneWindowFolder = gui.addFolder("Scene Window Dimensions");
    sceneWindowFolder.add(sceneWindow, "IS_REFMESH_TRANSPARENT");
    sceneWindowFolder.add(sceneWindow, "width", 0, 3.1);
    sceneWindowFolder.add(sceneWindow, "height", 0, 3.1);
    sceneWindowFolder.add(sceneWindow, "x", -2, 2.0);
    sceneWindowFolder.add(sceneWindow, "y", -2, 2.0);
    sceneWindowFolder.add(sceneWindow, "z", -2, 2.0);
    sceneWindowFolder.open();
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
        rendererWidth / rendererHeight,
        0.01,
        100
    );
    portalCamera = new THREE.PerspectiveCamera(
        45,
        sceneWindowWidthInitial / sceneWindowHeightInitial,
        0.01,
        500.0
    );

    mainCamera.position.set(-3, 3, 3.0);
    mainCamera.lookAt(portalCamera.position);
    scene.add(mainCamera);

    scene.add(portalCamera);

    if (USE_PORTAL_CAMERA_HELPER) {
        portalCameraHelper = new THREE.CameraHelper(portalCamera);
        scene.add(portalCameraHelper);
    }
}

function createWorldWindow() {
    refMeshBL = new THREE.Vector3();
    refMeshBR = new THREE.Vector3();
    refMeshTL = new THREE.Vector3();
    const planeGeo = new THREE.PlaneGeometry(
        sceneWindow.width,
        sceneWindow.height
    );
    const planeMat = new THREE.MeshBasicMaterial({
        opacity: 0.0,
        transparent: sceneWindow.IS_REFMESH_TRANSPARENT,
        wireframe: !sceneWindow.IS_REFMESH_TRANSPARENT,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    return planeMesh;
}

function createportalMesh() {
    const portalGeo = new THREE.PlaneGeometry(
        sceneWindow.width * 20,
        sceneWindow.height * 20
    );
    const portalTextureXResolution = (1024 * portalWidth) / portalHeight;
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
    // refMesh.position.z = 0.5;
    scene.add(refMesh);

    const room1 = roomGenerator.createRoomWithOrnaments(
        sceneWindow.width,
        sceneWindow.height,
        sceneWindow.width,
        5
    );
    room1.position.y -= sceneWindow.height / 2;
    // room1.position.z += 0.5

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
        SHOULD_LAUNCH_HEADTRACKING = false;
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
    createGUI();

    check_url_params();
    if (SHOULD_LAUNCH_HEADTRACKING) {
        HeadtrackingApp();
    }

    // WebsocketClientApp.init_websocket_client();
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
    refMeshBL.set(-sceneWindow.width / 2, -sceneWindow.height / 2, 0);
    // refMeshBR.set(-sceneWindow.width/2, -sceneWindow.height/2, 0);

    refMesh.localToWorld(refMeshBL);

    refMeshBR.set(sceneWindow.width / 2, -sceneWindow.height / 2, 0);
    // refMeshBL.set(sceneWindow.width/2, -sceneWindow.height/2, 0);

    refMesh.localToWorld(refMeshBR);

    refMeshTL.set(-sceneWindow.width / 2, sceneWindow.height / 2, 0);
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

window.headPosition = { x: 0.0, y: -0.0, z: 0.0 };
function getHeadCoordsAndMoveCamera() {
    let camera_position = new THREE.Vector3(0, 0, 0);

    // Treat GUI x,y,z values as offset values to be added to value provided by headtracker
    camera_position.x =
        window.headPosition.x * portalCamOffset.scaleX + portalCamOffset.x;
    camera_position.y =
        window.headPosition.y * portalCamOffset.scaleY + portalCamOffset.y;
    camera_position.z =
        window.headPosition.z * portalCamOffset.scaleZ + portalCamOffset.z;

    //Figure out world coordinates of camera_position (which is a vector relative to the origin of refMesh)
    refMesh.localToWorld(camera_position);

    //Set the new position for the portalCamera
    portalCamera.position.copy(camera_position);

    portalCamPosXEl.innerText = portalCamera.position.x.toFixed(4);
    portalCamPosYEl.innerText = portalCamera.position.y.toFixed(4);
    portalCamPosZEl.innerText = portalCamera.position.z.toFixed(4);
}

function updateRefMeshDimensions() {
    refMesh.scale.x = sceneWindow.width / sceneWindowWidthInitial;
    refMesh.scale.y = sceneWindow.height / sceneWindowHeightInitial;
    refMesh.position.x = sceneWindow.x;
    refMesh.position.y = sceneWindow.y;
    refMesh.position.z = sceneWindow.z;
}

function animate() {
    requestAnimationFrame(animate);
    updateControls();

    getHeadCoordsAndMoveCamera();

    updateRefMeshDimensions();
    renderPortal();
    renderer.render(
        scene,
        USE_MAIN_CAMERA_FOR_VIEW ? mainCamera : portalCamera
    );
    stats.update();

    if (flagLookOnce) {
        flagLookOnce = false;
        portalCamera.lookAt(refMesh.position);
    }
}

init();
animate();
