import websockets
import datetime
import random
import asyncio
import json

class WebsocketServer:

    def __init__(self, face_pose):
        print("Initializing websocket server...")
        self.face_pose = face_pose
        self.server = websockets.serve(self.send_position, "127.0.0.1", 5678)

    async def send_position(self, websocket, path):
        print("In send_time loop...")
        while True:
            now = datetime.datetime.utcnow().isoformat() + "Z"
            await websocket.send(json.dumps(self.face_pose.position))
            print(f"Sent {now}, sleeping...")
            await asyncio.sleep(0.01) #shoot for approx 60 fps

