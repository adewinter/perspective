import * as THREE from "three";

import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import GenericEnv from "./env_generic.js";
import { create_display_axis } from "./room_generate.js";

export default class PerspectiveEnv extends GenericEnv {
    constructor(renderer, settings) {
        super(renderer, settings);

        this.mixer = undefined;
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath("/libs/draco/gltf/");
        this.loader = new GLTFLoader();
        this.loader.setDRACOLoader(this.dracoLoader);
        this.clock = new THREE.Clock();
    }

    animateEnvironment() {
        super.animateEnvironment();
        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }
    }

    onModelLoad(gltf) {
        this.model = gltf.scene;
        this.model.position.set(1, 1, 0);
        this.model.scale.set(0.1, 0.1, 0.1);
        this.scene.add(this.model);

        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.clipAction(gltf.animations[0]).play();

        create_display_axis().then((x_axis) => {
            x_axis.rotateX(-Math.PI / 2);
            x_axis.rotateZ(-Math.PI / 2);
            this.scene.add(x_axis);
        });
        create_display_axis().then((z_axis) => {
            z_axis.rotateX(Math.PI / 2);
            z_axis.rotateY(Math.PI);
            this.scene.add(z_axis);
        });
        create_display_axis("-", 0xff0000).then((z_axis) => {
            z_axis.rotateX(-Math.PI / 2);
            // z_axis.rotateY(Math.PI);
            // z_axis.position.y = roomHeight / 15;
            this.scene.add(z_axis);
        });
    }

    generate() {
        return this._generate_environment(1, 1, 1);
    }

    _generate_environment(env_width, env_height, env_depth) {
        super._generate_environment(env_width, env_height, env_depth);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.background = new THREE.Color(0xbfe3dd);
        this.scene.environment = pmremGenerator.fromScene(
            new RoomEnvironment(),
            0.04
        ).texture;

        this.loader.load(
            "models/LittlestTokyo.glb",
            this.onModelLoad.bind(this),
            this.onProgressLoad,
            this.onErrorLoad
        );

        return this.scene;
    }

    getInitialPortalPose() {
        // [x, y, z, rotX, rotY, rotZ];
        return [-34, -15, 38.0, 0, -Math.PI / 4, 0]; //-Math.PI / 9, -Math.PI / 8, 0];
    }
}
