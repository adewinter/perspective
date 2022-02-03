import * as THREE from 'three';
const colorList = [0x922606, 0x69E216, 0xEC2EA3, 0x60DCDA, 0xD76A9A, 0x1521DA, 0xDC3146, 0xB69C83, 0x1E670A, 0xE2CC37];

export function createRoom(wallWidth, wallHeight) {
    function getColor() {
        return colorList[Math.floor(Math.random()*colorList.length)];
    }

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

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomPosition(positionsAlreadySeen, incrementSize, maxSize) {
    if(positionsAlreadySeen.indexOf(-1) === -1) {
        positionsAlreadySeen.push(-1);
    }

    let randomPosition = -1;
    while(positionsAlreadySeen.indexOf(randomPosition) !== -1) {
        randomPosition = getRandomInt(maxSize) * incrementSize;
        ;
    }

    return randomPosition
}

export function createRoomWithOrnaments(wallWidth, wallHeight, numberOfOrnaments) {
    const room = createRoom(wallWidth, wallHeight);
    const ornamentSize = (wallWidth/numberOfOrnaments).toFixed(5);

    let xPositionsAlreadySeen = [-1];
    let yPositionsAlreadySeen = [-1];

    for(let i=0; i<numberOfOrnaments; i++) {
        let ornament = createOrnament(ornamentSize);
        let randX = getRandomPosition(xPositionsAlreadySeen, ornamentSize, numberOfOrnaments*ornamentSize);
        xPositionsAlreadySeen.push(randX);
        let randY = getRandomPosition(yPositionsAlreadySeen, ornamentSize, numberOfOrnaments*ornamentSize);
        yPositionsAlreadySeen.push(randY);

        

        ornament.x = randX;
        ornament.y = randY;

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

    const torusGeo = new THREE.TorusKnotGeometry( ornamentSize, ornamentSize/8, 95, 20 );
    const torusMat = new THREE.MeshPhongMaterial( {
        color: 0x80ee10,
        shininess: 100,
        side: THREE.DoubleSide
    });

    const torus = new THREE.Mesh( torusGeo, torusMat );
    torus.castShadow = true;
    torus.position.y = ornamentSize;
    ornamentGroup.add(torus);

    return ornamentGroup;
}
