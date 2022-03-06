import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "stats.js";

export default class PerspectiveGUI {
    constructor(settings, websocketClient, cameras) {
        this.settings = settings;
        this.websocketClient = websocketClient;
        this.cameras = cameras;
        this.gui = new GUI();

        const viewFolder = this.gui.addFolder("View");
        viewFolder.open();
        viewFolder
            .add(this, "toggleCamera")
            .name("Swap Between Main and Portal Camera");

        const websocketFolder = this.gui.addFolder("Websocket");
        websocketFolder
            .add(this.websocketClient, "toggleWebsocketConnection")
            .name("Connect/Disconnect Headtracker");
        websocketFolder.open();

        const positionDataFolder = this.gui.addFolder("Position Data");
        positionDataFolder
            .add(this.websocketClient, "toggleUseRawPosition")
            .name("Toggle Raw/Smooth data");
        positionDataFolder.open();

        const perspFolder = this.gui.addFolder("Perspective Camera");
        perspFolder.add(settings.portalCamOffset, "x", -1, 1.0, 0.01);
        perspFolder.add(settings.portalCamOffset, "y", -1, 1.0, 0.01);
        perspFolder.add(settings.portalCamOffset, "z", -1, 1.0, 0.01);
        perspFolder
            .add(this.cameras, "togglePortalCameraHelper")
            .name("Toggle Camera Helper");

        const frustumFolder = perspFolder.addFolder("Frustum");
        window.cameras = cameras;
        frustumFolder
            .add(cameras.portalCamera, "near", 0.00001, 1.0, 0.001)
            .onChange(this.cameras.updatePortalCameraHelper.bind(cameras));
        frustumFolder
            .add(cameras.portalCamera, "far", 0.1, 20, 0.1)
            .onChange(this.cameras.updatePortalCameraHelper.bind(cameras));
        frustumFolder
            .add(cameras.portalCamera, "fov", 1, 180, 1)
            .onChange(this.cameras.updatePortalCameraHelper.bind(cameras));
        frustumFolder
            .add(cameras.portalCamera, "aspect", 0.1, 4, 0.1)
            .onChange(this.cameras.updatePortalCameraHelper.bind(cameras));
        perspFolder.open();

        const perspScaleFolder = perspFolder.addFolder(
            "Movement scaling multipliers"
        );
        perspScaleFolder.add(settings.portalCamOffset, "scaleX", -3, 3);
        perspScaleFolder.add(settings.portalCamOffset, "scaleY", -3, 3);
        perspScaleFolder.add(settings.portalCamOffset, "scaleZ", -3, 3);
        perspScaleFolder.open();

        const sceneWindowFolder = this.gui.addFolder("Scene Window Dimensions");
        sceneWindowFolder.add(settings.sceneWindow, "IS_REFMESH_TRANSPARENT");
        sceneWindowFolder.add(settings.sceneWindow, "width", 0, 3.1);
        sceneWindowFolder.add(settings.sceneWindow, "height", 0, 3.1);
        sceneWindowFolder.add(settings.sceneWindow, "x", -5, 5, 0.1);
        sceneWindowFolder.add(settings.sceneWindow, "y", -5, 5, 0.1);
        sceneWindowFolder.add(settings.sceneWindow, "z", -5, 5, 0.1);
        sceneWindowFolder.open();

        this.stats = this.createStats();
    }

    toggleCamera() {
        this.settings.USE_MAIN_CAMERA_FOR_VIEW =
            !this.settings.USE_MAIN_CAMERA_FOR_VIEW;
    }

    createStats() {
        const stats = new Stats();
        stats.dom.id = "fps-stats";
        document.getElementById("3dviewcontainer").appendChild(stats.dom);
        return stats;
    }

    updateStats() {
        this.stats.update();
    }
}
