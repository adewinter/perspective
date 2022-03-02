import * as THREE from 'three';
import { FontLoader  } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry   } from 'three/examples/jsm/geometries/TextGeometry.js';
const colorList = [0x922606, 0x69E216, 0xEC2EA3, 0x60DCDA, 0xD76A9A, 0x1521DA, 0xDC3146, 0xB69C83, 0x1E670A, 0xE2CC37];

const ENABLE_LIGHT_HELPERS = false;

const loader = new FontLoader();
const font_path = '/helvetiker.typeface.json';

let font;


const TEXT_SIZE = 0.02;

// myFunction wraps the above API call into a Promise
// and handles the callbacks with resolve and reject
function loadFontFunctionWrapper() {
    return new Promise((resolve, reject) => {
        loader.load( font_path, (font_data) => {
            console.log(font_data);
            font = font_data;
            resolve(font_data);
        });
    });
}

function createText(textString, prefix, materials) {
    const textToRender = prefix ? prefix + textString + "" : textString + "";
    // console.log("Rednering", textString);
    const textGeometry = new TextGeometry(textToRender, {
        font: font,
        size: TEXT_SIZE,
        height: 0.005,
        curveSegments: 12,
        bevelEnabled: false,
        bevelThickness: 0.01,
        bevelSize: 0.08,
        bevelOffset: 0,
        bevelSegments: 5
    });

    textGeometry.computeBoundingBox();
    const textMesh = new THREE.Mesh(textGeometry, materials);
    // textMesh.scale.set(0.05,0.05,0.05);
    return textMesh;
}



function getColor() {
    return colorList[Math.floor(Math.random()*colorList.length)];
}

function create_dashed_line(x0, y0, z0, x1, y1, z1, dashSize, gapSize) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: dashSize, gapSize: gapSize } );
    // const material = new THREE.LineDashedMaterial( { color: 0xffffff,
    //     linewidth:10} );

    const positions = [x0, y0, z0, x1, y1, z1];
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    const line = new THREE.LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
}

function create_marker(markerLength) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
    const positions = [0,0,0,markerLength,0,0];
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    const line = new THREE.LineSegments(geometry, material);
    line.computeLineDistances();
    return line;
}

async function create_display_axis(prefix, textColor) {
    const axisLength = 20;
    const markerLength = 0.1;
    const markerInterval = 0.5;
    const numMarkers = axisLength/markerInterval;


    const markers = new THREE.Group();


    console.log("Loading fonts...", new Date());
    await loadFontFunctionWrapper();
    console.log("Font loaded.", new Date());
    console.log("TEXTCOLOR:", textColor);
    console.log("PREFIX", prefix);
    const font_materials = [
        new THREE.MeshPhongMaterial( { color: textColor ? textColor : 0xffffff, flatShading: true, emissive: 0x000000, specular: 0x111111, shininess:30 } ), // front
        new THREE.MeshPhongMaterial( { color: textColor ? textColor : 0xffffff } ) // side
    ];

    for (let i = 0; i<(numMarkers - 1); i++) {
        let marker = create_marker(markerLength);
        marker.position.x = -markerLength/3;
        marker.position.y = (markerInterval * i);
        markers.add(marker)


        let text = createText((markerInterval * i)+"m", prefix, font_materials);
        text.rotateX(Math.PI/2);
        text.position.x = markerLength/2 + markerLength/5;
        text.position.y = (markerInterval * i) - TEXT_SIZE/2;
        markers.add(text)

    }

    const axisGroup = new THREE.Group();

    const dashed_line = create_dashed_line(0,0,0, 0,20,0, 0.09, 0.01);
    axisGroup.add(dashed_line);
    axisGroup.add(markers);

    return axisGroup;
}

