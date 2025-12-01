import requests
import time
import random
import threading
import uuid
from datetime import datetime, time as dt_time
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = "discord-bot-" + str(uuid.uuid4())

sessions_data = {}
max_logs = 500


def get_default_config():
    """Get default configuration object"""
    return {
        "token": "",
        "channel_id": "",
        "messages": [],
        "mode": "spam",
        "delay_enabled": False,
        "min_delay": 0,
        "max_delay": 0,
        "send_times": [],
        "spam_interval": 60,
        "window_start": "09:00",
        "window_end": "17:00",
        "messages_count": 10,
        "dry_run": False,
    }


def get_session_data():
    """Get or create session data for current session"""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())

    session_id = session["session_id"]

    if session_id not in sessions_data:
        sessions_data[session_id] = {
            "accounts": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Config 1",
                    "config": get_default_config(),
                }
            ],
            "active_account_id": None,
            "bot_running": False,
            "stop_bot": False,
            "bot_thread": None,
            "console_logs": [],
        }
        sessions_data[session_id]["active_account_id"] = sessions_data[session_id][
            "accounts"
        ][0]["id"]

    return sessions_data[session_id]


def get_active_account(session_data):
    """Get the currently active account"""
    active_id = session_data.get("active_account_id")
    for account in session_data["accounts"]:
        if account["id"] == active_id:
            return account
    return session_data["accounts"][0] if session_data["accounts"] else None


def log(message, session_id):
    """Log message to both console and web interface"""
    if session_id not in sessions_data:
        return

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    print(f"[Session {session_id[:8]}] {log_entry}")
    sessions_data[session_id]["console_logs"].append(log_entry)
    if len(sessions_data[session_id]["console_logs"]) > max_logs:
        sessions_data[session_id]["console_logs"] = sessions_data[session_id][
            "console_logs"
        ][-max_logs:]


def get_random_message(config):
    """Get a random message from the messages list"""
    if not config["messages"]:
        return ""
    return random.choice(config["messages"])


def trigger_typing(token, channel_id):
    """Trigger typing indicator in a Discord channel"""
    url = f"https://discord.com/api/v9/channels/{channel_id}/typing"
    headers = {"Authorization": token}

    try:
        requests.post(url, headers=headers)
    except Exception:
        pass


def send_message(token, channel_id, message, session_id, dry_run=False):
    """Send a message to a Discord channel"""
    if dry_run:
        log(f"[DRY RUN] Would send message: {message}", session_id)
        return True

    url = f"https://discord.com/api/v9/channels/{channel_id}/messages"
    headers = {"Authorization": token, "Content-Type": "application/json"}
    data = {"content": message}

    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            log(f"Sent: {message}", session_id)
            return True
        else:
            log(f"Failed to send message. Status: {response.status_code}", session_id)
            log(f"Response: {response.text}", session_id)
            return False
    except Exception as e:
        log(f"Error: {str(e)}", session_id)
        return False


def get_next_send_time(config):
    """Get the next scheduled send time"""
    if not config["send_times"]:
        return None

    now = datetime.now()
    today = now.date()

    for send_time in config["send_times"]:
        hour, minute = map(int, send_time.split(":"))
        scheduled = datetime.combine(today, dt_time(hour, minute))
        if scheduled > now:
            return scheduled

    from datetime import timedelta

    tomorrow = today + timedelta(days=1)
    hour, minute = map(int, config["send_times"][0].split(":"))
    return datetime.combine(tomorrow, dt_time(hour, minute))


def apply_delay(config, session_data, session_id):
    """Apply random delay if enabled"""
    if config["delay_enabled"]:
        delay = random.randint(config["min_delay"], config["max_delay"])
        log(f"Adding random delay of {delay} seconds before sending...", session_id)

        if not config.get("dry_run", False):
            trigger_typing(config["token"], config["channel_id"])

        elapsed = 0
        next_typing = 9

        while elapsed < delay and not session_data["stop_bot"]:
            sleep_time = min(0.1, delay - elapsed)
            time.sleep(sleep_time)
            elapsed += sleep_time

            if not config.get("dry_run", False) and elapsed >= next_typing:
                trigger_typing(config["token"], config["channel_id"])
                next_typing += 9

        return session_data["stop_bot"]
    return False


