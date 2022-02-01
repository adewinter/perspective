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

const portalWidth = 4.0;
const portalHeight = 6.0;

let worldCamPosEl, portalCamPosEl, refMeshCamPosEl;

let portalMesh, portalTexture, refMesh;

let refMeshTL, refMeshBL, refMeshBR

const rendererWidth = 640;
const rendererHeight = 480;

const sceneWindowWidth = 0.29; //dimensions of our 'window into the world'
const sceneWindowHeight = 0.19;

// we will treat 1 ThreeJS/WebGL unit as 1 meter when working with x/y/z etc
let flagLookOnce = true;




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
    portalCamera = new THREE.PerspectiveCamera( 45, portalWidth/portalHeight, 0.1, 500.0 );

    mainCamera.position.set( 0, 14.5, 16.0 );
    mainCamera.lookAt(new THREE.Vector3(0,0,-8));

    scene.add(mainCamera);
    
    portalCamera.position.set( 0, 15, 16.0 );
    portalCamera.lookAt(refMesh.position);
    
    // find refMesh corners;
    // refMeshBL.set(-sceneWindowWidth/2, -sceneWindowHeight/2, 0);
    // refMesh.localToWorld(refMeshBL);

    // refMeshBR.set(sceneWindowWidth/2, -sceneWindowHeight/2, 0);
    // refMesh.localToWorld(refMeshBR);

    // refMeshTL.set(-sceneWindowWidth/2, sceneWindowHeight/2, 0);
    // refMesh.localToWorld(refMeshTL);

    // // render the portal effect
    // CameraUtils.frameCorners(portalCamera, refMeshBL, refMeshBR, refMeshTL, false);




    scene.add( portalCamera );
    portalCameraHelper = new THREE.CameraHelper( portalCamera );
    scene.add( portalCameraHelper );

}

function createRoom() {
    function getColor() {
        return colorList[Math.floor(Math.random()*colorList.length)];
    }
    const planeWidth = 10;
    const planeHeight = 10;
    const roomGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry( planeWidth, planeHeight );
    // walls
    const planeTop = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeTop.position.y = planeHeight;
    planeTop.rotateX( Math.PI / 2 );
    roomGroup.add( planeTop );

    const planeBottom = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBottom.rotateX( - Math.PI / 2 );
    roomGroup.add( planeBottom );

    const planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeFront.position.z = planeHeight/2;
    planeFront.position.y = planeWidth/2;
    planeFront.rotateY( Math.PI );
    roomGroup.add( planeFront );

    const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBack.position.z = planeHeight/-2;
    planeBack.position.y = planeWidth/2;
    roomGroup.add( planeBack );

    const planeRight = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeRight.position.x = planeWidth/2;
    planeRight.position.y = planeWidth/2;
    planeRight.rotateY( - Math.PI / 2 );
    roomGroup.add( planeRight );

    const planeLeft = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeLeft.position.x = planeWidth/-2;
    planeLeft.position.y = planeWidth/2;
    planeLeft.rotateY( Math.PI / 2 );
    roomGroup.add( planeLeft );



    // lights
    const mainLight = new THREE.PointLight( 0xcccccc, 1.5, 80.0 );
    mainLight.position.y = 6;
    roomGroup.add( mainLight );

    const greenLight = new THREE.PointLight( 0x00ff00, 0.25, 200.0 );
    greenLight.position.set( 55, 5, 0 );
    roomGroup.add( greenLight );

    const redLight = new THREE.PointLight( 0xff0000, 0.25, 100.0 );
    redLight.position.set( - 55, 5, 0 );
    roomGroup.add( redLight );

    const blueLight = new THREE.PointLight( 0x7f7fff, 0.25, 100.0 );
    blueLight.position.set( 0, 5, 55 );
    roomGroup.add( blueLight );

    // scene.add(roomGroup);
    return roomGroup;
}

function createOrnament() {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(1.0, 1.0, 1);
    const boxMat = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
    const box = new THREE.Mesh( boxGeo, boxMat );
    box.castShadow = true;
    box.position.y = 0.5;
    ornamentGroup.add(box);

    const torusGeo = new THREE.TorusKnotGeometry( 0.4, 0.08, 95, 20 );
    const torusMat = new THREE.MeshPhongMaterial( {
        color: 0x80ee10,
        shininess: 100,
        side: THREE.DoubleSide
    });

    const torus = new THREE.Mesh( torusGeo, torusMat );
    torus.castShadow = true;
    torus.position.y = 1.7;
    ornamentGroup.add(torus);

    return ornamentGroup;
}

function createWorldWindow() {
    refMeshBL = new THREE.Vector3();
    refMeshBR = new THREE.Vector3();
    refMeshTL = new THREE.Vector3();
    const planeGeo = new THREE.PlaneGeometry( sceneWindowWidth, sceneWindowHeight );
    const planeMat = new THREE.MeshBasicMaterial({opacity: 0.0, wireframe: true});
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    return planeMesh;
}

function createportalMesh() {
    const portalGeo = new THREE.PlaneGeometry( sceneWindowWidth*20, sceneWindowHeight*20 );
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
    refMesh.position.set (0, 14.5, 15.5);
    scene.add(refMesh);
    
    const room1 = createRoom();
        // portalMesh.position.z = -3;
        // room1.add(portalMesh);
        const ornament = createOrnament();
        ornament.position.z = -0.2;
        room1.add(ornament);
        const otherOrn = createOrnament();
        otherOrn.position.z = 4.5;
        otherOrn.position.x = 1.0;
        room1.add(otherOrn);
    scene.add(room1);


    const room2 = createRoom();
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

function init() {
    initDomEls();
    initRendererAndScene();
    createClocks();
    createStats();
    createGUI();

    let target = createScene();
    createCameras(target);
    setupMainCameraControls();
    window.portalCamera = portalCamera;
    window.refMesh = refMesh;
    
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
    refMeshBL.set(-sceneWindowWidth/2, -sceneWindowHeight/2, 0);
    refMesh.localToWorld(refMeshBL);

    refMeshBR.set(sceneWindowWidth/2, -sceneWindowHeight/2, 0);
    refMesh.localToWorld(refMeshBR);

    refMeshTL.set(-sceneWindowWidth/2, sceneWindowHeight/2, 0);
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
    let hp = window.headPosition;
    let headPosition = new THREE.Vector3(hp.x, hp.y, hp.z);
    refMesh.localToWorld(headPosition);

    // console.log(test);
    portalCamera.position.copy(headPosition);


}

function animate() {
    requestAnimationFrame(animate);
    updateControls();
    // movePortalCameraRelativeToMainCamera();
    getHeadCoordsAndMoveCamera();
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