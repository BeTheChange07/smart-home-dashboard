import json
import routes.Helpers.Helper as helper
from filelock import Timeout, FileLock



stateLock = FileLock("./textFiles/locks/state.json.lock")



def Prio(method, argsDict):
    if(method == "PATCH"):

        argCount = len(argsDict.to_dict().keys())

        # this means we are only working with a bianray entity
        if(argCount == 2):
            with stateLock:
                with open("state.json", 'r') as file:
                    jsonData = json.load(file)
                try:
                    jsonCatagory = jsonData[argsDict["category"]]
                except:
                    return "Name mismatch"

                try:
                    jsonCatagory["Prio"] = int(argsDict["prio"])
                except:
                    return "no prio specified"
                

                with open("state.json", "w") as writefile:
                    json.dump(jsonData, writefile, indent=4)


                return str(jsonCatagory["Prio"])

        # This means we are working with a named entity
        elif(argCount == 3):
            with stateLock:
                with open("state.json", 'r') as file:
                    jsonData = json.load(file)
                for item in jsonData[argsDict["category"]]:
                    if(item["Id"] == argsDict["name"]):
                        item["Prio"] = int(argsDict["prio"])
                        with open("state.json", "w") as writefile:
                            json.dump(jsonData, writefile, indent=4)

                        return str(item["Prio"])
                return "name not found"


    return "Please use a supported method"
