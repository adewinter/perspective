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


def calcIPD(detection, image_height, image_width):
    "calcs virtual IPD.  Real IPD is 13.5cm"
    if not detection or not detection.location_data:
        return -1

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


def calcPosition(detection, image_height, image_width):
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

    z = convertBoundingBoxWidthToDistance(boundBox[2])  # cm

    virt_ipd = calcIPD(detection, image_height, image_width)

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


def smoothEyePositions(detection, image_height, image_width):
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
    left_eye, right_eye = smoothEyePositions(detection, image)
    eye_radius = 5  # px

    cv2.circle(image, left_eye, eye_radius, (255, 255, 255), 1)
    cv2.circle(image, right_eye, eye_radius, (255, 255, 255), 1)





def Main:
    def __init__(self):
        self.counter = 0
        self.fpscounter = 0
        self.fps = 0
        self.totalTime = 1
        self.prev_frame_time = 0
        self.new_frame_time = 0
        self.savedata = []

        self.CVUI_WINDOW_NAME = "CVUI"
        self.CVUI_FRAME = np.zeros((200, 600, 3), np.uint8)

        self.image_source = CameraImageSource()
        self.drawer = Drawer()
        self.face_detector = FaceDetector()

        cvui.init(self.CVUI_WINDOW_NAME)



    def clearFrames(self):
        self.CVUI_FRAME[:] = (49, 52, 49)

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
        self.clearFrames()
        self.startFPSMeasure()
        
        success, image = self.image_source.getImage()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        image_height, image_width, colors = self.drawer.setImage(image)

        detections = self.face_detector.detectFace(image)

        for id, detection in enumerate(detections):
            self.drawer.drawFaceAndBoundingBox(detection)

            rawPosition = calcPosition(detection, image_height, image_width)
            position = smoothPosition(*rawPosition)

            self.drawer.drawTextCoordinates(rawPosition, position)
            self.drawer.drawSparklines(rawPosition[0], position[0])

            eyePoints = smoothEyePositions(detection, image_height, image_width)
            self.drawEyes(eyePoints)

            virt_ipd = calcIPD(detection, image_height, image_width)
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