def run_scheduled_mode(config, session_data, session_id):
    """Run bot in scheduled times mode"""
    log(f"Mode: Scheduled Times", session_id)
    log(f"Send Times:", session_id)
    for t in config["send_times"]:
        log(f"  - {t}", session_id)

    while not session_data["stop_bot"]:
        next_send = get_next_send_time(config)
        if not next_send:
            log("No send times configured. Waiting...", session_id)
            time.sleep(10)
            continue

        now = datetime.now()
        wait_seconds = (next_send - now).total_seconds()

        delay_info = ""
        if config["delay_enabled"]:
            delay_info = (
                f" (+ {config['min_delay']}-{config['max_delay']}s random delay)"
            )

        log(
            f"Next message scheduled for: {next_send.strftime('%Y-%m-%d %H:%M:%S')}{delay_info}",
            session_id,
        )
        log(f"Waiting {wait_seconds/3600:.2f} hours...", session_id)

        elapsed = 0
        while elapsed < wait_seconds and not session_data["stop_bot"]:
            sleep_time = min(1, wait_seconds - elapsed)
            time.sleep(sleep_time)
            elapsed += sleep_time

        if session_data["stop_bot"]:
            break

        if apply_delay(config, session_data, session_id):
            break

        message = get_random_message(config)
        send_message(
            config["token"],
            config["channel_id"],
            message,
            session_id,
            config.get("dry_run", False),
        )


def run_spam_mode(config, session_data, session_id):
    """Run bot in spam mode (continuous sending with interval)"""
    log(f"Mode: Spam", session_id)
    log(f"Interval: {config['spam_interval']} seconds between messages", session_id)

    while not session_data["stop_bot"]:
        if apply_delay(config, session_data, session_id):
            break

        message = get_random_message(config)
        send_message(
            config["token"],
            config["channel_id"],
            message,
            session_id,
            config.get("dry_run", False),
        )

        elapsed = 0
        interval = config["spam_interval"]
        while elapsed < interval and not session_data["stop_bot"]:
            sleep_time = min(1, interval - elapsed)
            time.sleep(sleep_time)
            elapsed += sleep_time


def run_random_window_mode(config, session_data, session_id):
    """Run bot in random window mode (X messages randomly within time window)"""
    from datetime import timedelta

    log(f"Mode: Random Window", session_id)
    log(f"Window: {config['window_start']} - {config['window_end']}", session_id)
    log(f"Messages: {config['messages_count']} messages", session_id)

    start_hour, start_min = map(int, config["window_start"].split(":"))
    end_hour, end_min = map(int, config["window_end"].split(":"))

    today = datetime.now().date()
    window_start = datetime.combine(today, dt_time(start_hour, start_min))
    window_end = datetime.combine(today, dt_time(end_hour, end_min))

    if datetime.now() > window_end:
        tomorrow = today + timedelta(days=1)
        window_start = datetime.combine(tomorrow, dt_time(start_hour, start_min))
        window_end = datetime.combine(tomorrow, dt_time(end_hour, end_min))
    elif datetime.now() < window_start:
        wait_seconds = (window_start - datetime.now()).total_seconds()
        log(
            f"Waiting until window starts: {window_start.strftime('%Y-%m-%d %H:%M:%S')}",
            session_id,
        )
        elapsed = 0
        while elapsed < wait_seconds and not session_data["stop_bot"]:
            sleep_time = min(1, wait_seconds - elapsed)
            time.sleep(sleep_time)
            elapsed += sleep_time

    if session_data["stop_bot"]:
        return

    window_duration = (window_end - window_start).total_seconds()
    send_times = sorted(
        [
            window_start.timestamp() + random.uniform(0, window_duration)
            for _ in range(config["messages_count"])
        ]
    )

    log(f"Generated {len(send_times)} random send times within window", session_id)

    for send_time in send_times:
        if session_data["stop_bot"]:
            break

        send_datetime = datetime.fromtimestamp(send_time)
        now = datetime.now()

        if send_datetime > now:
            wait_seconds = (send_datetime - now).total_seconds()

            delay_info = ""
            if config["delay_enabled"]:
                delay_info = (
                    f" (+ {config['min_delay']}-{config['max_delay']}s random delay)"
                )

            log(
                f"Next message at: {send_datetime.strftime('%Y-%m-%d %H:%M:%S')}{delay_info}",
                session_id,
            )
            log(f"Waiting {wait_seconds/60:.1f} minutes...", session_id)

            elapsed = 0
            while elapsed < wait_seconds and not session_data["stop_bot"]:
                sleep_time = min(1, wait_seconds - elapsed)
                time.sleep(sleep_time)
                elapsed += sleep_time

        if session_data["stop_bot"]:
            break

        if apply_delay(config, session_data, session_id):
            break

        message = get_random_message(config)
        send_message(
            config["token"],
            config["channel_id"],
            message,
            session_id,
            config.get("dry_run", False),
        )

    log("All messages sent for this window. Stopping bot.", session_id)


