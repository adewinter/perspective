Install

* clone this repo: https://github.com/adewinter/perspective
in the root repo, from the command line run:
```
npm install
pip install opencv cvui mediapipe zmq
```

* Install OpenFace: https://github.com/TadasBaltrusaitis/OpenFace/wiki/Windows-Installation
* Run the script to download the models for openface (located in the openface install directory, named "download_models.ps1")

--------------

* Run `HeadPoseLive.exe` in OpenFace
* In a terminal, go to the perspective repo you cloned in step 1
* Run
```
npm run start
```

* In another terminal, go to the perspective repo -> cd python\
* run
```
python zeromq_openface.py
```

