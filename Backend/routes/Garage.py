import flask
import routes.Helpers.Helper as helper

def Garage(method):
    if(method == "GET"):
        return helper.checkStateFileSingleBianaryEntity("GarageDoor")
    elif(method == "PATCH"):
        return helper.changeStateFileSingleBianaryEntity("GarageDoor")


    return "Please use a supported method"