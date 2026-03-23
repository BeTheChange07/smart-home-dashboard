import os
import json
from pywebpush import webpush, WebPushException
from filelock import FileLock

# VAPID keys - generate once with: python generate_vapid_keys.py
# Store the private key in .env, expose the public key to the frontend
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {"sub": "mailto:" + os.getenv("VAPID_EMAIL", "admin@example.com")}

SUBSCRIPTIONS_FILE = "./textFiles/push_subscriptions.json"
subscriptionLock = FileLock("./textFiles/locks/push_subscriptions.json.lock")


def _load_subscriptions():
    """Load all stored push subscriptions from disk."""
    try:
        with open(SUBSCRIPTIONS_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_subscriptions(subs):
    """Write subscriptions list to disk."""
    with open(SUBSCRIPTIONS_FILE, "w") as f:
        json.dump(subs, f, indent=4)


def add_subscription(subscription_info):
    """
    Store a new push subscription from a browser client.
    subscription_info should be the PushSubscription JSON object from the browser:
    {
        "endpoint": "https://fcm.googleapis.com/...",
        "keys": {
            "p256dh": "...",
            "auth": "..."
        }
    }
    Returns True if added, False if already exists.
    """
    with subscriptionLock:
        subs = _load_subscriptions()

        # Deduplicate by endpoint
        endpoints = {s["endpoint"] for s in subs}
        if subscription_info["endpoint"] in endpoints:
            return False

        subs.append(subscription_info)
        _save_subscriptions(subs)
        return True


def remove_subscription(endpoint):
    """Remove a subscription by its endpoint URL."""
    with subscriptionLock:
        subs = _load_subscriptions()
        subs = [s for s in subs if s["endpoint"] != endpoint]
        _save_subscriptions(subs)


def send_push_to_all(title, body, tag=None, data=None):
    """
    Send a push notification to every stored subscription.
    Automatically removes expired/invalid subscriptions.

    Args:
        title: Notification title (e.g. "Smart Home Alert")
        body: Notification body (e.g. "Front door was unlocked")
        tag: Optional tag for notification grouping/replacement
        data: Optional dict of extra data for the service worker
    """
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        print("VAPID keys not configured. Skipping push notifications.")
        return

    payload = json.dumps({
        "title": title,
        "body": body,
        "tag": tag or "smart-home",
        "icon": "/smart-home-icon.png",
        "data": data or {},
    })

    expired_endpoints = []

    with subscriptionLock:
        subs = _load_subscriptions()

    for sub in subs:
        try:
            print(f"Sending push to: {sub['endpoint'][:50]}...")
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
                timeout=10,
            )
            print("Push sent successfully")
        except WebPushException as e:
            print(f"WebPushException: {e}")

    # Clean up expired subscriptions
    if expired_endpoints:
        with subscriptionLock:
            subs = _load_subscriptions()
            subs = [s for s in subs if s["endpoint"] not in expired_endpoints]
            _save_subscriptions(subs)


def send_instant_push(reason, device_id, timestamp):
    """
    Send an immediate push notification for priority 2 (HIGH) events.
    Called from Helper.createLogInstance when priority == 2.
    """
    send_push_to_all(
        title=f"Smart Home Alert: {device_id}",
        body=reason,
        tag=f"instant-{device_id}",
        data={
            "deviceId": device_id,
            "reason": reason,
            "timestamp": timestamp,
            "priority": "HIGH",
        },
    )


def send_batch_push(batch_lines):
    """
    Send a single batched push notification for priority 1 (MED) events.
    Called from Helper.sendBatchLines during the daily scheduled job.

    Args:
        batch_lines: list of dicts with keys: reason, deviceID, timestamp
    """
    if not batch_lines:
        return

    count = len(batch_lines)
    device_summary = ", ".join(set(line["deviceID"] for line in batch_lines))

    body = f"{count} event{'s' if count > 1 else ''} from: {device_summary}"

    send_push_to_all(
        title="Smart Home Daily Summary",
        body=body,
        tag="daily-batch",
        data={
            "events": batch_lines,
            "priority": "MED",
            "count": count,
        },
    )
