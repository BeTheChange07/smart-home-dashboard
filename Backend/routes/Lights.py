import json

def Lights(method, name):
    if(method == "GET"):
        file = open("state.json", 'r')
        jsonData = json.load(file)
        for item in jsonData["Lights"]:
            if(item["Id"] == name):
                file.close()
                return str(item["State"])
        file.close()
        return "name not found"

    elif(method == "PATCH"):
        file = open("state.json", 'r')
        jsonData = json.load(file)
        writefile = open("state.json", "w")
        for item in jsonData["Lights"]:
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

    return "Please use a supported method"