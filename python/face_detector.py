import mediapipe as mp
import cv2

class FaceDetector:
    def __init__(self): 
        self.face_detection = mp.solutions.face_detection.FaceDetection(
            min_detection_confidence=0.7
        )

    def detectFace(self, image):
        # Convert the BGR image to RGB
        temp_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Process the image and find faces
        results = self.face_detection.process(temp_image)

        return results.detections

    def run(self):
        with self.mp_facedetector.FaceDetection(
            min_detection_confidence=0.7
        ) as face_detection:
            while self.cap.isOpened():

                success, image = self.cap.read()
                if not success:
                    print("Ignoring empty camera frame.")
                    # If loading a video, use 'break' instead of 'continue'.
                    continue

                # self.CVUI_FRAME[:] = (49, 52, 49)

                # self.new_frame_time = time.time()
                # self.counter += 1
                # self.fpscounter += 1

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
