import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";

import GenericEnv from "./env_generic.js";

const colorList = [
    0x922606, 0x69e216, 0xec2ea3, 0x60dcda, 0xd76a9a, 0x1521da, 0xdc3146,
    0xb69c83, 0x1e670a, 0xe2cc37,
];

const ENABLE_LIGHT_HELPERS = false;

const loader = new FontLoader();
const font_path = "/helvetiker.typeface.json";

let font;

const TEXT_SIZE = 0.02;

export default class CalibrationRoomEnv extends GenericEnv {
    constructor(renderer, settings) {
        super(renderer, settings);
    }

    _generate_environment(env_width, env_height, env_depth) {
        super._generate_environment(env_width, env_height, env_depth);
        this.num_ornaments = 25;
        this.room = createRoomWithOrnaments(
            env_width,
            env_height,
            env_depth,
            this.num_ornaments
        );
        this.scene.add(this.room);
        return this.scene;
    }

    generate() {
        return this._generate_environment(
            this.settings.sceneWindow.width * 3,
            this.settings.sceneWindow.height * 3,
            this.settings.sceneWindow.width * 20
        );
    }

    getInitialPortalPose() {
        const x = 0;
        const y = this.env_height / 2;
        const z = 0;
        return [x, y, z, 0, 0, 0];
    }
}

// myFunction wraps the above API call into a Promise
// and handles the callbacks with resolve and reject
function loadFontFunctionWrapper() {
    return new Promise((resolve, reject) => {
        loader.load(font_path, (font_data) => {
            font = font_data;
            resolve(font_data);
        });
    });
}

function createText(textString, prefix, materials) {
    const textToRender = prefix ? prefix + textString + "" : textString + "";
    const textGeometry = new TextGeometry(textToRender, {
        font: font,
        size: TEXT_SIZE,
        height: 0.005,
        curveSegments: 12,
        bevelEnabled: false,
        bevelThickness: 0.01,
        bevelSize: 0.08,
        bevelOffset: 0,
        bevelSegments: 5,
    });

    textGeometry.computeBoundingBox();
    const textMesh = new THREE.Mesh(textGeometry, materials);
    // textMesh.scale.set(0.05,0.05,0.05);
    return textMesh;
}

function getColor() {
    return colorList[Math.floor(Math.random() * colorList.length)];
}

function create_dashed_line(x0, y0, z0, x1, y1, z1, dashSize, gapSize) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: dashSize,
        gapSize: gapSize,
    });
    // const material = new THREE.LineDashedMaterial( { color: 0xffffff,
    //     linewidth:10} );

    const positions = [x0, y0, z0, x1, y1, z1];
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    );
    const line = new THREE.LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
}

function create_marker(markerLength) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const positions = [0, 0, 0, markerLength, 0, 0];
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    );
    const line = new THREE.LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
}

export async function create_display_axis(prefix, textColor) {
    const axisLength = 20;
    const markerLength = 0.1;
    const markerInterval = 0.5;
    const numMarkers = axisLength / markerInterval;

    const markers = new THREE.Group();

    await loadFontFunctionWrapper();
    const font_materials = [
        new THREE.MeshPhongMaterial({
            color: textColor ? textColor : 0xffffff,
            flatShading: true,
            emissive: 0x000000,
            specular: 0x111111,
            shininess: 30,
        }), // front
        new THREE.MeshPhongMaterial({
            color: textColor ? textColor : 0xffffff,
        }), // side
    ];

    for (let i = 0; i < numMarkers - 1; i++) {
        let marker = create_marker(markerLength);
        marker.position.x = -markerLength / 3;
        marker.position.y = markerInterval * i;
        markers.add(marker);

        let text = createText(markerInterval * i + "m", prefix, font_materials);
        text.rotateX(Math.PI / 2);
        text.position.x = markerLength / 2 + markerLength / 5;
        text.position.y = markerInterval * i - TEXT_SIZE / 2;
        markers.add(text);
    }

    const axisGroup = new THREE.Group();

    const dashed_line = create_dashed_line(0, 0, 0, 0, 20, 0, 0.09, 0.01);
    axisGroup.add(dashed_line);
    axisGroup.add(markers);

    return axisGroup;
}

function createWallMesh(width, height) {
    return new THREE.TextureLoader()
        .loadAsync("/check.png")
        .then(function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(50, 5);
            texture.anisotropy = 5;
            const geometry = new THREE.PlaneGeometry(width, height);
            const material = new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                // color: getColor(),
                map: texture,
            });
            const wallMesh = new THREE.Mesh(geometry, material);

            return wallMesh;
        })
        .catch((error) => {
            console.error("PROBLEM", error);
        });
}

