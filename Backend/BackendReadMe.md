# First time installation instructions

1.  Have NPM installed or install it
2.  (RECOMENDED) create a .venv enviorment in the root directory of the project
3.  use requirements.txt too install all requirments using "pip install -r requirements.txt" located in the textFiles directory

# Startup instructions

For testing just use the "flask run" command in the "Backend" Directory to start up the server. It will default to http://127.0.0.1:5000

# Currently Implemented Routes

## "/"

- just responds with "This is working"

## "/locks/name"

- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne

### get

- Get will respond with the status of the named entity
- true coresponds to the lock being locked
- false coresponds to the lock being unlocked

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
  -Also requires a reason url argument in the form of a string WITHOUT SPACES for exampele "This-is-the-message". It is put into the url as such: baseURL:port/locks/name?Reason=message

## "/garage"

- takes no perams

### get

- Get will respond with the status of the named entity
- true coresponds to the door being closed
- false coresponds to the door being open

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
  -Also requires a reason url argument in the form of a string WITHOUT SPACES for exampele "This-is-the-message". It is put into the url as such: baseURL:port/garage?Reason=message

## "/lights/name"

- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne

### get

- Get will respond with the status of the named entity
- true coresponds to the light being on
- false coresponds to the light being off

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
  -Also requires a reason url argument in the form of a string WITHOUT SPACES for exampele "This-is-the-message". It is put into the url as such: baseURL:port/lights/name?Reason=message

## "/thermostat"

### get

- Get will respond with the status of the thermostat in the format of a string "statusBoolean,currentTemp" so you will need to parse it
- true coresponds to the thermostat is changing temp
- false coresponds to the thermostat is idle

### patch

- Patch will update the status and current temp of the thermostat
- This is done using a url query peram named temp
- utalize this by sending a patch erquest to baseURL:port/thermostat?temp=desiredTemp
- This will return a string with "stateOfThermostat,newTemp"

## "/coffeeMachine"

- takes no perams

### get

- Get will respond with the status of the named entity
- true coresponds to the machine being on
- false coresponds to the machine being off

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
  -Also requires a reason url argument in the form of a string WITHOUT SPACES for exampele "This-is-the-message". It is put into the url as such: baseURL:port/coffeeMachine?Reason=message

## "/frontDoorCam"

- takes no perams

### get

- Get will respond with the status of the named entity
- true coresponds to the camera detecting motion
- false coresponds to the camera is idle

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
  -Also requires a reason url argument in the form of a string WITHOUT SPACES for exampele "This-is-the-message". It is put into the url as such: baseURL:port/frontDoorCam?Reason=message

## "/smartPlug/name"

- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne

### get

- Get will respond with the status of the named entity
- true coresponds to the plug being on
- false coresponds to the plug being off

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
  -Also requires a reason url argument in the form of a string WITHOUT SPACES for exampele "This-is-the-message". It is put into the url as such: baseURL:port/smartPlug/name?Reason=message

## "/state"

### get

- Returns the entire state.json file as json

## "/events"

### get

- returns the last 50 events from the events.json
