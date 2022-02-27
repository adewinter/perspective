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
