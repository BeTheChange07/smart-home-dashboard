import routes.Helpers.Helper as helper
import json
from filelock import Timeout, FileLock

#this is the lockfile definition to ensure we dont corrupt the file trying to 
#write to it if accessed too many times
lock = FileLock("./textFiles/locks/state.json.lock")

def Thermostat(method, arguments):
    if(method == "GET"):
        with lock:
            file = open("state.json", 'r')
            jsonData = json.load(file)
            jsonCatagory = jsonData["Thermostat"]
            file.close()
            try:
                stateStr = str(jsonCatagory["State"])
                tempStr = str(jsonCatagory["CurrenTemp"])

            except:
                return "Name mismatch"

            return stateStr + "," + tempStr
    elif(method == "PATCH"):
        with lock:
            file = open("state.json", 'r')
            jsonData = json.load(file)
            writefile = open("state.json", "w")
            try:
                jsonCatagory = jsonData["Thermostat"]
            except:
                return "Name mismatch"
            
            #currently commented for use in second itteration
            # if(itemBool):
            #     jsonCatagory["State"] = False
            # else:
            #     jsonCatagory["State"] = True
            try:
                jsonCatagory["CurrentTemp"] = arguments["temp"]
            except: 
                return "Invalid Arguments"

            file.close()
            json.dump(jsonData, writefile, indent=4)
            writefile.close()
            return str(jsonCatagory["State"]) + "," + str(jsonCatagory["CurrentTemp"])


    return "Please use a supported method"