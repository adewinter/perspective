import * as THREE from "three";
import Cameras from "./cameras.js";

export default class GenericEnv {
    constructor(renderer, settings) {
        this.settings = settings;
        this.renderer = renderer;
        this.worldWindow = this.createWorldWindow();
        this.setWorldWindowInitialPose();
        this.scene = new THREE.Scene();
        this.scene.add(this.worldWindow);
        this.cameras = new Cameras(settings, this.scene, renderer);
    }

    createWorldWindow() {
        const planeGeo = new THREE.PlaneGeometry(
            this.settings.sceneWindow.width,
            this.settings.sceneWindow.height
        );
        const planeMat = new THREE.MeshBasicMaterial({
            opacity: 0.0,
            transparent: this.settings.sceneWindow.IS_REFMESH_TRANSPARENT,
            wireframe: !this.settings.sceneWindow.IS_REFMESH_TRANSPARENT,
        });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        return planeMesh;
    }

    animateEnvironment() {
        this.cameras.updateCameras();
    }

    onProgressLoad() {}

    onErrorLoad(error) {
        console.error(error);
    }

    generate() {
        return this._generate_environment(1, 1, 1);
    }

    _generate_environment(env_width, env_height, env_depth) {
        this.env_width = env_width;
        this.env_height = env_height;
        this.env_depth = env_depth;
    }

    getInitialPortalPose() {
        // [x, y, z, rotX, rotY, rotZ];
        const x = settings.sceneWindow.x;
        const y = settings.sceneWindow.y;
        const z = settings.sceneWindow.z;
        return [x, y, z, 0, 0, 0];
    }

    setWorldWindowInitialPose() {
        const initialPose = this.getInitialPortalPose();

        //update the settins object in case that's not where
        //the initial pose came from.  This is important
        //because the GUI uses the values in the settings
        //object and the animate() loop polls those same values
        //for refMesh position. So if we just change the position here
        //it'll immediately get overriden on the first animation frame
        //with the values from the settings object.  It's a little
        //goofy potentially, but this way we ensure the ultimate
        //source of truth on worldWindow position is the values
        //in the settings object.
        this.settings.sceneWindow.x = initialPose[0];
        this.settings.sceneWindow.y = initialPose[1];
        this.settings.sceneWindow.z = initialPose[2];

        //actually change the position of the worldWindow in 3d space
        this.worldWindow.position.x = initialPose[0];
        this.worldWindow.position.y = initialPose[1];
        this.worldWindow.position.z = initialPose[2];

        //And rotation, if desired. This value shouldn't change
        //once it's been set here, unless at some future date
        //we decide to animate the window position/pose itself.
        this.worldWindow.rotateX(initialPose[3]);
        this.worldWindow.rotateY(initialPose[4]);
        this.worldWindow.rotateZ(initialPose[5]);
    }
}
