import * as THREE from 'three';
const colorList = [0x922606, 0x69E216, 0xEC2EA3, 0x60DCDA, 0xD76A9A, 0x1521DA, 0xDC3146, 0xB69C83, 0x1E670A, 0xE2CC37];

const ENABLE_LIGHT_HELPERS = false;

function getColor() {
    return colorList[Math.floor(Math.random()*colorList.length)];
}

export function createRoom(roomWidth, roomHeight, roomDepth) {

    const roomGroup = new THREE.Group();
    const planeGeo = new THREE.PlaneGeometry( roomWidth, roomHeight );
    // walls
    const topGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const planeTop = new THREE.Mesh( topGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeTop.position.y = roomHeight;
    planeTop.rotateX( Math.PI / 2 );
    planeTop.position.z = -roomDepth/2;
    roomGroup.add( planeTop );

    const planeBottom = new THREE.Mesh( topGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeBottom.rotateX( - Math.PI / 2 );
    planeBottom.position.z = -roomDepth/2;
    roomGroup.add( planeBottom );

    const planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    // planeFront.position.z = roomHeight/2;
    planeFront.position.y = roomWidth/2;
    planeFront.rotateY( Math.PI );
    roomGroup.add( planeFront );

    const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0x000000 } ) );
    planeBack.position.z = roomDepth/-1;
    planeBack.position.y = roomWidth/2;
    roomGroup.add( planeBack );

    const geoLeftRight = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const planeRight = new THREE.Mesh( geoLeftRight, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeRight.position.x = roomWidth/2;
    planeRight.position.y = roomWidth/2;
    planeRight.rotateY( - Math.PI / 2 );
    planeRight.position.z = -roomDepth/2;
    roomGroup.add( planeRight );

    const planeLeft = new THREE.Mesh( geoLeftRight, new THREE.MeshPhongMaterial( { color: getColor() } ) );
    planeLeft.position.x = roomWidth/-2;
    planeLeft.position.y = roomWidth/2;
    planeLeft.rotateY( Math.PI / 2 );
    planeLeft.position.z = -roomDepth/2;
    roomGroup.add( planeLeft );



    // lights
    const mainLight = new THREE.PointLight( 0xcccccc, roomHeight, 10.0 );
    mainLight.position.set( roomWidth/2-(roomWidth/10), roomHeight/2-(roomHeight/10), roomHeight/2-(roomHeight/10));
    roomGroup.add( mainLight );

    const sphereSize = roomHeight/10;


    const otherWhiteLight = new THREE.PointLight( 0xcccccc, roomHeight, 5.0 );
    otherWhiteLight.position.set( roomWidth/2-(roomWidth/10), roomHeight/2, -roomHeight/2+(roomHeight/10));
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

    // CREATE A FUCKING BOX AT ROOM ORIGIN
    const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const boxMat = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
    const box = new THREE.Mesh( boxGeo, boxMat );
    room.add(box);

    const ornamentSize = (roomWidth/numberOfOrnaments).toFixed(5);

    let xPositionsAlreadySeen = [-1];
    let zPositionsAlreadySeen = [-1];
    let yPositionsAlreadySeen = [-1];

    for(let i=0; i<numberOfOrnaments; i++) {
        let ornament = createOrnament2(ornamentSize, roomDepth+roomHeight);
        let randX = getRandomPosition(xPositionsAlreadySeen, ornamentSize, numberOfOrnaments*ornamentSize);
        xPositionsAlreadySeen.push(randX);
        let randZ = getRandomPosition(zPositionsAlreadySeen, ornamentSize, roomDepth);
        zPositionsAlreadySeen.push(randZ);
        let randY = getRandomPosition(yPositionsAlreadySeen, ornamentSize, roomHeight);
        yPositionsAlreadySeen.push(randY);

        

        ornament.position.x = randX - roomWidth/2 + ornamentSize/2;
        ornament.position.z = randZ - roomDepth + ornamentSize/2 + roomHeight;
        ornament.position.y = randY;

        room.add(ornament);
    }

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
