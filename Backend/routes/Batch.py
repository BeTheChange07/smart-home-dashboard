import routes.Helpers.Helper as helper
def Batch(method):
    if(method == "GET"):
        return helper.sendBatchLines()
    elif(method == "PATCH"):
        return "Please use a supported method"

    return "Please use a supported method"