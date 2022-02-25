const ws = new WebSocket("ws://127.0.0.1:5678/");
ws.onmessage = function (event) {
	console.log("Msg received");
	console.log(event.data);
};