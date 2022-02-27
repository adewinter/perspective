class Drawer:
    """
    Responsible for rendering the image from the ImageSource, FaceDetection details, other data, etc
    """

    def __init__(self):
        self.mp_drawing = mp.solutions.drawing_utils
        self.sparkline_data_q1 = deque([0] * 100, 100)
        self.sparkline_data_q2 = deque([0] * 100, 100)

    
    def setImage(self, image):
        self.image = image
        return image.shape

    def showUI(self):
        cv2.imshow("Face Detection", image)
        cvui.imshow(self.CVUI_WINDOW_NAME, self.CVUI_FRAME)

    def drawFaceAndBoundingBox(self, image, detection):
        self.mp_drawing.draw_detection(image, detection)

    def drawTextCoordinates(self, image, coords1, coords2):
        stringToRender = (
            f"X: {coords1[0]:.2f}, Y:{coords1[1]:.2f}, Z:{coords1[2]:.2f}"
        )
        textPosition = (5, 5)
        fontSize = 0.4

        cvui.text(
            image,
            *textPosition,
            stringToRender,
            fontSize,
        )

        stringToRender = (
            f"X: {coords2[0]:.2f}, Y:{coords2[1]:.2f}, Z:{coords2[2]:.2f}"
        )
        textPosition = (5, 20)
        fontSize = 0.4

        cvui.text(
            image,
            *textPosition,
            stringToRender,
            fontSize,
        )

    def drawEyes(self, image, eyePoints):
        eye_radius = 5  # px

        cv2.circle(image, eyePoints[0], eye_radius, (255, 255, 255), 1)
        cv2.circle(image, eyePoints[1], eye_radius, (255, 255, 255), 1)

    def drawSparklines(self, image, dataPoint1, dataPoint2):
        self.sparkline_data_q1.append(dataPoint1)
        self.sparkline_data_q2.append(dataPoint2)

        cvui.sparkline(
            self.CVUI_FRAME, self.sparkline_data_q1, 0, 0, 600, 200, 0x00FF00
        )
        cvui.sparkline(
            self.CVUI_FRAME,
            self.sparkline_data_q2,
            0,
            0,
            600,
            200,
            0xFFFFFF,
        )

    def drawCalulatedIPDText(self, image, virt_ipd):
        cv2.putText(
            image,
            f"ipd:{virt_ipd:.1f}px",
            (boundBox[0], boundBox[1] - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )

    def drawFPS(self, image, fps, timePerFrame):
        cv2.putText(
            image,
            f"FPS: {int(fps)}, {timePerFrame:.3f}s",
            (10, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 255, 0),
            2,
        )
