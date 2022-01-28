import * as THREE from 'three';

import * as CameraUtils from './node_modules/three/examples/jsm/utils/CameraUtils.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from './node_modules/three/examples/jsm/controls/FlyControls.js';


import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { GUI } from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

let mainCamera, portalCamera, portalCameraHelper, scene, renderer;

let cameraControls;

let clock;

let stats;

let colorList = [0x922606, 0x69E216, 0xEC2EA3, 0x60DCDA, 0xD76A9A, 0x1521DA, 0xDC3146, 0xB69C83, 0x1E670A, 0xE2CC37];

const portalWidth = 40;
const portalHeight = 60;

let worldCamPosEl, portalCamPosEl, refMeshCamPosEl;

let portalMesh, portalTexture, refMesh;

let refMeshTL, refMeshBL, refMeshBR


init();
animate();

function initRendererAndScene() {
    const container = document.getElementById( 'container' );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.localClippingEnabled = true;
    scene = new THREE.Scene();
}

function createStats() {
    stats = new Stats();
    document.body.appendChild( stats.dom );
}

function createClocks() {
    clock = new THREE.Clock();
}

function createGUI() {

}

function setupMainCameraControls() {
    // cameraControls = new OrbitControls( mainCamera, renderer.domElement );
    // cameraControls.target.set( 0, 40, 0 );
    // cameraControls.maxDistance = 400;
    // cameraControls.minDistance = 10;
    // cameraControls.update();


    cameraControls = new FlyControls( mainCamera, renderer.domElement );
    cameraControls.movementSpeed = 50;
    cameraControls.domElement = renderer.domElement;
    cameraControls.rollSpeed = Math.PI / 2;
    cameraControls.autoForward = false;
    cameraControls.dragToLook = true;
}

function createCameras() {
    mainCamera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 5000 );
    mainCamera.position.set( 0, 75, 160 );

    portalCamera = new THREE.PerspectiveCamera( 45, portalWidth/portalHeight, 0.1, 500.0 );
    scene.add( portalCamera );
    portalCameraHelper = new THREE.CameraHelper( portalCamera );
    scene.add( portalCameraHelper );

}

function createRoom() {
    function getColor() {
        return colorList[Math.floor(Math.random()*colorList.length)];
    }
    const roomGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry( 100.1, 100.1 );
    // walls
    const planeTop = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeTop.position.y = 100;
    planeTop.rotateX( Math.PI / 2 );
    roomGroup.add( planeTop );

    const planeBottom = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBottom.rotateX( - Math.PI / 2 );
    roomGroup.add( planeBottom );

    const planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeFront.position.z = 50;
    planeFront.position.y = 50;
    planeFront.rotateY( Math.PI );
    roomGroup.add( planeFront );

    const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBack.position.z = - 50;
    planeBack.position.y = 50;
    roomGroup.add( planeBack );

    const planeRight = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeRight.position.x = 50;
    planeRight.position.y = 50;
    planeRight.rotateY( - Math.PI / 2 );
    roomGroup.add( planeRight );

    const planeLeft = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeLeft.position.x = - 50;
    planeLeft.position.y = 50;
    planeLeft.rotateY( Math.PI / 2 );
    roomGroup.add( planeLeft );



    // lights
    const mainLight = new THREE.PointLight( 0xcccccc, 1.5, 250 );
    mainLight.position.y = 60;
    roomGroup.add( mainLight );

    const greenLight = new THREE.PointLight( 0x00ff00, 0.25, 1000 );
    greenLight.position.set( 550, 50, 0 );
    roomGroup.add( greenLight );

    const redLight = new THREE.PointLight( 0xff0000, 0.25, 1000 );
    redLight.position.set( - 550, 50, 0 );
    roomGroup.add( redLight );

    const blueLight = new THREE.PointLight( 0x7f7fff, 0.25, 1000 );
    blueLight.position.set( 0, 50, 550 );
    roomGroup.add( blueLight );

    // scene.add(roomGroup);
    return roomGroup;
}

