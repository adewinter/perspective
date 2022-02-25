import cv2
import mediapipe as mp
import time

mp_facedetector = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_face_mesh = mp.solutions.face_mesh

cap = cv2.VideoCapture(0)
counter = 0
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)
# with mp_facedetector.FaceDetection(min_detection_confidence=0.7) as face_detection:
with mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
) as face_mesh:

    while cap.isOpened():

        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            # If loading a video, use 'break' instead of 'continue'.
            continue

        start = time.time()
        counter += 1

        # # Convert the BGR image to RGB
        # image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # # Process the image and find faces
        # # results = face_detection.process(image)
        # results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        # # Convert the image color back so it can be displayed
        # image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # To improve performance, optionally mark the image as not writeable to
        # pass by reference.
        image.flags.writeable = False
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image)

        # Draw the face mesh annotations on the image.
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if not results.multi_face_landmarks:
            continue

        # for id, detection in enumerate(results.detections):
        #     mp_drawing.draw_detection(image, detection)
        #     # print(id, detection)

        #     bBox = detection.location_data.relative_bounding_box

        #     h, w, c = image.shape

        #     boundBox = int(bBox.xmin * w), int(bBox.ymin * h), int(bBox.width * w), int(bBox.height * h)

        #     cv2.putText(image, f'{int(detection.score[0]*100)}%', (boundBox[0], boundBox[1] - 20), cv2.FONT_HERSHEY_SIMPLEX, 2, (0,255,0), 2)

        for face_landmarks in results.multi_face_landmarks:
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style(),
            )
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style(),
            )
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_IRISES,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_iris_connections_style(),
            )

            cv2.putText(
                image,
                f"{face_landmarks.landmark[470].z*100}",
                (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.5,
                (0, 255, 0),
                2,
            )
            # if counter % 20 == 0:
            # print("========")
            # import pdb; pdb.set_trace()

        end = time.time()
        totalTime = end - start

        fps = 1 / totalTime
        # print("FPS: ", fps)

        cv2.putText(
            image,
            f"FPS: {int(fps)}",
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.5,
            (0, 255, 0),
            2,
        )

        cv2.imshow("Face Detection", image)

        if cv2.waitKey(5) & 0xFF == 27:
            break

cap.release()
