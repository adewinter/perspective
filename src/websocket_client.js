export default class WebsocketClient {
    constructor(settings, pose) {
        this.settings = settings;
        this.wsocket;
        this.counter = 0;
        this.DEBUG = settings.DEBUG;
        this.pose = pose;
    }

    set_new_position_data(json_data) {
        Object.assign(this.pose, json_data); //merges in new data into existing this.pose object
    }

    onMessageEvent(event) {
        this.counter += 1;
        let data = event.data;
        let parsed_data;
        try {
            parsed_data = JSON.parse(data);
        } catch (error) {
            console.error(
                "Error parsing data received from websocket/headtracker:",
                error
            );
            return;
        }

        this.set_new_position_data(parsed_data);
        if (this.counter % 150 === 0) {
            this.logReceivedData(event.data);
        }
    }

    toggleUseRawPosition() {
        this.settings.headtracking.SHOULD_USE_RAW_POSITION =
            !this.settings.headtracking.SHOULD_USE_RAW_POSITION;
        if (this.DEBUG) {
            console.log(
                "Should use raw position data set to:",
                this.settings.headtracking.SHOULD_USE_RAW_POSITION
            );
        }
    }

    connect_websocket() {
        console.log("Connecting websocket");
        this.wsocket = new WebSocket("ws://127.0.0.1:5678/");
        this.wsocket.addEventListener(
            "message",
            this.onMessageEvent.bind(this)
        );
        this.wsocket.addEventListener("open", this.onOpenEvent.bind(this));
        this.wsocket.addEventListener("close", this.onCloseEvent.bind(this));
    }

    disconnect_websocket() {
        console.log("Disconnecting from Headtracker...");
        this.wsocket.close();
        this.wsocket = undefined;
    }

    toggleWebsocketConnection() {
        if (this.wsocket === undefined) {
            this.connect_websocket();
        } else {
            this.disconnect_websocket();
        }
    }

    logReceivedData(data) {
        if (this.DEBUG) {
            console.log(
                "Data received:",
                data,
                "Total number of received positions:",
                this.counter
            );
        }
    }

    onOpenEvent(event) {
        console.log("Successfully connected to headtracker.");
    }

    onCloseEvent(event) {
        console.log("Closed connection to headtracker.");
    }
}
