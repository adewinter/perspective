let wsocket;

let counter = 0;

const DEBUG = true;

function onMessageEvent(event) {
    counter += 1;
    let data = event.data;
    try {
        let new_position = JSON.parse(data);
        set_new_position_data(new_position);
    } catch (error) {
        console.error("Error parsing data received from websocket/headtracker:", error);
    }

    if (counter % 30 === 0) {
        logReceivedData(event.data);
    }
}

function set_new_position_data(position) {
    window.headPosition = position;
}

export function connect_websocket() {
    console.log('Connecting websocket');
    wsocket = new WebSocket("ws://127.0.0.1:5678/");
    wsocket.addEventListener('message', onMessageEvent);
    wsocket.addEventListener('open', onOpenEvent);
    wsocket.addEventListener('close', onCloseEvent);
}

export function disconnect_websocket() {
    console.log("Disconnecting from Headtracker...");
    wsocket.close();
    wsocket = undefined;
}

export function toggleWebsocketConnection() {
    if(wsocket === undefined) {
        connect_websocket();
    } else {
        disconnect_websocket();
    }
}

function logReceivedData(data) {
    if(DEBUG) {
        console.log('Data received:', data, "Total number of received positions:", counter);
    }
}

function onOpenEvent(event) {
    console.log('Successfully connected to headtracker.');
}

function onCloseEvent(event) {
    console.log('Closed connection to headtracker.');
}



export function init_websocket_client() {
    connect_websocket();
}