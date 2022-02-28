import websockets
import datetime
import random

class WebsocketServer:

    def __init__(self):
        print("Initializing websocket server...")
        self.server = websockets.serve(self.send_time, "127.0.0.1", 5678)

    async def send_time(self, websocket, path):
        print("In send_time loop...")
        while True:
            now = datetime.datetime.utcnow().isoformat() + "Z"
            await websocket.send(now)
            print(f"Sent {now}, sleeping...")
            await asyncio.sleep(random.random() * 3)

