import routes.Helpers.Helper as helper
import json
from filelock import Timeout, FileLock

#this is the lockfile definition to ensure we dont corrupt the file trying to 
#write to it if accessed too many times
lock = FileLock("./textFiles/locks/state.json.lock")

def Thermostat(method, arguments):
    if(method == "GET"):
        with lock:
            with open("state.json", 'r') as file:
                jsonData = json.load(file)
            jsonCatagory = jsonData["Thermostat"]
            try:
                stateStr = str(jsonCatagory["State"])
                tempStr = str(jsonCatagory["CurrentTemp"])
            except:
                return "Name mismatch"
            return stateStr + "," + tempStr

    elif(method == "PATCH"):
        with lock:
            with open("state.json", 'r') as file:
                jsonData = json.load(file)
            try:
                jsonCatagory = jsonData["Thermostat"]
            except:
                return "Name mismatch"

            # Toggle the state
            jsonCatagory["State"] = not jsonCatagory["State"]

            # Update temp if provided, otherwise keep current
            try:
                jsonCatagory["CurrentTemp"] = arguments["temp"]
            except:
                pass  # no temp argument is fine, just toggle state

            with open("state.json", "w") as writefile:
                json.dump(jsonData, writefile, indent=4)
            return str(jsonCatagory["State"]) + "," + str(jsonCatagory["CurrentTemp"])

    return "Please use a supported method"