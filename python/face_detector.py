import mediapipe as mp
import cv2
import pickle

from settings import DEBUG
class FaceDetector:
    def __init__(self):
        if DEBUG:
            return

        self.face_detection = mp.solutions.face_detection.FaceDetection(
            min_detection_confidence=0.7
        )

    def detectFace(self, image):
        if DEBUG:
            return self.FAKE_DETECTIONS()

        # Convert the BGR image to RGB
        temp_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Process the image and find faces
        results = self.face_detection.process(temp_image)

        return results.detections



    def FAKE_DETECTIONS(self):
        detection_data = b'\x80\x04\x95\xbd\x00\x00\x00\x00\x00\x00\x00\x8c)mediapipe.framework.formats.detection_pb2\x94\x8c\tDetection\x94\x93\x94)R\x94}\x94\x8c\nserialized\x94Ck\x12\x01\x00\x1a\x04g\xffw?"`\x08\x02\x1a\x14\r^\xc9\xac>\x15\xfd,\x0e?\x1d\xf2q\x82>%0\xed\xad>*\n\r\x90\xb6\xca>\x15\xbd\xaf)?*\n\r5\xef\xfc>\x15\xe0\\&?*\n\ru\xc4\xdd>\x15\t\xe7>?*\n\r\x10\xc6\xe2>\x15!\xffM?*\n\rs\xc4\xbb>\x15\xb3\xd2.?*\n\r\x96\xea\x13?\x15kh)?\x94sb.'
        detection = pickle.loads(detection_data)
        return [detection]