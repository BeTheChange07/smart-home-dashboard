import json
from filelock import Timeout, FileLock
import time, datetime, uuid

from routes.Helpers.Discord import sendDiscordNotification

#this is the lockfile definition to ensure we dont corrupt the file trying to 
#write to it if accessed too many times
stateLock = FileLock("./textFiles/locks/state.json.lock")
eventLock = FileLock("./textFiles/locks/event.json.lock")

#this function takes the title af the JSON object and the name of the specific
#object that you are looking for. It will either return the object state or return an 
# error message if nothing is found

#inputs:
# category: the catagory of objects name as a string (ie "Lights", "smartPlug", "Locks")
#name: name of the specific item you want
def checkStateFileNamedEntity(category: str, name: str):
    with stateLock:
        file = open("state.json", 'r')
        jsonData = json.load(file)
        for item in jsonData[category]:
            if(item["Id"] == name):
                file.close()
                return str(item["State"])
        file.close()
        return "name not found"

#this function takes the title of a JSON object and the name of the specific
#object that you are looking to update. It will either return the new state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (ie "Lights", "smartPlug", "Locks")
#name: name of the specific item you want
def changeStateFileNamedEntity(category: str, name: str, argsDict):
    with stateLock:
        with open("state.json", 'r') as file:
            jsonData = json.load(file)
        for item in jsonData[category]:
            if(item["Id"] == name):
                item["State"] = not item["State"]
                itemPrio = item["Prio"]
                with open("state.json", "w") as writefile:
                    json.dump(jsonData, writefile, indent=4)

                try:
                    createLogInstance(argsDict["Reason"], (category + '-' + item["Id"]), itemPrio)
                except:
                    createLogInstance("No Reason Provided", (category + '-' + item["Id"]), itemPrio)


                return str(item["State"])
        return "name not found"


#this function takes the title of a JSON object 
#object that you are looking to for. It will either return the state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (anything but "Lights", "smartPlug", "Locks")
def checkStateFileSingleBianaryEntity(category: str):
    with stateLock:
        file = open("state.json", 'r')
        jsonData = json.load(file)
        try:
            jsonCatagory = jsonData[category]
            return str(jsonCatagory["State"])
        except:
            return "Name Mismatch"

        

#this function takes the title of a JSON object of the specific
#object that you are looking to update. It will either return the new state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (anyhting but "Lights", "smartPlug", "Locks")

def changeStateFileSingleBianaryEntity(category: str, argsDict):
    with stateLock:
        with open("state.json", 'r') as file:
            jsonData = json.load(file)
        try:
            jsonCatagory = jsonData[category]
            itemBool = jsonCatagory["State"]
            itemPrio = jsonCatagory["Prio"]
        except:
            return "Name mismatch"

        jsonCatagory["State"] = not itemBool
        with open("state.json", "w") as writefile:
            json.dump(jsonData, writefile, indent=4)

        try:
            createLogInstance(argsDict["Reason"], category, itemPrio)
        except:
            createLogInstance("No Reason Provided", category, itemPrio)

        return str(jsonCatagory["State"])
    

#this function creates a log instance for a event
def createLogInstance(reason, deviceId, priority):
    with eventLock:
        with open("events.json", "r") as f:
            events = json.load(f)


        timestamp = datetime.datetime.now().strftime("%B %d %Y %H %M %S")



        event = {
            "id": str(uuid.uuid1()),
            "time": timestamp,
            "message": reason,
            "deviceID": deviceId
        }

        events.insert(0, event)
        events = events[:50]  # keep max 50

        with open("events.json", "w") as f:
            json.dump(events, f, indent=4)

    # send discord notification for prio 2 and batches lies for prio 1 does nothing for prio 0
    match priority:  
        case 1:
            createBatchLine(reason, deviceId, timestamp)
        case 2:
            sendDiscordNotification(reason, deviceId, timestamp)


def createBatchLine(reason, deviceID, timestamp):
    file = open("./textFiles/batchMessage.txt", 'a')
    file.write(reason + "," + deviceID + "," + timestamp + "\n")
    file.close()