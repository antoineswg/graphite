# Graphite

A Flask-based web interface for automating Discord messages with multiple operational modes.

## Project Structure

```
graphite/
├── auto_message_customizable.py  # Flask backend with bot logic
├── requirements.txt               # Python dependencies
├── templates/
│   └── index.html                 # Main HTML template (clean, no inline code)
└── static/
    ├── css/                       # Stylesheets
    │   ├── variables.css          # CSS custom properties (colors)
    │   ├── animations.css         # Keyframe animations
    │   ├── layout.css             # Main layout and structure
    │   ├── forms.css              # Form inputs and labels
    │   ├── buttons.css            # Button styles with hover effects
    │   ├── chips.css              # Chip/tag components
    │   ├── modes.css              # Mode selector and config panels
    │   ├── console.css            # Console window styling
    │   └── responsive.css         # Mobile breakpoints
    └── js/                        # JavaScript modules
        ├── state.js               # Global state variables
        ├── api.js                 # API communication functions
        ├── ui.js                  # UI update functions
        ├── bot.js                 # Bot control functions
        └── main.js                # Initialization and polling
```

## Features

- **Three Operational Modes:**

  - **Spam Mode**: Send messages at regular intervals (default)
  - **Scheduled Mode**: Send messages at specific times throughout the day
  - **Random Window Mode**: Send a specified number of messages randomly within a time window

- **Multi-Message Support**: Configure multiple messages and the bot will randomly select one to send
- **Optional Delay**: Add a random delay (5-40 seconds) before sending each message
- **Multi-User Support**: Session-based storage allows multiple users to run the bot simultaneously
- **Real-Time Console**: Monitor bot activity in real-time through the web interface
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Setup

1. Install Python 3.7 or higher
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Run the Flask app:

   ```
   python auto_message_customizable.py
   ```

2. Open your browser and go to `http://localhost:5000`

3. Configure the bot:
   - Enter your Discord token and channel ID
   - Add one or more messages
   - Select a mode and configure its settings
   - (Optional) Enable random delay before sending
   - Click "Start" to begin

## Important Notes

⚠️ **WARNING**: This tool uses selfbot functionality which violates Discord's Terms of Service. Account termination is possible. You've been warned, do not blame me.
