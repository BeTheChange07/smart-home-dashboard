#loasing .env file
from dotenv import load_dotenv
load_dotenv(".env")

from flask import Flask, request
import os
import json
from flask_cors import CORS

#importing functions from respective file
from routes import Locks, Garage, Lights, Thermostat, CoffeMachine, FrontDoorCam, SmarPlug, Events



app = Flask("HCIBackend")
CORS(app)


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
    with open("state.json", "r") as f:
        return json.load(f)

@app.route("/events", methods=["GET", "POST"])
def events():
    return Events.Events(request.method)




#dont worry about this its only for production
if __name__ == '__main__':
    app.run(port=os.getenv("PORT"))


