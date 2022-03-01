import * as THREE from 'three';

import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';


import Stats from 'stats.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import HeadtrackingApp from './headtracking/headtracking.js';
import * as roomGenerator from './room_generate.js';
import * as WebsocketClientApp from './websocket_client.js';

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

let refMeshTL, refMeshBL, refMeshBR

const rendererWidth = 1100;
const rendererHeight = 1100;

const sceneWindowWidthInitial = 1; //meters
const sceneWindowHeightInitial = 1*(rendererHeight/rendererWidth); //meters

const sceneWindow = { //dimensions of our 'window into the world'
    width: sceneWindowWidthInitial,
    height: sceneWindowHeightInitial
};

// we will treat 1 ThreeJS/WebGL unit as 1 meter when working with x/y/z etc
let flagLookOnce = false;

let gui;

let portalCamOffset = {x:0, y:-0.61, z:0, scaleX:1, scaleY:1, scaleZ:1, lockX: false, lockY: false, lockZ: false};

let SHOULD_LAUNCH_HEADTRACKING = false;
let USE_PORTAL_CAMERA_HELPER = false;
let IS_REFMESH_TRANSPARENT = true;
let USE_MAIN_CAMERA_FOR_VIEW = false;


function initRendererAndScene() {
    const container = document.getElementById( 'container' );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( rendererWidth, rendererHeight );
    container.appendChild( renderer.domElement );
    renderer.localClippingEnabled = true;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x00eeff, 0.18 );
}

function createStats() {
    stats = new Stats();
    stats.dom.style.position = "relative";
    document.body.appendChild( stats.dom );
}

function createClocks() {
    clock = new THREE.Clock();
}

function createGUI() {
    gui = new GUI();
    const perspFolder = gui.addFolder('Perspective Camera');
    perspFolder.add(portalCamOffset, 'lockX');
    perspFolder.add(portalCamOffset, 'lockY');
    perspFolder.add(portalCamOffset, 'lockZ');
    perspFolder.add(portalCamOffset, 'x', -3.1, 3);
    perspFolder.add(portalCamOffset, 'y', -3.1, 3);
    perspFolder.add(portalCamOffset, 'z', -3.1, 3);
    perspFolder.open();

    const perspScaleFolder = perspFolder.addFolder('Movement scaling multipliers');
    perspScaleFolder.add(portalCamOffset, 'scaleX', -3, 3);
    perspScaleFolder.add(portalCamOffset, 'scaleY', -3, 3);
    perspScaleFolder.add(portalCamOffset, 'scaleZ', -3, 3);
    perspScaleFolder.open();

    const sceneWindowFolder = gui.addFolder('Scene Window Dimensions');
    sceneWindowFolder.add(sceneWindow, 'width', 0, 3.1);
    sceneWindowFolder.add(sceneWindow, 'height', 0, 3.1);
    sceneWindowFolder.open();
}

function setupMainCameraControls() {
    // cameraControls = new OrbitControls( mainCamera, renderer.domElement );
    // cameraControls.target.set( 0, 40, 0 );
    // cameraControls.maxDistance = 400;
    // cameraControls.minDistance = 10;
    // cameraControls.update();


    cameraControls = new FlyControls( mainCamera, renderer.domElement );
    cameraControls.movementSpeed = 25;
    cameraControls.domElement = renderer.domElement;
    cameraControls.rollSpeed = Math.PI / 2;
    cameraControls.autoForward = false;
    cameraControls.dragToLook = true;

}

function createCameras(target) {
    mainCamera = new THREE.PerspectiveCamera( 45, rendererWidth / rendererHeight, 1, 100 );
    portalCamera = new THREE.PerspectiveCamera( 45, sceneWindowWidthInitial/sceneWindowHeightInitial, 0.1, 500.0 );

    mainCamera.position.set( 0, 0, 1.5 );
    scene.add(mainCamera);

    scene.add( portalCamera );

    if(USE_PORTAL_CAMERA_HELPER){
        portalCameraHelper = new THREE.CameraHelper( portalCamera );
        scene.add( portalCameraHelper );
    }
}


function createWorldWindow() {
    refMeshBL = new THREE.Vector3();
    refMeshBR = new THREE.Vector3();
    refMeshTL = new THREE.Vector3();
    const planeGeo = new THREE.PlaneGeometry( sceneWindow.width, sceneWindow.height );
    const planeMat = new THREE.MeshBasicMaterial({opacity: 0.0, transparent: IS_REFMESH_TRANSPARENT, wireframe: !IS_REFMESH_TRANSPARENT});
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    return planeMesh;
}

function createportalMesh() {
    const portalGeo = new THREE.PlaneGeometry( sceneWindow.width*20, sceneWindow.height*20 );
    const portalTextureXResolution = 1024*portalWidth/portalHeight;
    const portalTextureYResolution = 1024;
    portalTexture = new THREE.WebGLRenderTarget(portalTextureXResolution, portalTextureYResolution);

    const portal = new THREE.Mesh( portalGeo, new THREE.MeshBasicMaterial( { map: portalTexture.texture } ) );

    portal.position.y = 3;

    return portal
}

