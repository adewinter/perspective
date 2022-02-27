import time

import cv2

from drawer import Drawer
from face_detector import FaceDetector
from image_source import CameraImageSource
from position_calculator import PositionCalculator


class Main:
    def __init__(self):
        self.counter = 0
        self.fpscounter = 0
        self.fps = 0
        self.totalTime = 1
        self.prev_frame_time = 0
        self.new_frame_time = 0
        self.savedata = []

        self.image_source = CameraImageSource()
        self.drawer = Drawer()
        self.face_detector = FaceDetector()
        self.position_calculator = PositionCalculator()

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

    def run(self):
        while True:
            self.drawer.clearFrames()
            self.startFPSMeasure()

            success, image = self.image_source.getImage()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            image_height, image_width, colors = self.drawer.setImage(image)

            detections = self.face_detector.detectFace(image)

            if not detections:
                continue

            for id, detection in enumerate(detections):
                self.drawer.drawFaceAndBoundingBox(detection)

                rawPosition = self.position_calculator.calcPosition(detection, image_height, image_width)
                position = self.position_calculator.smoothPosition(*rawPosition)

                self.drawer.drawTextCoordinates(rawPosition, position)
                self.drawer.drawSparklines(rawPosition[0], position[0])

                eyePoints = self.position_calculator.smoothEyePositions(detection, image_height, image_width)
                self.drawer.drawEyes(eyePoints)

                relativeEyePoints = self.position_calculator.getRelativeEyePosition(detection)
                self.drawer.drawTextEyecoordinates(*relativeEyePoints)

                virt_ipd = self.position_calculator.calcIPD(detection, image_height, image_width)
                self.drawer.drawCalulatedIPDText(virt_ipd)

            self.endFPSMeasure()
            self.drawer.drawFPS(self.fps, self.totalTime)

            self.drawer.showUI()

            if cv2.waitKey(2) & 0xFF == 27:
                break


if __name__ == "__main__":
    main = Main()
    main.run()
    main.close()
