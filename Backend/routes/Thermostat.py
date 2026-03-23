import routes.Helpers.Helper as helper
import json
from filelock import Timeout, FileLock

lock = FileLock("./textFiles/locks/state.json.lock")

def Thermostat(method, argsDict):
    if(method == "GET"):
        with lock:
            with open("state.json", 'r') as file:
                jsonData = json.load(file)
            jsonCatagory = jsonData["Thermostat"]
            try:
                stateStr = str(jsonCatagory["State"])
                tempStr = str(jsonCatagory["CurrentTemp"])
                setTempStr = str(jsonCatagory["SetTemp"])
            except:
                return "Name mismatch"
            return stateStr + "," + tempStr + "," + setTempStr

    elif(method == "PATCH"):
        with lock:
            with open("state.json", 'r') as file:
                jsonData = json.load(file)
            try:
                jsonCatagory = jsonData["Thermostat"]
            except:
                return "Name mismatch"

            thermoPrio = jsonCatagory["Prio"]

            # If setTemp is provided, update the target temperature
            if "setTemp" in argsDict:
                jsonCatagory["SetTemp"] = int(argsDict["setTemp"])
            # If temp is provided, update the current temperature
            elif "temp" in argsDict:
                jsonCatagory["CurrentTemp"] = int(argsDict["temp"])
            # If neither, toggle on/off state
            else:
                jsonCatagory["State"] = not jsonCatagory["State"]

            try:
                helper.createLogInstance(argsDict["Reason"], "Thermostat", thermoPrio)
            except:
                helper.createLogInstance("No reason given", "Thermostat", thermoPrio)

            with open("state.json", "w") as writefile:
                json.dump(jsonData, writefile, indent=4)
            return str(jsonCatagory["State"]) + "," + str(jsonCatagory["CurrentTemp"]) + "," + str(jsonCatagory["SetTemp"])

    return "Please use a supported method"