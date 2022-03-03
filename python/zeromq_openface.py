import signal
import sys
import time
import datetime
import asyncio

import zmq

from zeromq_websocket_bridge import ZeromqWebsocketBridge
from settings import DEBUG


class FacePose:
    def __init__(self):
        self.position = (0, 0, 0)
        self.rawPosition = self.position
        self.context = zmq.Context().instance()
        self.socket = self.context.socket(zmq.SUB)
        self.counter = 0
        self.new_time = 0
        self.prev_time = 0
        self.fps = 0

    def set_position(self, new_position):
        self.position = new_position
        self.rawPosition = new_position  # legacy compatibility from before OpenFace

    async def listen_on_zmq(self):
        signal.signal(signal.SIGTERM, self.signal_term_handler)
        signal.signal(signal.SIGINT, self.signal_term_handler)

        port = "5000"

        print("Collecting head pose updates...")

        self.socket.connect("tcp://localhost:%s" % port)
        topic_filter = "HeadPose"
        self.socket.setsockopt_string(zmq.SUBSCRIBE, topic_filter)

        while True:
            self.new_time = time.time()
            self.counter += 1
            out = await asyncio.gather(
                asyncio.to_thread(self.socket.recv), asyncio.sleep(0)
            )
            head_pose = out[0].decode("utf-8")[9:].split(",")
            x, y, z, ud, turn, tilt = head_pose
            self.set_position((x, y, z))
            dt = self.new_time - self.prev_time
            self.fps = 1 / dt
            self.prev_time = self.new_time
            now = datetime.datetime.utcnow().isoformat() + "Z"
            if self.counter % 30 == 0 and DEBUG:
                print(
                    f"[ZMQ][{now}] FPS: {self.fps} x:{x}, y:{y}, z:{z}, ud:{ud}, turn:{turn}, tilt:{tilt}"
                )

            # time.sleep(0.01)

    def signal_term_handler(self, signal, fname):
        self.socket.close()
        sys.exit(0)


def run():
    face_pose = FacePose()
    websocket_server = ZeromqWebsocketBridge(face_pose)
    loop = asyncio.get_event_loop()
    loop.create_task(face_pose.listen_on_zmq())
    loop.run_until_complete(websocket_server.server)
    loop.run_forever()


if __name__ == "__main__":
    run()
