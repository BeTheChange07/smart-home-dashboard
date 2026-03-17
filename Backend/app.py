#loasing .env file
from dotenv import load_dotenv
load_dotenv(".env")

from flask import Flask, request
import os
import json
from flask_cors import CORS

#importing functions from respective file
from routes import Locks, Garage, Lights, Thermostat, CoffeMachine, FrontDoorCam, SmarPlug 



app = Flask("HCIBackend")
CORS(app)


@app.route("/")
def working():
    return "This is working"

@app.route("/locks/<name>", methods=["GET", "PATCH"])
def locks(name):
    return Locks.Locks(request.method, name)

@app.route("/garage", methods=["GET", "PATCH"])
def garage():
    return Garage.Garage(request.method)

@app.route("/lights/<name>", methods=["GET", "PATCH"])
def lights(name):
    return Lights.Lights(request.method, name)

@app.route("/thermostat", methods=["GET", "PATCH"])
def thermostat():
    argDict = request.args
    return Thermostat.Thermostat(request.method, argDict)


@app.route("/coffeMachine", methods=["GET", "PATCH"])
def coffeMachine():
    return CoffeMachine.CoffeMachine(request.method)


@app.route("/frontDoorCam", methods=["GET", "PATCH"])
def frontDoorCam():
    return FrontDoorCam.FrontDoorCam(request.method)

@app.route("/smartPlug/<name>", methods=["GET", "PATCH"])
def smartPlug(name):
    return SmarPlug.SmartPlug(request.method, name)

#get all states of the state.json
@app.route("/state", methods=["GET"])
def get_full_state():
    with open("state.json", "r") as f:
        return json.load(f)

 #######################################
 #Log the events in events.json.
 #######################################
@app.route("/events", methods=["GET"])
def get_events():
    try:
        with open("events.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

@app.route("/events", methods=["POST"])
def add_event():
    event = request.get_json()
    try:
        with open("events.json", "r") as f:
            events = json.load(f)
    except FileNotFoundError:
        events = []

    events.insert(0, event)
    events = events[:50]  # keep max 50

    with open("events.json", "w") as f:
        json.dump(events, f, indent=4)

    return event
###########################################



#dont worry about this its only for production
if __name__ == '__main__':
    app.run(port=os.getenv("PORT"))


