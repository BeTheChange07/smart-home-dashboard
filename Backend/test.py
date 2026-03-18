import json

f = open("events.json", "r")
events = json.load(f)

print(events[0])