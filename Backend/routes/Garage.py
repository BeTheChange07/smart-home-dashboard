import flask
import routes.Helpers.Helper as helper

def Garage(method, argsDict):
    if(method == "GET"):
        return helper.checkStateFileSingleBianaryEntity("GarageDoor")
    elif(method == "PATCH"):
        return helper.changeStateFileSingleBianaryEntity("GarageDoor", argsDict["Reason"])


    return "Please use a supported method"