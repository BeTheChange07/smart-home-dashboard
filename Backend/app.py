#loasing .env file
from dotenv import load_dotenv
load_dotenv(".env")

import flask
from flask import Flask, request
import os


#importing functions from respective file
from routes import Locks, Garage, Lights, Thermostat, CoffeMachine, FrontDoorCam, SmarPlug 



app = Flask("HCIBackend")


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






#dont worry about this its only for production
if __name__ == '__main__':
    app.run(port=os.getenv("PORT"))


