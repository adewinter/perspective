import * as THREE from "three";
import Cameras from "./cameras.js";

export default class GenericEnv {
    constructor(renderer, settings) {
        this.settings = settings;
        this.renderer = renderer;
        this.worldWindow = this.createWorldWindow();

        this.scene = new THREE.Scene();
        this.scene.add(this.worldWindow);
        this.cameras = new Cameras(settings, this.scene, renderer);
    }

    generate() {
        return this._generate_environment(1, 1, 1);
    }

    _generate_environment(env_width, env_height, env_depth) {}

    getInitialPortalPose() {
        // [x, y, z, rotX, rotY, rotZ];
        const x = settings.sceneWindow.x;
        const y = settings.sceneWindow.y;
        const z = settings.sceneWindow.z;
        return [x, y, z, 0, 0, 0];
    }
}
