import cv2


class ImageSource:
    def __init__(self):
        """initialize the source of images"""
        pass

    async def getImage(self):
        """get a single image frame"""
        pass


class CameraImageSource(ImageSource):
    def __init__(self):
        self.cap = cv2.VideoCapture(0, cv2.CAP_ANY)
        self.cap.set(cv2.CAP_PROP_FPS, 60)

    async def getImage(self):
        success, image = self.cap.read()
        if success:
            image = cv2.flip(image, 1)
        return success, image

    def close(self):
        self.cap.release()

class FakeCameraSource(ImageSource):
    def __init__(self):
        self.image = cv2.imread('../fake.png')

    async def getImage(self):
        return True, self.image.copy()

    def close(self):
        spass