import json


#this function takes the title af the JSON object and the name of the specific
#object that you are looking for. It will either return the object state or return an 
# error message if nothing is found

#inputs:
# category: the catagory of objects name as a string (ie "Lights", "smartPlug", "Locks")
#name: name of the specific item you want
def checkStateFileNamedEntity(category: str, name: str):
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
    file = open("state.json", 'r')
    jsonData = json.load(file)
    writefile = open("state.json", "w")
    for item in jsonData[category]:
        file.close()
        if(item["Id"] == name):
            itemBool = item["State"]
            if(itemBool):
                item["State"] = False
            else:
                item["State"] = True
            json.dump(jsonData, writefile, indent=4)
            writefile.close()
            return str(item["State"])
        
    file.close()
    json.dump(jsonData, writefile, indent=4)
    writefile.close()
    return "name not found"


#this function takes the title of a JSON object 
#object that you are looking to for. It will either return the state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (anything but "Lights", "smartPlug", "Locks")
def checkStateFileSingleBianaryEntity(category: str):
    file = open("state.json", 'r')
    jsonData = json.load(file)
    jsonCatagory = jsonData[category]
    file.close()
    try:
        return str(jsonCatagory["State"])
    except:
        return "Name mismatch"

#this function takes the title of a JSON object of the specific
#object that you are looking to update. It will either return the new state of
#of the object or it will return an error message

#inputs:
# category: the catagory of objects name as a string (anyhting but "Lights", "smartPlug", "Locks")
def changeStateFileSingleBianaryEntity(category: str):
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