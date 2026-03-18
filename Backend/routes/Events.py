import json
import routes.Helpers.Helper as helper
from filelock import Timeout, FileLock

eventLock = FileLock("./textFiles/locks/event.json.lock")


def Events(method):
    if(method == "GET"):
        with eventLock:
            try:
                with open("events.json", "r") as f:
                    return json.load(f)
            except FileNotFoundError:
                return "events.json not found"
    elif(method == "PATCH"):
        # event = request.get_json()
        # try:
        #     with open("events.json", "r") as f:
        #         events = json.load(f)
        # except FileNotFoundError:
        #     events = []

        # events.insert(0, event)
        # events = events[:50]  # keep max 50

        # with open("events.json", "w") as f:
        #     json.dump(events, f, indent=4)

        # return event
        return "This method is depricated, events are handles server side"

    return "Please use a supported method"