def run_bot(session_id):
    """Main bot loop"""
    session_data = sessions_data[session_id]
    config = session_data["config"]

    log("=" * 50, session_id)
    log("Auto Message Bot Started", session_id)
    log(f"Token: {config['token'][:20]}...", session_id)
    log(f"Channel ID: {config['channel_id']}", session_id)
    if len(config["messages"]) == 1:
        log(f"Message: {config['messages'][0]}", session_id)
    else:
        log(
            f"Messages: {len(config['messages'])} messages (random selection)",
            session_id,
        )
        for i, msg in enumerate(config["messages"][:3], 1):
            log(
                f"  {i}. {msg[:50]}..." if len(msg) > 50 else f"  {i}. {msg}",
                session_id,
            )
        if len(config["messages"]) > 3:
            log(f"  ... and {len(config['messages']) - 3} more", session_id)
    if config["delay_enabled"]:
        log(f"Delay: {config['min_delay']}-{config['max_delay']} seconds", session_id)
    else:
        log(f"Delay: Disabled", session_id)
    if config.get("dry_run", False):
        log(f"DRY RUN MODE: Messages will NOT be sent to Discord", session_id)
    log("=" * 50, session_id)

    try:
        if config["mode"] == "scheduled":
            run_scheduled_mode(config, session_data, session_id)
        elif config["mode"] == "spam":
            run_spam_mode(config, session_data, session_id)
        elif config["mode"] == "random_window":
            run_random_window_mode(config, session_data, session_id)
        else:
            log(f"Unknown mode: {config['mode']}", session_id)
    finally:
        session_data["bot_running"] = False
        session_data["stop_bot"] = False
        log("Bot stopped.", session_id)


@app.route("/")
def index():
    """Serve the web interface"""
    return render_template("index.html")


@app.route("/api/config", methods=["GET"])
def get_config():
    """Get current configuration"""
    session_data = get_session_data()
    active_account = get_active_account(session_data)
    config = active_account["config"] if active_account else get_default_config()
    return jsonify(
        {
            "token": config["token"],
            "channel_id": config["channel_id"],
            "messages": config["messages"],
            "mode": config["mode"],
            "delay_enabled": config["delay_enabled"],
            "min_delay": config["min_delay"],
            "max_delay": config["max_delay"],
            "send_times": config["send_times"],
            "spam_interval": config["spam_interval"],
            "window_start": config["window_start"],
            "window_end": config["window_end"],
            "messages_count": config["messages_count"],
            "dry_run": config.get("dry_run", False),
            "bot_running": session_data["bot_running"],
        }
    )


@app.route("/api/config", methods=["POST"])
def update_config():
    """Update configuration"""
    session_data = get_session_data()
    session_id = session["session_id"]
    active_account = get_active_account(session_data)
    if not active_account:
        return jsonify({"success": False, "message": "No active account"}), 400
    config = active_account["config"]

    try:
        data = request.json
    except Exception as e:
        error_msg = f"Invalid configuration data: {str(e)}"
        log(f"Configuration Error: {error_msg}", session_id)
        return jsonify({"success": False, "message": error_msg}), 400

    data = request.json
    config["token"] = data.get("token", config["token"])
    config["channel_id"] = data.get("channel_id", config["channel_id"])
    config["messages"] = data.get("messages", config["messages"])
    config["mode"] = data.get("mode", config["mode"])
    config["delay_enabled"] = data.get("delay_enabled", config["delay_enabled"])

    min_delay_val = data.get("min_delay", config["min_delay"])
    config["min_delay"] = (
        int(min_delay_val) if min_delay_val != "" and min_delay_val is not None else 0
    )
    max_delay_val = data.get("max_delay", config["max_delay"])
    config["max_delay"] = (
        int(max_delay_val) if max_delay_val != "" and max_delay_val is not None else 0
    )

    if config["delay_enabled"] and config["min_delay"] > config["max_delay"]:
        error_msg = "Minimum delay cannot be greater than maximum delay"
        log(f"Configuration Warning: {error_msg}", session_id)
        config["min_delay"], config["max_delay"] = (
            config["max_delay"],
            config["min_delay"],
        )

    config["send_times"] = data.get("send_times", config["send_times"])

    spam_interval_val = data.get("spam_interval", config["spam_interval"])
    config["spam_interval"] = (
        int(spam_interval_val)
        if spam_interval_val != "" and spam_interval_val is not None
        else 60
    )

    config["window_start"] = data.get("window_start", config["window_start"])
    config["window_end"] = data.get("window_end", config["window_end"])

    messages_count_val = data.get("messages_count", config["messages_count"])
    config["messages_count"] = (
        int(messages_count_val)
        if messages_count_val != "" and messages_count_val is not None
        else 10
    )

    config["dry_run"] = data.get("dry_run", config.get("dry_run", False))

    log("Configuration updated successfully", session_id)
    return jsonify({"success": True, "message": "Configuration updated"})


