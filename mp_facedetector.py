import cv2
import mediapipe as mp
import time
import math

def convertBoundingBoxWidthToDistance(width): #distance in CM!
    CENTIMETERS_PER_INCH = 2.54
    a, b, c, d = -0.000003372072338,0.002878979776,-0.8792663751,114.0018076
    distance = a*pow(width,3) + b*pow(width,2) + c*width + d
    return distance*CENTIMETERS_PER_INCH

def calcIPD(detection, image):
    LEFT_EYE_INDEX = 0
    RIGHT_EYE_INDEX = 1

    if not detection or not detection.location_data:
        return -1

    image_height, image_width, image_num_colors = image.shape
    left_pt = detection.location_data.relative_keypoints[LEFT_EYE_INDEX]
    right_pt = detection.location_data.relative_keypoints[RIGHT_EYE_INDEX]

    xdistsq = pow(left_pt.x*image_width - right_pt.x*image_width, 2)
    ydistsq = pow(left_pt.y*image_height - right_pt.y*image_height, 2)

    dist = math.sqrt(xdistsq + ydistsq)
    return math.floor(dist)

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
        if once:
            results = face_detection.process(image)
            once = False
        
        # # Convert the image color back so it can be displayed
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


        if not results.detections:
            continue

        for id, detection in enumerate(results.detections):
            mp_drawing.draw_detection(image, detection)
            # print(id, detection)

            bBox = detection.location_data.relative_bounding_box

            h, w, c = image.shape

            boundBox = int(bBox.xmin * w), int(bBox.ymin * h), int(bBox.width * w), int(bBox.height * h)
            dist = convertBoundingBoxWidthToDistance(boundBox[3])
            virt_ipd = calcIPD(detection, image)
            cv2.putText(image, f'z:{dist:.2f}cm, ipd:{virt_ipd}px', (boundBox[0], boundBox[1] - 20), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            savedata.append(f"{dist}")
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

        cv2.putText(image, f'FPS: {int(fps)}, {totalTime:.3f}s', (10,50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,255,0), 2)

        cv2.imshow('Face Detection', image)

        if cv2.waitKey(2) & 0xFF == 27:
            break

cap.release()


