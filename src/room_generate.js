import * as THREE from 'three';
const colorList = [0x922606, 0x69E216, 0xEC2EA3, 0x60DCDA, 0xD76A9A, 0x1521DA, 0xDC3146, 0xB69C83, 0x1E670A, 0xE2CC37];

const ENABLE_LIGHT_HELPERS = false;

function getColor() {
    return colorList[Math.floor(Math.random()*colorList.length)];
}

export function createRoom(wallWidth, wallHeight) {

    const roomGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry( wallWidth, wallHeight );
    // walls
    const planeTop = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeTop.position.y = wallHeight;
    planeTop.rotateX( Math.PI / 2 );
    roomGroup.add( planeTop );

    const planeBottom = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBottom.rotateX( - Math.PI / 2 );
    roomGroup.add( planeBottom );

    const planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeFront.position.z = wallHeight/2;
    planeFront.position.y = wallWidth/2;
    planeFront.rotateY( Math.PI );
    roomGroup.add( planeFront );

    const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBack.position.z = wallHeight/-2;
    planeBack.position.y = wallWidth/2;
    roomGroup.add( planeBack );

    const planeRight = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeRight.position.x = wallWidth/2;
    planeRight.position.y = wallWidth/2;
    planeRight.rotateY( - Math.PI / 2 );
    roomGroup.add( planeRight );

    const planeLeft = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeLeft.position.x = wallWidth/-2;
    planeLeft.position.y = wallWidth/2;
    planeLeft.rotateY( Math.PI / 2 );
    roomGroup.add( planeLeft );



    // lights
    const mainLight = new THREE.PointLight( 0xcccccc, wallHeight, 10.0 );
    mainLight.position.set( wallWidth/2-(wallWidth/10), wallHeight/2-(wallHeight/10), wallHeight/2-(wallHeight/10));
    roomGroup.add( mainLight );

    const sphereSize = wallHeight/10;


    const otherWhiteLight = new THREE.PointLight( 0xcccccc, wallHeight, 5.0 );
    otherWhiteLight.position.set( wallWidth/2-(wallWidth/10), wallHeight/2, -wallHeight/2+(wallHeight/10));
    roomGroup.add( otherWhiteLight );

    if(ENABLE_LIGHT_HELPERS) {
        const pointLightHelper = new THREE.PointLightHelper( mainLight, sphereSize );
        roomGroup.add(pointLightHelper);
        const pointLightHelper2 = new THREE.PointLightHelper( otherWhiteLight, sphereSize );
        roomGroup.add(pointLightHelper2);
    }
    // const redLight = new THREE.PointLight( 0xff0000, 0.25, 10.0 );
    // redLight.position.set( -wallWidth+(wallWidth/10), wallHeight/2, 0 );
    // roomGroup.add( redLight );

    // const blueLight = new THREE.PointLight( 0x7f7fff, 0.25, 10.0 );
    // blueLight.position.set( wallWidth-(wallWidth/10), -wallHeight/2, 0 );
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

export function createRoomWithOrnaments(wallWidth, wallHeight, numberOfOrnaments) {
    const room = createRoom(wallWidth, wallHeight);

    // CREATE A FUCKING BOX AT ROOM ORIGIN
    const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const boxMat = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
    const box = new THREE.Mesh( boxGeo, boxMat );

    room.add(box);

    // room.position.x = wallWidth/2;
    // room.position.y = wallHeight/2;
    // room.position.z = wallHeight/2;

    const ornamentSize = (wallWidth/numberOfOrnaments).toFixed(5);

    let xPositionsAlreadySeen = [-1];
    let zPositionsAlreadySeen = [-1];

    for(let i=0; i<numberOfOrnaments; i++) {
        let ornament = createOrnament(ornamentSize);
        let randX = getRandomPosition(xPositionsAlreadySeen, ornamentSize, numberOfOrnaments*ornamentSize);
        xPositionsAlreadySeen.push(randX);
        let randZ = getRandomPosition(zPositionsAlreadySeen, ornamentSize, numberOfOrnaments*ornamentSize);
        zPositionsAlreadySeen.push(randZ);

        

        ornament.position.x = randX - wallWidth/2 + ornamentSize/2;
        ornament.position.z = randZ - wallHeight/2 + ornamentSize/2;

        room.add(ornament);
    }

    return room;

}

// export function addOrnamentToRoom(room, x,y,z) {
//     const ornament = createOrnament();
//         ornament.position.x = x;
//         ornament.position.y = y;
//         ornament.position.z = z;
//     room.add(ornament)
// }

function createOrnament(ornamentSize) {
    const ornamentGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(ornamentSize, ornamentSize, ornamentSize);
    const boxMat = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
    const box = new THREE.Mesh( boxGeo, boxMat );
    box.castShadow = true;
    // box.position.y = 0.5;
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