export function createRoom(roomWidth, roomHeight, roomDepth) {
    const roomGroup = new THREE.Group();

    // CREATE A FUCKING BOX AT ROOM ORIGIN
    // const boxGeo = new THREE.BoxGeometry(roomWidth, roomHeight, 0.05);
    // const boxMat = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
    // const box = new THREE.Mesh( boxGeo, boxMat );
    // // box.position.copy(new THREE.Vector3(0,0,0));
    // box.position.set(0,0,0);
    // roomGroup.add(box);

    



    const planeGeo = new THREE.PlaneGeometry( roomWidth, roomHeight );
    // walls
    const topGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const planeTop = new THREE.Mesh( topGeo, new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: getColor() } ) );
    planeTop.position.y = roomHeight;
    planeTop.position.z = -roomDepth/2;
    planeTop.rotateX( Math.PI / 2 );
    roomGroup.add( planeTop );

    const planeBottom = new THREE.Mesh( topGeo, new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: getColor() } ) );
    planeBottom.rotateX( - Math.PI / 2 );
    planeBottom.position.z = -roomDepth/2;
    roomGroup.add( planeBottom );

    const planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    // planeFront.position.z = roomHeight/2;
    planeFront.position.y = roomWidth/2;
    planeFront.rotateY( Math.PI );
    roomGroup.add( planeFront );

    const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: 0x000000 } ) );
    planeBack.position.z = roomDepth/-1;
    planeBack.position.y = roomHeight/2;
    roomGroup.add( planeBack );

    const geoLeftRight = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const planeRight = new THREE.Mesh( geoLeftRight, new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, color: getColor() } ) );
    planeRight.position.x = roomWidth/2;
    planeRight.position.y = roomHeight/2;
    planeRight.position.z = -roomDepth/2;
    planeRight.rotateY( - Math.PI / 2 );
    roomGroup.add( planeRight );

    const planeLeft = new THREE.Mesh( geoLeftRight, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeLeft.position.x = roomWidth/-2;
    planeLeft.position.y = roomHeight/2;
    planeLeft.position.z = -roomDepth/2;
    planeLeft.rotateY( Math.PI / 2 );
    roomGroup.add( planeLeft );

    
    // lights
    const mainLight = new THREE.PointLight( 0xffffff, 1/2, 0, 2 );
    mainLight.position.set( 0, (roomHeight/2) + roomHeight/2 - (roomHeight/10), -roomDepth/2);
    roomGroup.add( mainLight );
    const sphereSize = roomHeight/10;


    const otherWhiteLight = new THREE.PointLight( 0xcccccc, 0.7, 0 );
    otherWhiteLight.position.set( 0, (roomHeight/2) + roomHeight/2 - (roomHeight/10), roomHeight); //roomHeight instead of depth is intentional: so we can cast light on front face of nearest ornaments
    roomGroup.add( otherWhiteLight );

    if(ENABLE_LIGHT_HELPERS) {
        const pointLightHelper = new THREE.PointLightHelper( mainLight, sphereSize );
        roomGroup.add(pointLightHelper);
        const pointLightHelper2 = new THREE.PointLightHelper( otherWhiteLight, sphereSize );
        roomGroup.add(pointLightHelper2);
    }
    // const redLight = new THREE.PointLight( 0xff0000, 0.25, 10.0 );
    // redLight.position.set( -roomWidth+(roomWidth/10), roomHeight/2, 0 );
    // roomGroup.add( redLight );

    // const blueLight = new THREE.PointLight( 0x7f7fff, 0.25, 10.0 );
    // blueLight.position.set( roomWidth-(roomWidth/10), -roomHeight/2, 0 );
    // roomGroup.add( blueLight );

    // scene.add(roomGroup);
    return roomGroup;
    
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomPosition(positionsAlreadySeen, incrementSize, maxSize) {
    const numIncrements = maxSize/incrementSize;
    if(positionsAlreadySeen.indexOf(-1) === -1) {
        positionsAlreadySeen.push(-1);
    }

    let randomPosition = -1;
    const max_count = 50;
    let count = 0;
    while(positionsAlreadySeen.indexOf(randomPosition) !== -1) {
        randomPosition = getRandomInt(numIncrements) * incrementSize;
        
        count += 1;
        if(count >= max_count) {
            break;
        }
    }

    return randomPosition
}

export function createRoomWithOrnaments(roomWidth, roomHeight, roomDepth, numberOfOrnaments) {
    const room = createRoom(roomWidth, roomHeight, roomDepth);

    

    const ornamentSize = (roomWidth/numberOfOrnaments).toFixed(5);

    let xPositionsAlreadySeen = [-1];
    let zPositionsAlreadySeen = [-1];
    let yPositionsAlreadySeen = [-1];

    for(let i=0; i<numberOfOrnaments; i++) {
        let ornament = createOrnament2(ornamentSize, roomDepth+roomHeight);
        let randX = getRandomPosition(xPositionsAlreadySeen, ornamentSize, numberOfOrnaments*ornamentSize);
        xPositionsAlreadySeen.push(randX);
        let randZ = getRandomPosition(zPositionsAlreadySeen, ornamentSize, roomDepth-(ornamentSize/2));
        zPositionsAlreadySeen.push(randZ);
        let randY = getRandomPosition(yPositionsAlreadySeen, ornamentSize, roomHeight-(ornamentSize/2)) + ornamentSize/2;
        yPositionsAlreadySeen.push(randY);

        

        ornament.position.x = randX - roomWidth/2 + ornamentSize/2;
        ornament.position.z = randZ - roomDepth + ornamentSize/2 + roomHeight;
        ornament.position.y = randY;

        room.add(ornament);
    }

    create_display_axis().then((y_axis) => { room.add(y_axis)});
    create_display_axis().then((x_axis) => {
        x_axis.rotateX(-Math.PI/2);
        x_axis.rotateZ(-Math.PI/2);
        room.add(x_axis);
    });
    create_display_axis().then((z_axis) => {
        z_axis.rotateX(Math.PI/2);
        z_axis.rotateY(Math.PI);
        room.add(z_axis);
    });
    create_display_axis("-", 0xff0000).then((z_axis) => {
        z_axis.rotateX(-Math.PI/2);
        // z_axis.rotateY(Math.PI);
        z_axis.position.y = roomHeight/15;
        room.add(z_axis);
    });


    return room;

}


function createOrnament(ornamentSize) {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(ornamentSize, ornamentSize, ornamentSize);
    const boxMat = new THREE.MeshPhongMaterial( { color: 0x00ff00 , opacity: Math.random(), transparent: true} );
    const box = new THREE.Mesh( boxGeo, boxMat );
    box.castShadow = true;
    ornamentGroup.add(box);

    const torusGeo = new THREE.TorusKnotGeometry( ornamentSize/3, ornamentSize/18, 95, 20 );
    const torusMat = new THREE.MeshPhongMaterial( {
        color: 0x800010,
        shininess: 100,
        side: THREE.DoubleSide
    });

    const torus = new THREE.Mesh( torusGeo, torusMat );
    torus.castShadow = true;
    torus.position.y = ornamentSize;
    ornamentGroup.add(torus);

    ornamentGroup.position.y += ornamentSize/2;

    return ornamentGroup;
}

function createOrnament2(ornamentSize, roomDepth) {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.CircleGeometry(ornamentSize/2,32);
    const boxMat = new THREE.MeshPhongMaterial( { color: getColor() } );
    const box = new THREE.Mesh( boxGeo, boxMat );
    box.position.z = -ornamentSize/2
    box.castShadow = true;
    ornamentGroup.add(box);

    const cylinderGeo = new THREE.CylinderGeometry(ornamentSize/20, ornamentSize/20, roomDepth)
    const cylinderMat = new THREE.MeshPhongMaterial( { color: 0xffffff } );
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.rotateX(Math.PI/2);
    cylinder.position.z = -roomDepth/2 -ornamentSize/2 - ornamentSize/40;
    ornamentGroup.add(cylinder);

    const torusGeo = new THREE.TorusKnotGeometry( ornamentSize/3, ornamentSize/18, 95, 20 );
    const torusMat = new THREE.MeshPhongMaterial( {
        color: 0x800010,
        shininess: 100,
        side: THREE.DoubleSide
    });

    const torus = new THREE.Mesh( torusGeo, torusMat );
    torus.castShadow = true;
    // torus.position.y = ornamentSize/2;
    ornamentGroup.add(torus);

    ornamentGroup.position.y += ornamentSize;

    return ornamentGroup;
}
