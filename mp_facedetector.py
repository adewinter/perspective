import cv2
import mediapipe as mp
import time
import math

from collections import deque
from statistics import mean

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


def smoothEyes(detection, image):
    image_height, image_width, image_num_colors = image.shape
    left_eye_pt = detection.location_data.relative_keypoints[LEFT_EYE_INDEX]
    right_eye_pt = detection.location_data.relative_keypoints[RIGHT_EYE_INDEX]

    rx.append(right_eye_pt.x)
    ry.append(right_eye_pt.y)

    lx.append(left_eye_pt.x)
    ly.append(left_eye_pt.y)

    return (mean(lx), mean(ly)), (mean(rx), mean(ry))


def drawSmoothEyes(image, detection):
    left_eye, right_eye = smoothEyes(detection, image)
    eye_radius = 5  # px
    cv2.circle(image, left_eye, eye_radius, (255, 255, 255), 1)
    cv2.circle(image, right_eye, eye_radius, (255, 255, 255), 1)


mp_facedetector = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_face_mesh = mp.solutions.face_mesh

cap = cv2.VideoCapture(0, cv2.CAP_ANY)
cap.set(cv2.CAP_PROP_FPS, 60)
counter = 0
fpscounter = 0
fps = 0
totalTime = 1
prev_frame_time = 0
savedata = []
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)
once = True
with mp_facedetector.FaceDetection(min_detection_confidence=0.7) as face_detection:
    # with mp_face_mesh.FaceMesh(
    #     max_num_faces=1,
    #     refine_landmarks=True,
    #     min_detection_confidence=0.5,
    #     min_tracking_confidence=0.5) as face_mesh:

    while cap.isOpened():

        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            # If loading a video, use 'break' instead of 'continue'.
            continue

        new_frame_time = time.time()
        counter += 1
        fpscounter += 1

        # # Convert the BGR image to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # # Process the image and find faces
        results = face_detection.process(image)

        # # Convert the image color back so it can be displayed
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if not results.detections:
            continue

        for id, detection in enumerate(results.detections):
            mp_drawing.draw_detection(image, detection)
            # print(id, detection)

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

            real_x, real_y, real_z = smoothPosition(*calcPosition(detection, image))

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

            cv2.putText(
                image,
                f"X: {real_x:.2f}, Y:{real_y:.2f}, Z:{real_z:.2f}",
                (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 255),
                2,
            )

            # savedata.append(f"{dist}")
            # if counter == 200:
            #     with open("out.txt", "w+") as file:
            #         file.write("\n".join(savedata))
            #     cap.release()
            #     exit(0)
            #     print("========")
            #     print(detection.location_data)

        if fpscounter % 10 == 0:
            totalTime = new_frame_time - prev_frame_time
            prev_frame_time = new_frame_time
            fps = 10 / (totalTime)
            fpscounter = 0

        print("FPS: ", fps)

        cv2.putText(
            image,
            f"FPS: {int(fps)}, {totalTime:.3f}s",
            (10, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 255, 0),
            2,
        )

        cv2.imshow("Face Detection", image)

        if cv2.waitKey(2) & 0xFF == 27:
            break

cap.release()
