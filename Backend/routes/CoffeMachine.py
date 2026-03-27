import routes.Helpers.Helper as helper
def CoffeMachine(method, argsDict):
    if(method == "GET"):
        return helper.checkStateFileSingleBianaryEntity("CoffeeMachine")
    elif(method == "PATCH"):
        return helper.changeStateFileSingleBianaryEntity("CoffeeMachine", argsDict)


    return "Please use a supported method"
