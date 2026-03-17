import json
from filelock import Timeout, FileLock

#this is the lockfile definition to ensure we dont corrupt the file trying to 
#write to it if accessed too many times
lock = FileLock("./textFiles/locks/state.json.lock")


#this function takes the title af the JSON object and the name of the specific
#object that you are looking for. It will either return the object state or return an 
# error message if nothing is found

#inputs:
# category: the catagory of objects name as a string (ie "Lights", "smartPlug", "Locks")
#name: name of the specific item you want
def checkStateFileNamedEntity(category: str, name: str):
    with lock:
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
def changeStateFileNamedEntity(category: str, name: str):
    with lock:
        with open("state.json", 'r') as file:
            jsonData = json.load(file)
        for item in jsonData[category]:
            if(item["Id"] == name):
                item["State"] = not item["State"]
                with open("state.json", "w") as writefile:
                    json.dump(jsonData, writefile, indent=4)
                return str(item["State"])
        return "name not found"


#this function takes the title of a JSON object 
#object that you are looking to for. It will either return the state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (anything but "Lights", "smartPlug", "Locks")
def changeStateFileSingleBianaryEntity(category: str):
    with lock:
        with open("state.json", 'r') as file:
            jsonData = json.load(file)
        try:
            jsonCatagory = jsonData[category]
            itemBool = jsonCatagory["State"]
        except:
            return "Name mismatch"

        jsonCatagory["State"] = not itemBool
        with open("state.json", "w") as writefile:
            json.dump(jsonData, writefile, indent=4)
        return str(jsonCatagory["State"])

#this function takes the title of a JSON object of the specific
#object that you are looking to update. It will either return the new state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (anyhting but "Lights", "smartPlug", "Locks")
def changeStateFileSingleBianaryEntity(category: str):
    with lock:
        file = open("state.json", 'r')
        jsonData = json.load(file)
        writefile = open("state.json", "w")
        try:
            jsonCatagory = jsonData[category]
            itemBool = jsonCatagory["State"]
        except:
            return "Name mismatch"
    

        if(itemBool):
            jsonCatagory["State"] = False
        else:
            jsonCatagory["State"] = True

        file.close()
        json.dump(jsonData, writefile, indent=4)
        writefile.close()
        return str(jsonCatagory["State"])