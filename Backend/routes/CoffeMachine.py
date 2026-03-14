import flask
import routes.Helpers.Helper as helper
def CoffeMachine(method):
    if(method == "GET"):
        return helper.checkStateFileSingleBianaryEntity("CoffeeMachine")
    elif(method == "PATCH"):
        return helper.changeStateFileSingleBianaryEntity("CoffeeMachine")


    return "Please use a supported method"
