import json
import routes.Helpers.Helper as helper
def SmartPlug(method, name):
    if(method == "GET"):
        return helper.checkStateFileNamedEntity("SmartPlugs", name)
    
    elif(method == "PATCH"):
        return helper.changeStateFileNamedEntity("SmartPlugs", name)

    return "Please use a supported method"