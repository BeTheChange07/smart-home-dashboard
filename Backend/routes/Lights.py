import json
import routes.Helpers.Helper as helper


def Lights(method, name, argsDict):
    if(method == "GET"):
        return helper.checkStateFileNamedEntity("Lights", name)

    elif(method == "PATCH"):
        return helper.changeStateFileNamedEntity("Lights", name, argsDict)

    return "Please use a supported method"