import websockets
import datetime
import time
import random
import asyncio
import json
from settings import DEBUG


class ZeromqWebsocketBridge:
    def __init__(self, face_pose):
        print("Initializing websocket server...")
        self.face_pose = face_pose
        self.server = websockets.serve(self.send_position, "127.0.0.1", 5678)
        self.counter = 0
        self.new_time = 0
        self.prev_time = 0
        self.fps = 0

    def formatPosition(self, position):
        _position = [float(x) / 1000.0 for x in position]

        return {"x": _position[0], "y": _position[1], "z": _position[2]}

    async def send_position(self, websocket, path):
        print("Client connected!", websocket)
        while True:
            await asyncio.sleep(1 / 35.0)  # shoot for approx 60 fps
            self.new_time = time.time()
            now = datetime.datetime.utcnow().isoformat() + "Z"
            position = self.formatPosition(self.face_pose.position)
            raw_position = self.formatPosition(self.face_pose.rawPosition)
            data_to_send = json.dumps(
                {"rawPosition": raw_position, "position": position}
            )
            try:
                await websocket.send(data_to_send)
                if self.counter % 30 == 0 and DEBUG:
                    dt = (self.new_time - self.prev_time) / 30
                    self.fps = 1 / dt
                    self.prev_time = self.new_time
                    print(
                        f"[WSB][{now}] FPS: {self.fps} Counter: {self.counter} Position: {position}"
                    )
                self.counter += 1
            except websockets.ConnectionClosed:
                break
