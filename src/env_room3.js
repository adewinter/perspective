import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import Cameras from "./cameras.js";
import GenericEnv from "./env_generic.js";
import { createRoom } from "./room_generate.js";

const ENV_WIDTH = 25;
const ENV_HEIGHT = 15;
const ENV_DEPTH = 500;

export default class PerspectiveEnv extends GenericEnv {
    constructor(renderer, settings) {
        super(renderer, settings);

        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath("/libs/draco/gltf/");
        this.loader = new GLTFLoader();
        this.loader.setDRACOLoader(this.dracoLoader);
    }

    onModelLoad(gltf) {
        this.model = gltf.scene;
        this.model.position.set(1, 2, -4.5);
        this.model.rotateY(Math.PI / 4);
        this.model.scale.set(0.01, 0.01, 0.01);
        window.foo = this.model;
        this.scene.add(this.model);
    }

    generate() {
        return this._generate_environment(1, 1, 1);
    }

    _generate_environment(env_width, env_height, env_depth) {
        const room = createRoom(ENV_WIDTH, ENV_HEIGHT, ENV_DEPTH);
        // room.position.set(0, -ENV_HEIGHT / 2, 0);
        window.room = room;
        this.scene.add(room);
        super.setWorldWindowInitialPose();

        this.loader.load(
            "models/LittlestTokyo.glb",
            this.onModelLoad.bind(this),
            super.onProgressLoad,
            super.onErrorLoad
        );
    }

    getInitialPortalPose() {
        // [x, y, z, rotX, rotY, rotZ];
        // const x = ENV_WIDTH / 2;
        const x = 0;
        const y = 3;
        console.log("yyyy", y);
        // const y = ENV_HEIGHT / 2;
        const z = this.settings.sceneWindow.z;
        return [x, y, z, 0, 0, 0]; // -Math.PI / 4 + Math.PI / 8, 0, 0];
    }
}
