# Smart Home Dashboard

This repository contains a **smart home system prototype** with:

* **Flask backend API** for appliance control
* **React + TypeScript frontend** built with Vite
* Smart-home device endpoints for locks, lights, thermostat, garage, and more

---

# Frontend

The frontend was generated with **Lovable** and uses:

* Vite
* TypeScript
* React
* shadcn-ui
* Tailwind CSS

### Run the frontend

```bash
npm install
npm run dev
```

The frontend will start at something like:

```
http://localhost:5173
```

---

# Backend

The backend is a **Flask API server** that manages smart home device states.

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run backend

```bash
python -m flask run
```

The API will run at:

```
http://127.0.0.1:5000
```

---

# API Endpoints

Example endpoints:

* `/locks/<name>`
* `/lights/<name>`
* `/garage`
* `/thermostat`
* `/coffeeMachine`
* `/frontDoorCam`
* `/smartPlug/<name>`

Each endpoint supports:

* **GET** → retrieve state
* **PATCH** → toggle or update state

---

# Development Workflow

1. Start backend

```
python -m flask run
```

2. Start frontend

```
npm run dev
```

3. Frontend should call backend at

```
http://127.0.0.1:5000
```

---

# Tech Stack

Frontend:

* React
* TypeScript
* Vite
* Tailwind
* shadcn-ui

Backend:

* Python
* Flask
