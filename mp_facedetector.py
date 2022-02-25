import time
import math
from collections import deque
from statistics import mean

import cv2
import cvui
import numpy as np

import mediapipe as mp


LEFT_EYE_INDEX = 0
RIGHT_EYE_INDEX = 1
REAL_IPD = 13.5  # cm. Physical distance between my pupils

xq = deque([0] * 3, 3)
yq = deque([0] * 3, 3)
zq = deque([0] * 3, 3)


def convertBoundingBoxWidthToDistance(width):  # distance in CM!
    CENTIMETERS_PER_INCH = 2.54
    a, b, c, d = -0.000003372072338, 0.002878979776, -0.8792663751, 114.0018076
    distance = a * pow(width, 3) + b * pow(width, 2) + c * width + d
    return distance * CENTIMETERS_PER_INCH


def calcIPD(detection, image):
    "calcs virtual IPD.  Real IPD is 13.5cm"
    if not detection or not detection.location_data:
        return -1

    image_height, image_width, image_num_colors = image.shape
    left_pt = detection.location_data.relative_keypoints[LEFT_EYE_INDEX]
    right_pt = detection.location_data.relative_keypoints[RIGHT_EYE_INDEX]

    xdistsq = pow(left_pt.x * image_width - right_pt.x * image_width, 2)
    ydistsq = pow(left_pt.y * image_height - right_pt.y * image_height, 2)

    dist = math.sqrt(xdistsq + ydistsq)
    return math.floor(dist)


def calcXYPosition(detection, image, virt_ipd):
    """
    Calcs the real world X and Y coordinates of the point located mid way between eyes
    Does not account for "fish-eye" effect of camera lens. There will be more error the further away
    we move from the center of the image.
    """

    image_height, image_width, image_num_colors = image.shape
    left_eye_pt = detection.location_data.relative_keypoints[LEFT_EYE_INDEX]
    right_eye_pt = detection.location_data.relative_keypoints[RIGHT_EYE_INDEX]

    mid_x = left_eye_pt.x + abs(right_eye_pt.x - left_eye_pt.x) // 2
    mid_y = left_eye_pt.y + abs(right_eye_pt.y - left_eye_pt.y) // 2

    mid_x_px = mid_x * image_width
    mid_y_px = mid_y * image_height

    cm_per_px = REAL_IPD / virt_ipd

    return mid_x_px * cm_per_px, mid_y_px * cm_per_px


def calcPosition(detection, image):
    """
    Define Origin as webcam position. Positive Z is towards viewer. +X is to the right of user-perspective.  +Y is "down".
    """
    bBox = detection.location_data.relative_bounding_box
    h, w, c = image.shape
    boundBox = (
        int(bBox.xmin * w),
        int(bBox.ymin * h),
        int(bBox.width * w),
        int(bBox.height * h),
    )

    z = convertBoundingBoxWidthToDistance(boundBox[2])  # cm

    virt_ipd = calcIPD(detection, image)

    x, y = calcXYPosition(detection, image, virt_ipd)  # cm

    return x, y, z


def smoothPosition(raw_x, raw_y, raw_z):
    """
    applies smoothing functions to raw x, y and z positions
    """
    xq.append(raw_x)
    yq.append(raw_y)
    zq.append(raw_z)

    return mean(xq), mean(yq), mean(zq)


lx = deque([], 3)
ly = deque([], 3)
rx = deque([], 3)
ry = deque([], 3)


allSmoothQs = [lx, ly, rx, ry]


def smoothEyes(detection, image):
    image_height, image_width, image_num_colors = image.shape
    left_eye_pt = detection.location_data.relative_keypoints[LEFT_EYE_INDEX]
    right_eye_pt = detection.location_data.relative_keypoints[RIGHT_EYE_INDEX]

    def smoothFunc(q):
        return int(mean(q))

    rx.append(int(right_eye_pt.x * image_width))
    ry.append(int(right_eye_pt.y * image_height))

    lx.append(int(left_eye_pt.x * image_width))
    ly.append(int(left_eye_pt.y * image_height))

    out = [smoothFunc(x) for x in allSmoothQs]

    return (out[0], out[1]), (out[2], out[3])


def drawSmoothEyes(image, detection):
    left_eye, right_eye = smoothEyes(detection, image)
    eye_radius = 5  # px

    cv2.circle(image, left_eye, eye_radius, (255, 255, 255), 1)
    cv2.circle(image, right_eye, eye_radius, (255, 255, 255), 1)


def drawSmoothPositionTextCoords(xyzPosition, image):
    stringToRender = (
        f"X: {xyzPosition[0]:.2f}, Y:{xyzPosition[1]:.2f}, Z:{xyzPosition[2]:.2f}"
    )
    textPosition = (5, 5)
    fontSize = 0.4

    cvui.text(
        image,
        *textPosition,
        stringToRender,
        fontSize,
    )

