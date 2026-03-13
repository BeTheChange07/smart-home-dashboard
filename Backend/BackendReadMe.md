# First time installation instructions
 1. Have NPM installed or install it
 2. (RECOMENDED) create a .venv enviorment in the root directory of the project
 3. use requirements.txt too install all requirments using "pip install -r requirements.txt"
# Startup instructions

For testing just use the "flask run" command in the Backend Directory to start up the server. It will default to http://127.0.0.1:5000


# Currently Implemented Routes

### "/"

- just responds with "This is working"

### "/locks/name"

- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne
- Responds with

### "/garage"

- Responds with

### "/lights/name"
- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne
- Responds with

### "/thermostat"

- Responds with

### "/coffeMachine"

- Responds with

### "/frontDoorCam"

- Responds with

### "/smartPlug/name"
- Takes name as URL peram, see [state.json](./state.json) for supported names. for example /locks/firstOne would be using the name firstOne
- Responds with
