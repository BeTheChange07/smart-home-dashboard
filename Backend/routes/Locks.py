import json
import routes.Helpers.Helper as helper

def Locks(method, name):
    if(method == "GET"):
        return helper.checkStateFileNamedEntity("Locks", name)


    elif(method == "PATCH"):
        return helper.changeStateFileNamedEntity("Locks", name)


    return "Please use a supported method"
