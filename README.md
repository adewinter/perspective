# Perspective

This project is heavily inspired by the [Head Tracking for Desktop VR](http://johnnylee.net/projects/wii/)[1] project by Johnny Chung Lee.  The ultimate purpose of this project is to render arbitrary 3D scenes and have a window-like perspective into these scenes.  When we make use of [Off Axis projection](#off-axis-projection) and headtracking, we can give the viewer a true sense of depth and perspective, providing a "life like" window into these worlds.  Eventually this project will be combined with dedicated hardware (camera, screen, compute) to act as a portrait/work of art to be hung in the home.  As a viewer passes by the portrait they will be able to gaze into different fantastical worlds with the same sense of perspective as that provided by a regular window.  With the addition of realistic lighting (e.g. matching the color and intensity of the sun) it may be possible to truly give the sense that the room is attached to a wholly different location/reality via this portrait window, or simply but effectively combat Seasonal Affectivity Disorder (SAD).


Head pose detection and tracking is done via a webcam video feed by either [OpenFace](https://github.com/TadasBaltrusaitis/OpenFace) or by an [local implementation](https://github.com/adewinter/perspective/blob/main/python/face_detector.py), in this repo, of the [MediaPipe Face Detection](https://google.github.io/mediapipe/solutions/face_detection.html) library.  This tracking provides the 3d renderer with the viewers physical location in space relative to the camera.  The 3D renderer is done in javascript by a regular web browser, using the [three.js](https://threejs.org/) library.

## Install

### Requirements
* Python 3.7+
* [pipenv](https://pipenv.pypa.io/en/latest/install/)
* Nodejs 

### Instructions
*Note:* Only tested on Windows 10 so far, but should work on Mac and Linux, as the libraries and packages are fairly standard.

* [Install pipenv](https://pipenv.pypa.io/en/latest/install/) if you haven't already:
```bash
pip install --user pipenv
```

* clone this repo: https://github.com/adewinter/perspective
in the root repo, from the command line run:
```bash
npm install
pipenv install
```

* Install OpenFace: https://github.com/TadasBaltrusaitis/OpenFace/wiki/Windows-Installation
* Run the script to download the models for openface (located in the openface install directory, named "download_models.ps1" if you're in windows, otherwise follow the [Model Download](https://github.com/TadasBaltrusaitis/OpenFace/wiki/Model-download) instructions in their wiki).


## Usage

* Run `HeadPoseLive.exe`, located in the OpenFace install directory
* In a new terminal, go to where you cloned this perspective repo in step 1
* Run
```bash
npm run serve
```

* In another terminal, go to the perspective repo
* then run
```bash
pipenv shell
python python/zeromq_openface.py
```

* Finally, open your browser and navigate to [http://localhost:8080](http://localhost:8080).


## Development/Code Exploration

The repo is divided into two main sections:

### Headtracking + Messaging server - Python.
All python code is located in the [python/](https://github.com/adewinter/perspective/tree/main/python) folder.  The local implementation of the Mediapipe Face Detection algo can be launched by running `main.py` (make sure you are in a pipenv shell by running `pipenv shell` first!):
```bash
python main.py
```
This will launch both the headtracker _and_ a websocket server responsible for communicating tracking data to the client (see [python/websocket_server.py](https://github.com/adewinter/perspective/blob/main/python/websocket_server.py)).

Alternatively, to use the OpenFace headtracking implementation follow the Usage instructions above and ensure that you are running [python/zeromq_openface.py](https://github.com/adewinter/perspective/blob/main/python/zeromq_openface.py). 
```python
python zeromq_openface.py

```
This script is a simple bridge that transfers the data sent by Openface via zeromq to a websocket which is consumed by the client.

### 3D Rendering and perspective - Javascript
All the javascript code can be found in the [src/](https://github.com/adewinter/perspective/tree/main/src) folder but is served in a convenient way by Webpack from the root of this repo.  To start the webserver run:
```
npm start run

```

From the repo root.  Then launch your broser and go to [http://localhost:8080](http://localhost:8080).

This code instantiates a camera that is responsible for the Off Axis Projection rendering that is the root of the project (see below for more info). The camera position is determined by the data being reported by the headtracker (which comes in via a [websocket client](https://github.com/adewinter/perspective/blob/main/src/websocket_client.js)).  A environment is rendered by the threejs library, to give you something to actually look at.  The heavy lifting for the environment generation is done in [room_generate.js](https://github.com/adewinter/perspective/blob/main/src/room_generate.js) if you are looking at the [CALIBRATION_ROOM](https://github.com/adewinter/perspective/blob/main/src/settings.js#L11) or in [env_littlest_toky.js](https://github.com/adewinter/perspective/blob/main/src/env_littlest_tokyo.js) if you're viewing that 3d scene instead.

### General debugging/settings
For the javascript side it is important to be aware of `src/settings.js`.  This file contains several tweakable values that influence what the environment looks like and how the camera behaves (in conjunction with the values you can tweak in the gui).

Similarly, for the local MP face detector implementation you'll want to take a look at `python/settings.py` to see what useful values you can tweak there.


## Off Axis Projection
This is the heart of the project and is what allows the "depth effect" to occur visually.  The seminal discussion around what off axis projection is and how it works [the article written by Rober Kooima](https://web.archive.org/web/20191110002841/http://csc.lsu.edu/~kooima/articles/genperspective/index.html).  Thankfully, [Threejs has an implementation](https://github.com/mrdoob/three.js/issues/5381) that allows one to perform off-axis projection so it was not necessary to roll one here.


[1] [Head Tracking for Desktop VR video](https://www.youtube.com/watch?v=Jd3-eiid-Uw)



# Dev Log

## Initial Development
Initially I tried to rapidly prototype and experimented with a couple of different face detection mediapipe algorithms and running it all in the browser:

![Work in Progress shot #1](workinprogress1.png)

The proof of concept worked in the sense that I was able to get physical XYZ coordinates from an image detection algorithm and translate that into a 3d rendered scene.  However, the algorithm performance was shaky both in the sense of performance (FPS) but also literally: when keeping my head motionless the algorithm would still rapidly jitter the final XYZ coordinates (sometimes many centimeteres change in location between individual frames).  In the case of BlazePose, while it was initially convenient that it provided both XY and Z coordinates right out of the box (as opposed to just flat XY pixel locations like most other algorithms), it turned out the estimate for Z was very very rough and often inaccurate.  After experimenting with a number of different face detection algorithms, some ML/Neural Network based and others old school OpenCV/Haar Cascade it became clear that estimating depth/Z coordinates by measuring width of the bounding box of the face, or alternatively the Inter Pupillary Distance(IPD), would be superior and provide a better and smoother estimate.

This experimentation with different algorithms eventually lead to running things in python:
![Work in Progresss shot #2](workinprogress2.png)

and the proof that it was a lot more performant than running everything in the same thread in the browser.  Not exactly shocking or unexpected but still a good outcome.

Finally, I came across OpenFace and was able to run it on my local machine without too much fuss.  Performance of their algorithm and implementation with respect to tracking overall head pose was _far far far_ superior to anything I could knock together.  Thus, I turned my attention to figuring out how to get data out of that platform into my project.  Luckily, OpenFace dumps data out to a ZeroMQ channel/topic so I was able to knock together a bridge between that and my existing websocket server/client.  

Overall, while I'm happy with the OpenFace performance and think it's pretty close to *state of the art*, I'm starting to suspect that *state of the art* when it comes to webcam face tracking is still not quite **good enough** to really give a seamless experience when it comes to perspective projection of the kind that I want.  There might be some more tricks that could help (calibrating various values, making sure the viewer is far enough away from the camera/screen) but I'm not sure how far that will go to help the situation.  I'll keep polishing away at it and hopefully hit a happy medium.