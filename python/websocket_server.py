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
        self.counter = 0

    def formatPosition(self, position):
        _position = [x / 100.0 for x in position]

        return {"x": _position[0], "y": _position[1], "z": _position[2]}

    async def send_position(self, websocket, path):
        print("In send_time loop...")
        while True:
            await asyncio.sleep(0.01)  # shoot for approx 60 fps
            now = datetime.datetime.utcnow().isoformat() + "Z"
            position = self.formatPosition(self.face_pose.position)
            raw_position = self.formatPosition(self.face_pose.rawPosition)
            data_to_send = json.dumps({
                "rawPosition": raw_position,
                "position": position
            })
            try:
                await websocket.send(data_to_send)
                if self.counter % 30 == 0:
                    print(f"[{now}] Sent: {data_to_send}")
                self.counter += 1
            except websockets.ConnectionClosed:
                break
