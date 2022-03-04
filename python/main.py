import os

os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"

import asyncio
import time
import sys

import cv2
import websockets

from drawer import Drawer
from face_detector import FaceDetector
from image_source import CameraImageSource, FakeCameraSource
from position_calculator import PositionCalculator
from websocket_server import WebsocketServer

from settings import DEBUG, CAPTURE_POSITION_DATA_FOR_ANALYSIS


class FacePose:
    def __init__(self):
        self.counter = 0
        self.fpscounter = 0
        self.fps = 0
        self.totalTime = 1
        self.prev_frame_time = 0
        self.new_frame_time = 0
        self.savedata = []
        self.rawPosition = (0, 0, 0)
        self.position = (0, 0, 0)

        # if DEBUG:
        #     self.image_source = FakeCameraSource()
        # else:
        #     self.image_source = CameraImageSource()
        self.image_source = CameraImageSource()
        self.drawer = Drawer()
        self.face_detector = FaceDetector()
        self.position_calculator = PositionCalculator()
        self.data_for_file = []

    def startFPSMeasure(self):
        self.new_frame_time = time.time()
        self.counter += 1
        self.fpscounter += 1

    def endFPSMeasure(self):
        if self.fpscounter % 10 == 0:
            self.totalTime = self.new_frame_time - self.prev_frame_time
            self.prev_frame_time = self.new_frame_time
            self.fps = 10 / (self.totalTime)
            self.fpscounter = 0

    def close(self):
        self.image_source.close()

    def calculate_and_update_position(self, detection, image_height, image_width):
        self.rawPosition = self.position_calculator.calcPosition(
            detection, image_height, image_width
        )
        self.position = self.position_calculator.smoothPosition(*self.rawPosition)

    def draw_detection_data(self, detection, image_height, image_width):
        self.drawer.drawFaceAndBoundingBox(detection)

        self.drawer.drawTextCoordinates(self.rawPosition, self.position)
        self.drawer.drawSparklines(self.rawPosition[0], self.position[0])

        if CAPTURE_POSITION_DATA_FOR_ANALYSIS:
            if self.counter < 300:
                self.data_for_file.append(f"{self.rawPosition[0]}\n")
            else:
                with open("data.txt", "w") as f:
                    f.writelines(self.data_for_file)
                sys.exit(0)

        eyePoints = self.position_calculator.smoothEyePositions(
            detection, image_height, image_width
        )
        self.drawer.drawEyes(eyePoints)

        relativeEyePoints = self.position_calculator.getRelativeEyePosition(detection)
        self.drawer.drawTextEyecoordinates(*relativeEyePoints)

        virt_ipd = self.position_calculator.calcIPD(
            detection, image_height, image_width
        )
        self.drawer.drawCalulatedIPDText(virt_ipd)

    async def run_face_detector(self):
        while True:
            self.drawer.clearFrames()
            self.startFPSMeasure()

            out = await asyncio.gather(self.image_source.getImage(), asyncio.sleep(0))
            success, image = out[0]
            if not success:
                print("Ignoring empty camera frame.")
                continue

            image_height, image_width, colors = self.drawer.setImage(image)

            detections = self.face_detector.detectFace(image)

            if not detections:
                continue

            for id, detection in enumerate(detections):
                self.calculate_and_update_position(detection, image_height, image_width)
                self.draw_detection_data(detection, image_height, image_width)

            self.endFPSMeasure()
            self.drawer.drawFPS(self.fps, self.totalTime)

            self.drawer.showUI()

            if cv2.waitKey(1) & 0xFF == 27:
                break


if __name__ == "__main__":
    print("In __main__")
    face_pose = FacePose()
    websocket_server = WebsocketServer(face_pose)

    loop = asyncio.get_event_loop()

    loop.create_task(face_pose.run_face_detector())
    loop.run_until_complete(websocket_server.server)
    loop.run_forever()

    face_pose.close()