export function createRoom(roomWidth, roomHeight, roomDepth) {
    const roomGroup = new THREE.Group();

    // CREATE A BOX AT ROOM ORIGIN
    const boxGeo = new THREE.BoxGeometry(roomWidth / 10, roomHeight / 10, 0.01);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    // box.position.copy(new THREE.Vector3(0,0,0));
    box.position.set(0, roomHeight / 2, -roomDepth);
    roomGroup.add(box);

    // walls

    createWallMesh(roomWidth, roomDepth).then(function (planeTop) {
        planeTop.position.y = roomHeight;
        planeTop.position.z = -roomDepth / 2;
        planeTop.rotateX(Math.PI / 2);
        roomGroup.add(planeTop);
    });

    createWallMesh(roomWidth, roomDepth).then(function (planeBottom) {
        planeBottom.rotateX(-Math.PI / 2);
        planeBottom.position.z = -roomDepth / 2;
        roomGroup.add(planeBottom);
    });

    createWallMesh(roomWidth, roomHeight).then(function (planeFront) {
        planeFront.position.y = roomWidth / 2;
        planeFront.rotateY(Math.PI);
        // roomGroup.add(planeFront);
    });

    createWallMesh(roomWidth, roomHeight).then(function (planeBack) {
        planeBack.position.z = roomDepth / -1;
        planeBack.position.y = roomHeight / 2;
        roomGroup.add(planeBack);
    });

    createWallMesh(roomDepth, roomHeight).then(function (planeRight) {
        planeRight.position.x = roomWidth / 2;
        planeRight.position.y = roomHeight / 2;
        planeRight.position.z = -roomDepth / 2;
        planeRight.rotateY(-Math.PI / 2);
        roomGroup.add(planeRight);
    });

    createWallMesh(roomDepth, roomHeight).then(function (planeLeft) {
        planeLeft.position.x = roomWidth / -2;
        planeLeft.position.y = roomHeight / 2;
        planeLeft.position.z = -roomDepth / 2;
        planeLeft.rotateY(Math.PI / 2);
        roomGroup.add(planeLeft);
    });

    // lights
    const mainLight = new THREE.PointLight(0xffffff, 1 / 2, 0, 2);
    mainLight.position.set(
        0,
        roomHeight / 2 + roomHeight / 2 - roomHeight / 10,
        -roomDepth / 2
    );
    roomGroup.add(mainLight);
    const sphereSize = roomHeight / 10;

    const otherWhiteLight = new THREE.PointLight(0xcccccc, 1, 0);
    otherWhiteLight.position.set(
        0,
        roomHeight / 2 + roomHeight / 2 - roomHeight / 10,
        roomHeight
    ); //roomHeight instead of depth is intentional: so we can cast light on front face of nearest ornaments
    roomGroup.add(otherWhiteLight);

    if (ENABLE_LIGHT_HELPERS) {
        const pointLightHelper = new THREE.PointLightHelper(
            mainLight,
            sphereSize
        );
        roomGroup.add(pointLightHelper);
        const pointLightHelper2 = new THREE.PointLightHelper(
            otherWhiteLight,
            sphereSize
        );
        roomGroup.add(pointLightHelper2);
    }
    return roomGroup;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomPosition(positionsAlreadySeen, incrementSize, maxSize) {
    const numIncrements = maxSize / incrementSize;
    if (positionsAlreadySeen.indexOf(-1) === -1) {
        positionsAlreadySeen.push(-1);
    }

    let randomPosition = -1;
    const max_count = 50;
    let count = 0;
    while (positionsAlreadySeen.indexOf(randomPosition) !== -1) {
        randomPosition = getRandomInt(numIncrements) * incrementSize;

        count += 1;
        if (count >= max_count) {
            break;
        }
    }

    return randomPosition;
}

export function createRoomWithOrnaments(
    roomWidth,
    roomHeight,
    roomDepth,
    numberOfOrnaments
) {
    const room = createRoom(roomWidth, roomHeight, roomDepth);

    const ornamentSize = (roomWidth / numberOfOrnaments).toFixed(5);
    let xPositionsAlreadySeen = [-1];
    let zPositionsAlreadySeen = [-1];
    let yPositionsAlreadySeen = [-1];

    for (let i = 0; i < numberOfOrnaments; i++) {
        let ornament = createOrnament3(ornamentSize, roomDepth + roomHeight);
        let randX = getRandomPosition(
            xPositionsAlreadySeen,
            ornamentSize,
            numberOfOrnaments * ornamentSize
        );
        xPositionsAlreadySeen.push(randX);
        let randZ = getRandomPosition(
            zPositionsAlreadySeen,
            ornamentSize,
            roomDepth - ornamentSize / 2
        );
        zPositionsAlreadySeen.push(randZ);
        let randY =
            getRandomPosition(
                yPositionsAlreadySeen,
                ornamentSize,
                roomHeight - ornamentSize / 2
            ) +
            ornamentSize / 2;
        yPositionsAlreadySeen.push(randY);

        ornament.position.x = randX - roomWidth / 2 + ornamentSize / 2;
        ornament.position.z = randZ - roomDepth / 2 + ornamentSize / 2; //+ roomHeight;
        ornament.position.y = randY;

        room.add(ornament);
    }

    // create_display_axis().then((y_axis) => {
    //     room.add(y_axis);
    // });
    create_display_axis().then((x_axis) => {
        x_axis.rotateX(-Math.PI / 2);
        x_axis.rotateZ(-Math.PI / 2);
        room.add(x_axis);
    });
    create_display_axis().then((z_axis) => {
        z_axis.rotateX(Math.PI / 2);
        z_axis.rotateY(Math.PI);
        room.add(z_axis);
    });
    create_display_axis("-", 0xff0000).then((z_axis) => {
        z_axis.rotateX(-Math.PI / 2);
        // z_axis.rotateY(Math.PI);
        z_axis.position.y = roomHeight / 15;
        room.add(z_axis);
    });

    return room;
}

function createOrnament(ornamentSize) {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(
        ornamentSize,
        ornamentSize,
        ornamentSize
    );
    const boxMat = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        opacity: Math.random(),
        transparent: true,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = true;
    ornamentGroup.add(box);

    const torusGeo = new THREE.TorusKnotGeometry(
        ornamentSize / 3,
        ornamentSize / 18,
        95,
        20
    );
    const torusMat = new THREE.MeshPhongMaterial({
        color: 0x800010,
        shininess: 100,
        side: THREE.DoubleSide,
    });

    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.castShadow = true;
    torus.position.y = ornamentSize;
    ornamentGroup.add(torus);

    ornamentGroup.position.y += ornamentSize / 2;

    return ornamentGroup;
}

function createOrnament2(ornamentSize, roomDepth) {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.CircleGeometry(ornamentSize / 2, 32);
    const boxMat = new THREE.MeshPhongMaterial({ color: getColor() });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.z = -ornamentSize / 2;
    box.castShadow = true;
    ornamentGroup.add(box);

    const cylinderGeo = new THREE.CylinderGeometry(
        ornamentSize / 20,
        ornamentSize / 20,
        roomDepth
    );
    const cylinderMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.rotateX(Math.PI / 2);
    cylinder.position.z = -roomDepth / 2 - ornamentSize / 2 - ornamentSize / 40;
    ornamentGroup.add(cylinder);

    const torusGeo = new THREE.TorusKnotGeometry(
        ornamentSize / 3,
        ornamentSize / 18,
        95,
        20
    );
    const torusMat = new THREE.MeshPhongMaterial({
        color: 0x800010,
        shininess: 100,
        side: THREE.DoubleSide,
    });

    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.castShadow = true;
    // torus.position.y = ornamentSize/2;
    ornamentGroup.add(torus);

    ornamentGroup.position.y += ornamentSize;

    return ornamentGroup;
}

function createTeapot(ornamentSize) {
    const material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    const geometry = new TeapotGeometry(
        ornamentSize / 5,
        10, //segments
        true, //should bottom be visible
        false, //should lid be removed
        true, //should body be visible
        true, //should lid be fitted (leaving no gaps between lid and body)
        false //Use original "warped" scale
    );

    return new THREE.Mesh(geometry, material);
}

function createOrnament3(ornamentSize, roomDepth) {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.CircleGeometry(ornamentSize / 2, 32);
    const boxMat = new THREE.MeshPhongMaterial({ color: getColor() });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.z = -ornamentSize / 2;
    box.castShadow = true;
    ornamentGroup.add(box);

    const cylinderGeo = new THREE.CylinderGeometry(
        ornamentSize / 20,
        ornamentSize / 20,
        roomDepth
    );
    const cylinderMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.rotateX(Math.PI / 2);
    cylinder.position.z = -roomDepth / 2 - ornamentSize / 2 - ornamentSize / 40;
    ornamentGroup.add(cylinder);

    const teapot = createTeapot(ornamentSize);
    ornamentGroup.add(teapot);

    ornamentGroup.position.y += ornamentSize;

    return ornamentGroup;
}
