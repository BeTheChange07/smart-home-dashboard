import json
import routes.Helpers.Helper as helper


def Lights(method, name):
    if(method == "GET"):
        return helper.checkStateFileNamedEntity("Lights", name)

    elif(method == "PATCH"):
        return helper.changeStateFileNamedEntity("Lights", name)

    return "Please use a supported method"