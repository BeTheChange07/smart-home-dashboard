import os
import json
from flask import request
from routes.Helpers.PushNotification import add_subscription, remove_subscription

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")


def Push(method):
    if method == "GET":
        # Return the VAPID public key so the frontend can subscribe
        if not VAPID_PUBLIC_KEY:
            return json.dumps({"error": "VAPID keys not configured"}), 500
        return json.dumps({"publicKey": VAPID_PUBLIC_KEY})

    elif method == "POST":
        # Store a new push subscription
        subscription = request.get_json()
        if not subscription or "endpoint" not in subscription:
            return json.dumps({"error": "Invalid subscription object"}), 400

        added = add_subscription(subscription)
        if added:
            return json.dumps({"status": "subscribed"})
        else:
            return json.dumps({"status": "already subscribed"})

    elif method == "DELETE":
        # Remove a push subscription
        data = request.get_json()
        if not data or "endpoint" not in data:
            return json.dumps({"error": "Missing endpoint"}), 400

        remove_subscription(data["endpoint"])
        return json.dumps({"status": "unsubscribed"})

    return "Please use a supported method"
