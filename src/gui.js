import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "stats.js";

export default class PerspectiveGUI {
    constructor(settings, websocketClient) {
        this.settings = settings;
        this.gui = new GUI();

        const viewFolder = this.gui.addFolder("View");
        viewFolder.open();
        viewFolder
            .add(this, "toggleCamera")
            .name("Swap Between Main and Portal Camera");

        const websocketFolder = this.gui.addFolder("Websocket");
        websocketFolder
            .add(websocketClient, "toggleWebsocketConnection")
            .name("Connect/Disconnect Headtracker");
        websocketFolder.open();

        const positionDataFolder = this.gui.addFolder("Position Data");
        positionDataFolder
            .add(websocketClient, "toggleUseRawPosition")
            .name("Toggle Raw/Smooth data");
        positionDataFolder.open();

        const perspFolder = this.gui.addFolder("Perspective Camera");
        perspFolder.add(settings.portalCamOffset, "lockX");
        perspFolder.add(settings.portalCamOffset, "lockY");
        perspFolder.add(settings.portalCamOffset, "lockZ");
        perspFolder.add(settings.portalCamOffset, "x", -3.1, 3);
        perspFolder.add(settings.portalCamOffset, "y", -3.1, 3);
        perspFolder.add(settings.portalCamOffset, "z", -3.1, 3);
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
        sceneWindowFolder.add(settings.sceneWindow, "x", -2, 2.0);
        sceneWindowFolder.add(settings.sceneWindow, "y", -2, 2.0);
        sceneWindowFolder.add(settings.sceneWindow, "z", -2, 2.0);
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
