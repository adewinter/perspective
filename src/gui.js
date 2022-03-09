import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "stats.js";

export default class PerspectiveGUI {
    constructor(settings, websocketClient) {
        this.settings = settings;
        this.websocketClient = websocketClient;
        this.gui = new GUI();

        const sceneFolder = this.gui.addFolder("Environment");
        sceneFolder.add(this, "cycleEnvironment").name("Go to next Scene");

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
        positionDataFolder.close();

        const perspFolder = this.gui.addFolder("Perspective Camera");
        perspFolder.add(settings.portalCamOffset, "x", -1, 1.0, 0.01);
        perspFolder.add(settings.portalCamOffset, "y", -1, 1.0, 0.01);
        perspFolder.add(settings.portalCamOffset, "z", -1, 1.0, 0.01);
        perspFolder
            .add(settings, "USE_PORTAL_CAMERA_HELPER")
            .name("Should Use Portal Camera Helper");

        perspFolder.close();

        const perspScaleFolder = perspFolder.addFolder(
            "Movement scaling multipliers"
        );
        perspScaleFolder.add(settings.portalCamOffset, "scaleX", -3, 3);
        perspScaleFolder.add(settings.portalCamOffset, "scaleY", -3, 3);
        perspScaleFolder.add(settings.portalCamOffset, "scaleZ", -3, 3);
        perspScaleFolder.close();

        const sceneWindowFolder = this.gui.addFolder("Scene Window Dimensions");
        sceneWindowFolder.add(settings.sceneWindow, "IS_REFMESH_TRANSPARENT");
        sceneWindowFolder.add(settings.sceneWindow, "width", 0, 3.1);
        sceneWindowFolder.add(settings.sceneWindow, "height", 0, 3.1);
        sceneWindowFolder.add(settings.sceneWindow, "x", -35, 35, 0.1);
        sceneWindowFolder.add(settings.sceneWindow, "y", -35, 35, 0.1);
        sceneWindowFolder.add(settings.sceneWindow, "z", -35, 35, 0.1);
        sceneWindowFolder.close();

        this.stats = this.createStats();
    }

    cycleEnvironment() {
        const availableEnvs = this.settings.environment.available_environments;
        const availableEnvsList = Object.keys(availableEnvs);
        const availableEnvsListLength = availableEnvsList.length;

        const currentEnv = this.settings.environment.current_environment;
        const currentEnvIndex = availableEnvsList.indexOf(currentEnv);

        const nextEnvIndex = (currentEnvIndex + 1) % availableEnvsListLength;
        const nextEnv = availableEnvsList[nextEnvIndex];

        this.settings.environment.current_environment = nextEnv;
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
