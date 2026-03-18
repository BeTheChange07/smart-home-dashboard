import json
import routes.Helpers.Helper as helper
def SmartPlug(method, name, argsDict):
    if(method == "GET"):
        return helper.checkStateFileNamedEntity("SmartPlugs", name)
    
    elif(method == "PATCH"):
        return helper.changeStateFileNamedEntity("SmartPlugs", name, argsDict)

    return "Please use a supported method"