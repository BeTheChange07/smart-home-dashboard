# First time installation instructions

1.  Have NPM installed or install it
2.  (RECOMENDED) create a .venv enviorment in the root directory of the project
3.  use requirements.txt too install all requirments using "pip install -r requirements.txt"

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

## "/garage"

- Responds with

## "/lights/name"

- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne

### get

- Get will respond with the status of the named entity
- true coresponds to the light being on
- false coresponds to the light being off

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)

## "/thermostat"

- Responds with

## "/coffeMachine"

- Responds with

## "/frontDoorCam"

- Responds with

## "/smartPlug/name"

- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne

### get

- Get will respond with the status of the named entity
- true coresponds to the plug being on
- false coresponds to the plug being off

### patch

- Patch will flip the status of the named entity (see above for corespondance of T/F)
