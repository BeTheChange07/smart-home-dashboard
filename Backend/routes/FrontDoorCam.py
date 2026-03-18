import flask
import routes.Helpers.Helper as helper

def FrontDoorCam(method, argsDict):
    if(method == "GET"):
        return helper.checkStateFileSingleBianaryEntity("FrontDoorCam")
    elif(method == "PATCH"):
        return helper.changeStateFileSingleBianaryEntity("FrontDoorCam", argsDict)


    return "Please use a supported method"