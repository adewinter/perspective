import * as THREE from "three";

import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import GenericEnv from "./env_generic.js";

export default class PerspectiveEnv extends GenericEnv {
    constructor(renderer) {
        super(renderer);
        this.mixer = undefined;
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath("/libs/draco/gltf/");
        this.scene = new THREE.Scene();
        this.loader = new GLTFLoader();
        this.loader.setDRACOLoader(this.dracoLoader);
        this.clock = new THREE.Clock();
    }

    animateEnvironment() {
        super.animateEnvironment();
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }

    onModelLoad(gltf) {
        this.model = gltf.scene;
        this.model.position.set(1, 1, 0);
        this.model.scale.set(0.01, 0.01, 0.01);
        this.scene.add(this.model);

        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.clipAction(gltf.animations[0]).play();
    }

    generate_environment(env_width, env_height, env_depth) {
        super.generate_environment(env_width, env_height, env_depth);
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
}
