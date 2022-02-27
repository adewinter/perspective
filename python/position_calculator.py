from collections import deque
from statistics import mean
from collections import deque
import math

import numpy as np


class PositionCalculator:
    LEFT_EYE_INDEX = 0
    RIGHT_EYE_INDEX = 1
    REAL_IPD = 6.5  # cm. Physical distance between my pupils

    RELATIVE_EYE_POSITION_OFFSET = -0.5 # This is to ensure that relative coords origin is at center of image instead of top-left.

    def __init__(self):
        self.xPositionQueue = deque([0] * 3, 3)
        self.yPositionQueue = deque([0] * 3, 3)
        self.zPositionQueue = deque([0] * 3, 3)

        self.leftEyeXQueue = deque([], 3)
        self.leftEyeYQueue = deque([], 3)
        self.rightEyeXQueue = deque([], 3)
        self.rightEyeYQueue = deque([], 3)

        self.allSmoothQs = [
            self.leftEyeXQueue,
            self.leftEyeYQueue,
            self.rightEyeXQueue,
            self.rightEyeYQueue,
        ]

    def convertBoundingBoxWidthToDistance(self, width):  # distance in CM!
        CENTIMETERS_PER_INCH = 2.54
        a, b, c, d = -0.000003372072338, 0.002878979776, -0.8792663751, 114.0018076
        distance = a * pow(width, 3) + b * pow(width, 2) + c * width + d
        return distance * CENTIMETERS_PER_INCH

    def calcIPD(self, detection, image_height, image_width):
        "calcs virtual IPD.  Real IPD is 13.5cm"
        if not detection or not detection.location_data:
            return -1

        left_pt = detection.location_data.relative_keypoints[self.LEFT_EYE_INDEX]
        right_pt = detection.location_data.relative_keypoints[self.RIGHT_EYE_INDEX]

        xdistsq = pow(left_pt.x * image_width - right_pt.x * image_width, 2)
        ydistsq = pow(left_pt.y * image_height - right_pt.y * image_height, 2)

        dist = math.sqrt(xdistsq + ydistsq)
        return math.floor(dist)

    def calcXYPosition(self, detection, image_height, image_width, virt_ipd):
        """
        Calcs the real world X and Y coordinates of the point located mid way between eyes
        Does not account for "fish-eye" effect of camera lens. There will be more error the further away
        we move from the center of the image.
        """

        left_eye_pt, right_eye_pt = self.getRelativeEyePosition(detection)

        mid_x = left_eye_pt.x + abs(right_eye_pt.x - left_eye_pt.x) // 2
        mid_y = left_eye_pt.y + abs(right_eye_pt.y - left_eye_pt.y) // 2

        mid_x_px = mid_x * image_width
        mid_y_px = mid_y * image_height

        cm_per_px = self.REAL_IPD / virt_ipd

        return mid_x_px * cm_per_px, mid_y_px * cm_per_px

    def calcPosition(self, detection, image_height, image_width):
        """
        Define Origin as webcam position. Positive Z is towards viewer. +X is to the right of user-perspective.  +Y is "down".
        """
        bBox = detection.location_data.relative_bounding_box

        boundBox = (
            int(bBox.xmin * image_width),
            int(bBox.ymin * image_height),
            int(bBox.width * image_width),
            int(bBox.height * image_height),
        )

        z = self.convertBoundingBoxWidthToDistance(boundBox[2])  # cm

        virt_ipd = self.calcIPD(detection, image_height, image_width)

        x, y = self.calcXYPosition(detection, image_height, image_width, virt_ipd)  # cm

        return x, y, z

    def smoothPosition(self, raw_x, raw_y, raw_z):
        """
        applies smoothing functions to raw x, y and z positions
        """
        self.xPositionQueue.append(raw_x)
        self.yPositionQueue.append(raw_y)
        self.zPositionQueue.append(raw_z)

        return (
            mean(self.xPositionQueue),
            mean(self.yPositionQueue),
            mean(self.zPositionQueue),
        )

    def positionSmoothingFunc(self, q):
        return int(mean(q))

    def getRelativeEyePosition(self, detection):
        left_eye_pt = detection.location_data.relative_keypoints[self.LEFT_EYE_INDEX].__deepcopy__()
        left_eye_pt.x += self.RELATIVE_EYE_POSITION_OFFSET
        left_eye_pt.y += self.RELATIVE_EYE_POSITION_OFFSET

        right_eye_pt = detection.location_data.relative_keypoints[self.RIGHT_EYE_INDEX].__deepcopy__()
        right_eye_pt.x += self.RELATIVE_EYE_POSITION_OFFSET
        right_eye_pt.y += self.RELATIVE_EYE_POSITION_OFFSET

        return left_eye_pt, right_eye_pt

    def smoothEyePositions(self, detection, image_height, image_width):
        left_eye_pt = detection.location_data.relative_keypoints[self.LEFT_EYE_INDEX]
        right_eye_pt = detection.location_data.relative_keypoints[self.RIGHT_EYE_INDEX]
        self.rightEyeXQueue.append(int(right_eye_pt.x * image_width))
        self.rightEyeYQueue.append(int(right_eye_pt.y * image_height))

        self.leftEyeXQueue.append(int(left_eye_pt.x * image_width))
        self.leftEyeYQueue.append(int(left_eye_pt.y * image_height))

        out = [self.positionSmoothingFunc(x) for x in self.allSmoothQs]

        return (out[0], out[1]), (out[2], out[3])

