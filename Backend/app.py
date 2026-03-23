#loasing .env file
from dotenv import load_dotenv
load_dotenv(".env")


from filelock import FileLock
state_lock = FileLock("./textFiles/locks/state.json.lock")

from flask import Flask, request
import os
import json
from flask_cors import CORS

#importing functions from respective file
from routes import Locks, Garage, Lights, Thermostat, CoffeMachine, \
    FrontDoorCam, SmarPlug, Events, Batch, Prio

from routes.Helpers.Scheduler import scheduler


app = Flask("HCIBackend")
CORS(app)

#start scheduler for batch messages
scheduler.init_app(app)
scheduler.start()

@app.route("/")
def working():
    return "This is working"

@app.route("/locks/<name>", methods=["GET", "PATCH"])
def locks(name):
    argDict = request.args
    return Locks.Locks(request.method, name, argDict)

@app.route("/garage", methods=["GET", "PATCH"])
def garage():
    argDict = request.args
    return Garage.Garage(request.method, argDict)

@app.route("/lights/<name>", methods=["GET", "PATCH"])
def lights(name):
    argDict = request.args
    return Lights.Lights(request.method, name, argDict)

@app.route("/thermostat", methods=["GET", "PATCH"])
def thermostat():
    argDict = request.args
    return Thermostat.Thermostat(request.method, argDict)


@app.route("/coffeeMachine", methods=["GET", "PATCH"])
def coffeMachine():
    argDict = request.args
    return CoffeMachine.CoffeMachine(request.method, argDict)


@app.route("/frontDoorCam", methods=["GET", "PATCH"])
def frontDoorCam():
    argDict = request.args
    return FrontDoorCam.FrontDoorCam(request.method, argDict)

@app.route("/smartPlug/<name>", methods=["GET", "PATCH"])
def smartPlug(name):
    argDict = request.args
    return SmarPlug.SmartPlug(request.method, name, argDict)

#get all states of the state.json
@app.route("/state", methods=["GET"])
def get_full_state():
    with state_lock:
        with open("state.json", "r") as f:
            return json.load(f)

@app.route("/events", methods=["GET", "PATCH"])
def events():
    return Events.Events(request.method)

@app.route("/batch", methods=["GET"])
def batch():
    return Batch.Batch(request.method)

@app.route("/prio", methods=["PATCH"])
def prio():
    argDict = request.args
    return Prio.Prio(request.method, argDict)

#dont worry about this its only for production
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=os.getenv("PORT"))