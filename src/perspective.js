import * as THREE from 'three';

import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';


import Stats from 'stats.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import HeadtrackingApp from './headtracking/headtracking.js';
import * as roomGenerator from './room_generate.js';

let mainCamera, portalCamera, portalCameraHelper, scene, renderer;

let cameraControls;

let clock;

let stats;


const portalWidth = 4.0;
const portalHeight = 6.0;

let worldCamPosEl, portalCamPosEl, refMeshCamPosEl;

let portalMesh, portalTexture, refMesh;

let refMeshTL, refMeshBL, refMeshBR

const rendererWidth = 1100;
const rendererHeight = 720;

const sceneWindowWidthInitial = 0.29; //meters
const sceneWindowHeightInitial = 0.19; //meters

const sceneWindow = { //dimensions of our 'window into the world'
    width: sceneWindowWidthInitial,
    height: sceneWindowHeightInitial
};

// we will treat 1 ThreeJS/WebGL unit as 1 meter when working with x/y/z etc
let flagLookOnce = true;

let gui;

let portalCamOffset = {x:0, y:0, z:0};

let SHOULD_LAUNCH_HEADTRACKING = true;


function initRendererAndScene() {
    const container = document.getElementById( 'container' );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( rendererWidth, rendererHeight );
    container.appendChild( renderer.domElement );
    renderer.localClippingEnabled = true;
    scene = new THREE.Scene();
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
    perspFolder.add(portalCamOffset, 'x', -3.1, 3);
    perspFolder.add(portalCamOffset, 'y', -3.1, 3);
    perspFolder.add(portalCamOffset, 'z', -3.1, 3);
    perspFolder.open();

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
    // mainCamera.lookAt(new THREE.Vector3(0,0,-8));

    scene.add(mainCamera);
    

    
    // find refMesh corners;
    // refMeshBL.set(-sceneWindow.width/2, -sceneWindow.height/2, 0);
    // refMesh.localToWorld(refMeshBL);

    // refMeshBR.set(sceneWindow.width/2, -sceneWindow.height/2, 0);
    // refMesh.localToWorld(refMeshBR);

    // refMeshTL.set(-sceneWindow.width/2, sceneWindow.height/2, 0);
    // refMesh.localToWorld(refMeshTL);

    // // render the portal effect
    // CameraUtils.frameCorners(portalCamera, refMeshBL, refMeshBR, refMeshTL, false);




    scene.add( portalCamera );
    portalCameraHelper = new THREE.CameraHelper( portalCamera );
    scene.add( portalCameraHelper );

}


function createWorldWindow() {
    refMeshBL = new THREE.Vector3();
    refMeshBR = new THREE.Vector3();
    refMeshTL = new THREE.Vector3();
    const planeGeo = new THREE.PlaneGeometry( sceneWindow.width, sceneWindow.height );
    const planeMat = new THREE.MeshBasicMaterial({opacity: 0.0, wireframe: true});
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
    refMesh.position.set (0, 1.5, 6.5);
    scene.add(refMesh);
    
    const room1 = roomGenerator.createRoomWithOrnaments(1, 1, 5);

    scene.add(room1);


    const room2 = roomGenerator.createRoom(10, 10);
        room2.position.x = -15;
        portalMesh = createportalMesh();
        room2.add(portalMesh);
    scene.add(room2);

    return room1;
}

function initDomEls() {
    worldCamPosEl = document.querySelector('#worldCamPos');
    portalCamPosEl = document.querySelector('#portalCamPos');
    refMeshCamPosEl = document.querySelector('#refMeshCamPos');
}


function check_url_params() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    if(params.skipheadtrack) {
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
    refMesh.localToWorld(refMeshBL);

    refMeshBR.set(sceneWindow.width/2, -sceneWindow.height/2, 0);
    refMesh.localToWorld(refMeshBR);

    refMeshTL.set(-sceneWindow.width/2, sceneWindow.height/2, 0);
    refMesh.localToWorld(refMeshTL);

    // render the portal effect
    CameraUtils.frameCorners(portalCamera, refMeshBL, refMeshBR, refMeshTL, false);

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
window.headPosition.y += 1;
window.headPosition.z += 1;
function getHeadCoordsAndMoveCamera() {

    //reset portalCamera position
    let offset = new THREE.Vector3(0, 0, 1);
    refMesh.localToWorld(offset);
    portalCamera.position.copy(offset);

    
    //Debug device so we can use the GUI to shift the portal cam around a bit
    portalCamera.position.x += portalCamOffset.x;
    portalCamera.position.y += portalCamOffset.y;
    portalCamera.position.z += portalCamOffset.z;

    let hp = window.headPosition;
    portalCamera.position.x += hp.x;
    portalCamera.position.y += hp.y;
    portalCamera.position.z += hp.z;
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
    renderer.render(scene, mainCamera);
    stats.update();

    if(flagLookOnce) {
        flagLookOnce = false;
        portalCamera.lookAt(refMesh.position);
    }
}

init();
animate();