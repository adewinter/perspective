from collections import deque
import random

import cv2
import cvui
import mediapipe as mp
import numpy as np

from settings import DEBUG


class Drawer:
    """
    Responsible for rendering the image from the ImageSource, FaceDetection details, other data, etc
    """

    def __init__(self):
        self.mp_drawing = mp.solutions.drawing_utils
        self.sparkline_data_q1 = deque([0] * 100, 100)
        self.sparkline_data_q2 = deque([0] * 100, 100)

        self.CVUI_WINDOW_NAME = "CVUI"
        self.CVUI_FRAME = np.zeros((200, 600, 3), np.uint8)
        cvui.init(self.CVUI_WINDOW_NAME)

    def clearFrames(self):
        self.CVUI_FRAME[:] = (49, 52, 49)

    def setImage(self, image):
        self.image = image
        return image.shape

    def showUI(self):
        cv2.imshow("Face Detection", self.image)
        cvui.imshow(self.CVUI_WINDOW_NAME, self.CVUI_FRAME)

    def drawFaceAndBoundingBox(self, detection):
        self.mp_drawing.draw_detection(self.image, detection)

    def drawTextCoordinates(self, coords1, coords2):
        stringToRender = f"X: {coords1[0]:.2f}, Y:{coords1[1]:.2f}, Z:{coords1[2]:.2f}"
        textPosition = (5, 5)
        fontSize = 0.4

        cvui.text(
            self.CVUI_FRAME,
            *textPosition,
            stringToRender,
            fontSize,
        )

        stringToRender = f"X: {coords2[0]:.2f}, Y:{coords2[1]:.2f}, Z:{coords2[2]:.2f}"
        textPosition = (5, 20)
        fontSize = 0.4

        cvui.text(self.CVUI_FRAME, *textPosition, stringToRender, fontSize, 0x00FF00)

    def drawTextEyecoordinates(self, left_eye, right_eye):
        stringToRender = f"Left Eye Rel - X: {left_eye.x:.2f}, Y:{left_eye.y:.2f}"
        textPosition = (5, 50)
        fontSize = 0.4

        cvui.text(
            self.CVUI_FRAME,
            *textPosition,
            stringToRender,
            fontSize,
        )

        stringToRender = f"Right Eye Rel - X: {right_eye.x:.2f}, Y:{right_eye.y:.2f}"
        textPosition = (5, 65)
        fontSize = 0.4

        cvui.text(
            self.CVUI_FRAME,
            *textPosition,
            stringToRender,
            fontSize,
        )

    def drawEyes(self, eyePoints):
        eye_radius = 5  # px

        cv2.circle(self.image, eyePoints[0], eye_radius, (255, 255, 255), 1)
        cv2.circle(self.image, eyePoints[1], eye_radius, (255, 255, 255), 1)

    def drawSparklines(self, dataPoint1, dataPoint2):
        if DEBUG:
            dataPoint1 += random.random()
            dataPoint2 += random.random()
        self.sparkline_data_q1.append(dataPoint1)
        self.sparkline_data_q2.append(dataPoint2)

        cvui.sparkline(
            self.CVUI_FRAME, self.sparkline_data_q1, 0, 0, 600, 200, 0xFFFFFF
        )
        cvui.sparkline(
            self.CVUI_FRAME, self.sparkline_data_q2, 0, 0, 600, 200, 0x00FF00
        )

    def drawCalulatedIPDText(self, virt_ipd):
        stringToRender = f"ipd:{virt_ipd:.1f}px"
        textPosition = (5, 35)
        fontSize = 0.4

        cvui.text(
            self.CVUI_FRAME,
            *textPosition,
            stringToRender,
            fontSize,
        )

    def drawFPS(self, fps, timePerFrame):
        cv2.putText(
            self.image,
            f"FPS: {int(fps)}, {timePerFrame:.3f}s",
            (10, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 255, 0),
            2,
        )
