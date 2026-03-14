import flask
import routes.Helpers.Helper as helper

def FrontDoorCam(method):
    if(method == "GET"):
        return helper.checkStateFileSingleBianaryEntity("FrontDoorCam")
    elif(method == "PATCH"):
        return helper.changeStateFileSingleBianaryEntity("FrontDoorCam")


    return "Please use a supported method"