@app.route("/api/start", methods=["POST"])
def start_bot():
    """Start the bot"""
    session_data = get_session_data()
    session_id = session["session_id"]
    active_account = get_active_account(session_data)
    if not active_account:
        return jsonify({"success": False, "message": "No active account"}), 400
    config = active_account["config"]

    if session_data["bot_running"]:
        return jsonify({"success": False, "message": "Bot is already running"})

    if not config["token"] or not config["channel_id"]:
        error_msg = "Token and Channel ID are required"
        log(f"Configuration Error: {error_msg}", session_id)
        return jsonify({"success": False, "message": error_msg})

    if not config["messages"]:
        error_msg = "At least one message is required"
        log(f"Configuration Error: {error_msg}", session_id)
        return jsonify({"success": False, "message": error_msg})

    if config["mode"] == "scheduled" and not config["send_times"]:
        error_msg = "At least one send time is required for scheduled mode"
        log(f"Configuration Error: {error_msg}", session_id)
        return jsonify(
            {
                "success": False,
                "message": error_msg,
            }
        )
    elif config["mode"] == "spam" and config["spam_interval"] <= 0:
        error_msg = "Spam interval must be greater than 0"
        log(f"Configuration Error: {error_msg}", session_id)
        return jsonify({"success": False, "message": error_msg})
    elif config["mode"] == "random_window":
        if not config["window_start"] or not config["window_end"]:
            error_msg = "Window start and end times are required"
            log(f"Configuration Error: {error_msg}", session_id)
            return jsonify({"success": False, "message": error_msg})
        if config["messages_count"] <= 0:
            error_msg = "Messages count must be greater than 0"
            log(f"Configuration Error: {error_msg}", session_id)
            return jsonify({"success": False, "message": error_msg})

    session_data["stop_bot"] = False
    session_data["bot_running"] = True
    session_data["bot_thread"] = threading.Thread(
        target=run_bot, args=(session_id,), daemon=True
    )
    session_data["bot_thread"].start()

    return jsonify({"success": True, "message": "Bot started"})


@app.route("/api/stop", methods=["POST"])
def stop_bot_endpoint():
    """Stop the bot"""
    session_data = get_session_data()

    if not session_data["bot_running"]:
        return jsonify({"success": False, "message": "Bot is not running"})

    session_data["stop_bot"] = True
    return jsonify({"success": True, "message": "Bot stopping..."})


@app.route("/api/logs", methods=["GET"])
def get_logs():
    """Get console logs"""
    session_data = get_session_data()
    return jsonify({"logs": session_data["console_logs"]})


@app.route("/api/accounts", methods=["GET"])
def get_accounts():
    """Get all accounts"""
    session_data = get_session_data()
    return jsonify(
        {
            "accounts": session_data["accounts"],
            "active_account_id": session_data["active_account_id"],
        }
    )


@app.route("/api/accounts", methods=["POST"])
def create_account():
    """Create a new account"""
    session_data = get_session_data()
    data = request.json

    new_account = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", f"Account {len(session_data['accounts']) + 1}"),
        "config": get_default_config(),
    }

    session_data["accounts"].append(new_account)
    return jsonify({"success": True, "account": new_account})


@app.route("/api/accounts/<account_id>", methods=["PUT"])
def update_account(account_id):
    """Update account name"""
    session_data = get_session_data()
    data = request.json

    for account in session_data["accounts"]:
        if account["id"] == account_id:
            account["name"] = data.get("name", account["name"])
            return jsonify({"success": True, "account": account})

    return jsonify({"success": False, "message": "Account not found"}), 404


@app.route("/api/accounts/<account_id>", methods=["DELETE"])
def delete_account(account_id):
    """Delete an account"""
    session_data = get_session_data()

    if len(session_data["accounts"]) <= 1:
        return (
            jsonify({"success": False, "message": "Cannot delete the last account"}),
            400,
        )

    for i, account in enumerate(session_data["accounts"]):
        if account["id"] == account_id:
            if session_data["active_account_id"] == account_id:
                session_data["active_account_id"] = session_data["accounts"][
                    0 if i == 0 else i - 1
                ]["id"]
            session_data["accounts"].pop(i)
            return jsonify({"success": True})

    return jsonify({"success": False, "message": "Account not found"}), 404


@app.route("/api/accounts/<account_id>/activate", methods=["POST"])
def activate_account(account_id):
    """Set active account"""
    session_data = get_session_data()

    if session_data["bot_running"]:
        return (
            jsonify(
                {"success": False, "message": "Stop the bot before switching accounts"}
            ),
            400,
        )

    for account in session_data["accounts"]:
        if account["id"] == account_id:
            session_data["active_account_id"] = account_id
            return jsonify({"success": True, "account": account})

    return jsonify({"success": False, "message": "Account not found"}), 404


if __name__ == "__main__":
    print("Starting Discord Auto Message Bot Web Interface...")
    print("Open your browser to: http://localhost:5000")
    app.run(debug=False, host="0.0.0.0", port=5000)
