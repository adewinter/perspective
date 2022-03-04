import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FlyControls } from "three/examples/jsm/controls/FlyControls.js";

export default class Cameras {
    constructor(settings, scene, renderer) {
        this.settings = settings;
        this.scene = scene;
        this.renderer = renderer;

        this.portalCamPosXEl = document.querySelector("#posxPortalCam pre");
        this.portalCamPosYEl = document.querySelector("#posyPortalCam pre");
        this.portalCamPosZEl = document.querySelector("#poszPortalCam pre");
        this.cameraControls;
        this.clock = new THREE.Clock();

        this.createCameras();
        this.setupMainCameraControls();
    }

    createCameras() {
        this.mainCamera = new THREE.PerspectiveCamera(
            45,
            this.settings.rendererWidth / this.settings.rendererHeight,
            0.01,
            100
        );
        this.portalCamera = new THREE.PerspectiveCamera(
            45,
            this.settings.sceneWindowWidthInitial /
                this.settings.sceneWindowHeightInitial,
            0.1,
            10.0
        );

        this.mainCamera.position.set(-3, 3, 3.0);
        this.mainCamera.lookAt(this.portalCamera.position);
        this.scene.add(this.mainCamera);

        this.scene.add(this.portalCamera);

        if (this.settings.USE_PORTAL_CAMERA_HELPER) {
            this.portalCameraHelper = new THREE.CameraHelper(this.portalCamera);
            window.portalCameraHelper = this.portalCameraHelper;
            this.scene.add(this.portalCameraHelper);
        }
    }

    togglePortalCameraHelper() {
        if (this.portalCameraHelper !== undefined) {
            this.portalCameraHelper.geometry.dispose();
            this.scene.remove(this.portalCameraHelper);
            this.portalCameraHelper = undefined;
        } else {
            this.portalCameraHelper = new THREE.CameraHelper(this.portalCamera);
            window.portalCameraHelper = this.portalCameraHelper;
            this.scene.add(this.portalCameraHelper);
        }
    }

    updatePortalCameraHelper() {
        //sorry for the hack job.
        this.togglePortalCameraHelper();
        this.togglePortalCameraHelper();
    }

    setupMainCameraControls() {
        this.cameraControls = new FlyControls(
            this.mainCamera,
            this.renderer.domElement
        );
        this.cameraControls.movementSpeed = 5;
        this.cameraControls.domElement = this.renderer.domElement;
        this.cameraControls.rollSpeed = Math.PI / 2;
        this.cameraControls.autoForward = false;
        this.cameraControls.dragToLook = true;
    }

    updateUIWithCameraPositions() {
        this.portalCamPosXEl.innerText =
            this.portalCamera.position.x.toFixed(4);
        this.portalCamPosYEl.innerText =
            this.portalCamera.position.y.toFixed(4);
        this.portalCamPosZEl.innerText =
            this.portalCamera.position.z.toFixed(4);
    }

    updateControls() {
        const delta = this.clock.getDelta();
        this.cameraControls.update(delta);
    }
}