function createOrnament() {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(10.0, 10.0, 10);
    const boxMat = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
    const box = new THREE.Mesh( boxGeo, boxMat );
    box.position.y = 5;
    ornamentGroup.add(box);

    const torusGeo = new THREE.TorusKnotGeometry( 4, 0.8, 95, 20 );
    const torusMat = new THREE.MeshPhongMaterial( {
        color: 0x80ee10,
        shininess: 100,
        side: THREE.DoubleSide
    });

    const torus = new THREE.Mesh( torusGeo, torusMat );
    torus.castShadow = true;
    torus.position.y = 20;
    ornamentGroup.add(torus);

    return ornamentGroup;
}

function createrefMesh() {
    refMeshBL = new THREE.Vector3();
    refMeshBR = new THREE.Vector3();
    refMeshTL = new THREE.Vector3();
    const planeGeo = new THREE.PlaneGeometry( portalWidth, portalHeight );
    const planeMat = new THREE.MeshBasicMaterial({opacity: 0.0, wireframe: true});
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.position.y = 30;
    return planeMesh;
}

function createportalMesh() {
    const portalGeo = new THREE.PlaneGeometry( portalWidth, portalHeight );
    const portalTextureXResolution = 1024*portalWidth/portalHeight;
    const portalTextureYResolution = 1024;
    portalTexture = new THREE.WebGLRenderTarget(portalTextureXResolution, portalTextureYResolution);

    const portal = new THREE.Mesh( portalGeo, new THREE.MeshBasicMaterial( { map: portalTexture.texture } ) );

    portal.position.y = 30;

    return portal
}

function vecToString(vec) {
    return 'x:' + vec.x.toFixed() + ',\ty:' + vec.y.toFixed() + ',\tz:' + vec.z.toFixed();
}

function createScene() {
    const room1 = createRoom();
        portalMesh = createportalMesh();
        portalMesh.position.z = -30;
        room1.add(portalMesh);
    scene.add(room1);
    
    const room2 = createRoom();
        const ornament = createOrnament();
        ornament.position.z = -20;
        room2.add(ornament);
        const otherOrn = createOrnament();
        otherOrn.position.z = 45;
        otherOrn.position.x = 10;
        room2.add(otherOrn);
        refMesh = createrefMesh();
        refMesh.position.z = 35;
        room2.add(refMesh);
    room2.position.x = 150;
    scene.add(room2);
}

function initDomEls() {
    worldCamPosEl = document.querySelector('#worldCamPos');
    portalCamPosEl = document.querySelector('#portalCamPos');
    refMeshCamPosEl = document.querySelector('#refMeshCamPos');
}

function init() {
    initDomEls();
    initRendererAndScene();
    createClocks();
    createStats();
    createGUI();

    createCameras();
    setupMainCameraControls();
    createScene();
    
}

function updateControls() {
    const delta = clock.getDelta();
    cameraControls.update( delta )
}

function movePortalCameraRelativeToMainCamera(){
    let world_MainCameraPosition = mainCamera.position.clone();
    worldCamPosEl.innerText = vecToString(world_MainCameraPosition);

    let portal_MainCameraPosition = world_MainCameraPosition.clone()
    portalMesh.worldToLocal(portal_MainCameraPosition);
    portalCamPosEl.innerText = vecToString(portal_MainCameraPosition)

    //converts portalCameraPosition vector from worldSpace to refMesh local space
    let world_PortalCameraPosition = portal_MainCameraPosition.clone()
    refMesh.localToWorld(world_PortalCameraPosition);
    refMeshCamPosEl.innerText = vecToString(world_PortalCameraPosition);

    //sets portalCamera position to that of refMesh.position
    portalCamera.position.copy(world_PortalCameraPosition)
}

function renderPortal() {
    // save the original camera properties
    const currentRenderTarget = renderer.getRenderTarget();
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    // find refMesh corners;
    refMeshBL.set(-portalWidth/2, -portalHeight/2, 0);
    refMesh.localToWorld(refMeshBL);

    refMeshBR.set(portalWidth/2, -portalHeight/2, 0);
    refMesh.localToWorld(refMeshBR);

    refMeshTL.set(-portalWidth/2, portalHeight/2, 0);
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

function animate() {
    requestAnimationFrame(animate);
    updateControls();
    movePortalCameraRelativeToMainCamera();
    renderPortal()
    renderer.render(scene, mainCamera);
    stats.update();
}