def drawRawPositionTextCoords(xyzPosition, image):
    stringToRender = (
        f"X: {xyzPosition[0]:.2f}, Y:{xyzPosition[1]:.2f}, Z:{xyzPosition[2]:.2f}"
    )
    textPosition = (5, 20)
    fontSize = 0.4
    fontColor = 0x00ff00


    cvui.text(
        image,
        *textPosition,
        stringToRender,
        fontSize,
        fontColor
    )



class FaceDetector:
    def __init__(self):
        self.mp_facedetector = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.mp_face_mesh = mp.solutions.face_mesh

        self.cap = cv2.VideoCapture(0, cv2.CAP_ANY)
        self.cap.set(cv2.CAP_PROP_FPS, 60)
        self.counter = 0
        self.fpscounter = 0
        self.fps = 0
        self.totalTime = 1
        self.prev_frame_time = 0
        self.new_frame_time = 0
        self.savedata = []
        self.drawing_spec = self.mp_drawing.DrawingSpec(thickness=1, circle_radius=1)

        self.CVUI_WINDOW_NAME = "CVUI"
        self.CVUI_FRAME = np.zeros((200, 600, 3), np.uint8)

        self.sparkline_pos_x = deque([0] * 100, 100)
        self.sparkline_pos_x_smooth = deque([0] * 100, 100)

        cvui.init(self.CVUI_WINDOW_NAME)

    def run(self):
        with self.mp_facedetector.FaceDetection(
            min_detection_confidence=0.7
        ) as face_detection:
            # with mp_face_mesh.FaceMesh(
            #     max_num_faces=1,
            #     refine_landmarks=True,
            #     min_detection_confidence=0.5,
            #     min_tracking_confidence=0.5) as face_mesh:

            while self.cap.isOpened():

                success, image = self.cap.read()
                if not success:
                    print("Ignoring empty camera frame.")
                    # If loading a video, use 'break' instead of 'continue'.
                    continue

                self.CVUI_FRAME[:] = (49, 52, 49)

                self.new_frame_time = time.time()
                self.counter += 1
                self.fpscounter += 1

                # # Convert the BGR image to RGB
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

                # # Process the image and find faces
                results = face_detection.process(image)

                # # Convert the image color back so it can be displayed
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

                if not results.detections:
                    continue

                for id, detection in enumerate(results.detections):
                    self.mp_drawing.draw_detection(image, detection)

                    bBox = detection.location_data.relative_bounding_box

                    h, w, c = image.shape

                    boundBox = (
                        int(bBox.xmin * w),
                        int(bBox.ymin * h),
                        int(bBox.width * w),
                        int(bBox.height * h),
                    )
                    dist = convertBoundingBoxWidthToDistance(boundBox[3])
                    virt_ipd = calcIPD(detection, image)

                    rawPosition = calcPosition(detection, image)
                    position = smoothPosition(*rawPosition)

                    drawRawPositionTextCoords(rawPosition, self.CVUI_FRAME)
                    drawSmoothPositionTextCoords(position, self.CVUI_FRAME)
                    self.sparkline_pos_x.append(rawPosition[0])
                    self.sparkline_pos_x_smooth.append(position[0])

                    cvui.sparkline(
                        self.CVUI_FRAME, self.sparkline_pos_x, 0, 0, 600, 200, 0x00FF00
                    )
                    cvui.sparkline(
                        self.CVUI_FRAME,
                        self.sparkline_pos_x_smooth,
                        0,
                        0,
                        600,
                        200,
                        0xFFFFFF,
                    )

                    drawSmoothEyes(image, detection)

                    cv2.putText(
                        image,
                        f"z:{dist:.2f}cm, ipd:{virt_ipd}px",
                        (boundBox[0], boundBox[1] - 20),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 255, 0),
                        2,
                    )

                if self.fpscounter % 10 == 0:
                    self.totalTime = self.new_frame_time - self.prev_frame_time
                    self.prev_frame_time = self.new_frame_time
                    self.fps = 10 / (self.totalTime)
                    self.fpscounter = 0

                cv2.putText(
                    image,
                    f"FPS: {int(self.fps)}, {self.totalTime:.3f}s",
                    (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (0, 255, 0),
                    2,
                )

                cv2.imshow("Face Detection", image)
                cvui.imshow(self.CVUI_WINDOW_NAME, self.CVUI_FRAME)

                if cv2.waitKey(2) & 0xFF == 27:
                    break


if __name__ == "__main__":
    fd = FaceDetector()
    fd.run()
    fd.cap.release()
