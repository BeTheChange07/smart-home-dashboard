import os
import requests

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")


def sendDiscordNotification(reason, deviceId, timestamp):
    if not DISCORD_WEBHOOK_URL:
        return

    payload = {
        "embeds": [
            {
                "title": "Smart Home Event",
                "color": 3447003,
                "fields": [
                    {"name": "Device", "value": deviceId, "inline": True},
                    {"name": "Reason", "value": reason, "inline": True},
                    {"name": "Time", "value": timestamp, "inline": False}
                ]
            }
        ]
    }

    try:
        requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=5)
    except Exception as e:
        print(f"Discord notification failed: {e}")