function vecToString(vec) {
    return 'x:' + vec.x.toFixed() + ',\ty:' + vec.y.toFixed() + ',\tz:' + vec.z.toFixed();
}



function createScene() {
    refMesh = createWorldWindow();
    // refMesh.position.set(-0.5, 0, 0.5);
    // refMesh.position.z = 0.5;
    scene.add(refMesh);
    
    const room1 = roomGenerator.createRoomWithOrnaments(1, 1, 5, 5);
    room1.position.y -= 0.5
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
    portalCamPosXEl = document.querySelector('#posxPortalCam pre');
    portalCamPosYEl = document.querySelector('#posyPortalCam pre');
    portalCamPosZEl = document.querySelector('#poszPortalCam pre');
}


function check_url_params() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    if(params.skipheadtrack === "1") {
        console.log("SKIPPING LAUNCH OF HEADTRACKING!");
        SHOULD_LAUNCH_HEADTRACKING = false
    }
}

function init() {
    initDomEls();
    initRendererAndScene();
    createClocks();
    createStats();

    let target = createScene();
    createCameras(target);
    setupMainCameraControls();
    window.portalCamera = portalCamera;
    window.refMesh = refMesh;
    createGUI();

    check_url_params();
    if(SHOULD_LAUNCH_HEADTRACKING) {
        HeadtrackingApp();
    }
    
}

function updateControls() {
    const delta = clock.getDelta();
    cameraControls.update( delta )
}

function renderPortal() {
    // save the original camera properties
    const currentRenderTarget = renderer.getRenderTarget();
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    // find refMesh corners;
    refMeshBL.set(-sceneWindow.width/2, -sceneWindow.height/2, 0);
    // refMeshBR.set(-sceneWindow.width/2, -sceneWindow.height/2, 0);

    refMesh.localToWorld(refMeshBL);

    refMeshBR.set(sceneWindow.width/2, -sceneWindow.height/2, 0);
    // refMeshBL.set(sceneWindow.width/2, -sceneWindow.height/2, 0);

    refMesh.localToWorld(refMeshBR);

    refMeshTL.set(-sceneWindow.width/2, sceneWindow.height/2, 0);
    refMesh.localToWorld(refMeshTL);

    // render the portal effect
    CameraUtils.frameCorners(portalCamera, refMeshBL, refMeshBR, refMeshTL, false);
    // CameraUtils.frameCorners(main, refMeshBL, refMeshBR, refMeshTL, false);

    portalTexture.texture.encoding = renderer.outputEncoding;

    renderer.setRenderTarget( portalTexture );
    renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897
    if ( renderer.autoClear === false ) renderer.clear();
    portalMesh.visible = false; // hide this portal from its own rendering
    renderer.render( scene, portalCamera );
    portalMesh.visible = true; // re-enable this portal's visibility for general rendering

    // restore the original rendering properties
    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget( currentRenderTarget );
}

// window.foo = new THREE.Vector3(0.1, -0.3, -0.5);
window.headPosition = { x: 0.009244461543858051, y: -0.6128315925598145, z: -0.28158923983573914 };
// window.headPosition.y += 1;
// window.headPosition.z += 1;
function getHeadCoordsAndMoveCamera() {

    //reset portalCamera position
    let offset = new THREE.Vector3(0, 0, 1);
    refMesh.localToWorld(offset);
    portalCamera.position.copy(offset);

    let hp = window.headPosition;
    // hp.x *= portalCamOffset.scaleX;
    // hp.y *= portalCamOffset.scaleY;
    // hp.z *= portalCamOffset.scaleZ;

    if(!portalCamOffset.lockX) {
        portalCamera.position.x += (+(hp.x * -1 * portalCamOffset.scaleX).toFixed(2));
    }

    if(!portalCamOffset.lockY) {
        portalCamera.position.y += (+(hp.y * -1 * portalCamOffset.scaleY).toFixed(2));
    }

    if(!portalCamOffset.lockZ) {
        portalCamera.position.z += (+(hp.z * -1 * portalCamOffset.scaleZ).toFixed(2));
    }
    
    //Debug device so we can use the GUI to shift the portal cam around a bit
    portalCamera.position.x += portalCamOffset.x;
    portalCamera.position.y += portalCamOffset.y;
    portalCamera.position.z += portalCamOffset.z;

    portalCamPosXEl.innerText = portalCamera.position.x.toFixed(4);
    portalCamPosYEl.innerText = portalCamera.position.y.toFixed(4);
    portalCamPosZEl.innerText = portalCamera.position.z.toFixed(4);
}

function updateRefMeshDimensions() {
    refMesh.scale.x = sceneWindow.width/sceneWindowWidthInitial;
    refMesh.scale.y = sceneWindow.height/sceneWindowHeightInitial;
}

function animate() {
    requestAnimationFrame(animate);
    updateControls();

    getHeadCoordsAndMoveCamera();

    updateRefMeshDimensions();
    renderPortal()
    renderer.render(scene, USE_MAIN_CAMERA_FOR_VIEW ? mainCamera : portalCamera);
    stats.update();

    if(flagLookOnce) {
        flagLookOnce = false;
        portalCamera.lookAt(refMesh.position);
    }
}

init();
animate();