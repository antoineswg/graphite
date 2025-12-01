# Graphite

A modern Flask-based web interface for automating Discord messages with multiple operational modes and configuration management.

## Project Structure

```
graphite/
├── auto_message.py                # Flask backend with bot logic
├── requirements.txt               # Python dependencies
├── templates/
│   └── index.html                 # Main HTML template
└── static/
    ├── css/                       # Stylesheets
    │   ├── variables.css          # CSS custom properties (theme colors & font sizes)
    │   ├── animations.css         # Keyframe animations
    │   ├── layout.css             # Main layout and structure
    │   ├── forms.css              # Form inputs and labels
    │   ├── buttons.css            # Button styles with hover effects
    │   ├── chips.css              # Chip/tag components
    │   ├── modes.css              # Mode selector and config panels
    │   ├── console.css            # Console window styling
    │   ├── modal.css              # Modal dialogs
    │   ├── configs.css            # Config management UI
    │   └── responsive.css         # Mobile breakpoints
    └── js/                        # JavaScript modules
        ├── state.js               # Global state variables
        ├── configs.js             # Config management functions
        ├── api.js                 # API communication & auto-save
        ├── ui.js                  # UI update functions
        ├── bot.js                 # Bot control functions
        └── main.js                # Initialization and keyboard shortcuts
```

## Features

### Core Functionality
- **Three Operational Modes:**
  - **Spam Mode**: Send messages at regular intervals
  - **Scheduled Mode**: Send messages at specific times throughout the day
  - **Random Window Mode**: Send a specified number of messages randomly within a time window

- **Multi-Message Support**: Configure multiple messages and the bot will randomly select one to send
- **Optional Delay**: Add a random delay before sending each message
- **Dry Run Mode**: Test your configuration without actually sending messages to Discord
- **Real-Time Console**: Monitor bot activity in real-time through the web interface

### Configuration Management
- **Multi-Config Support**: Create and manage multiple Discord configurations
- **Quick Switching**: Easily switch between different configs
- **Auto-Save**: Configurations automatically save as you make changes
- **Inline Rename**: Click to rename configs directly in the manager
- **Config Isolation**: Each config maintains its own token, messages, and settings

### User Interface
- **Dark/Light Theme**: Toggle between themes with persistent storage
- **Keyboard Shortcuts**: Comprehensive shortcuts for all actions
  - `SPACE` - Start/Stop bot
  - `H` - Show shortcuts help
  - `T` - Toggle theme
  - `1/2/3` - Switch operation modes
  - `CTRL+K/L/M` - Focus input fields
  - `CTRL+Enter` - Add message
  - `ESC` - Close modals
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Modern Design**: Monochrome terminal aesthetic with JetBrains Mono font
- **Session-Based**: Multiple users can run the bot simultaneously

## Setup

1. Install Python 3.7 or higher
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Run the Flask app:

   ```bash
   python auto_message.py
   ```

2. Open your browser and go to `http://localhost:5000`

3. Configure your first config:
   - Enter your Discord token and channel ID
   - Add one or more messages to the message pool
   - Select an operation mode (Spam/Scheduled/Random Window)
   - Configure mode-specific settings
   - (Optional) Enable random delay before sending
   - (Optional) Enable dry run mode to test without sending

4. Start the bot:
   - Click "Start" or press `SPACE`
   - Monitor activity in the real-time console
   - Stop anytime with "Stop" button or `SPACE`

5. Manage multiple configs:
   - Click "Manage" to open the Config Manager
   - Create new configs with the "+ Add New Config" button
   - Switch between configs by clicking on them
   - Rename configs with inline editing
   - Delete configs you no longer need (requires at least one config)

## Deployment

### Local Development
Already set up! Just run `python auto_message.py`

### 24/7 Hosting Options

**Free Options:**
- **Render.com** - 750 hours/month free (sleeps after 15min inactivity)
- **Railway.app** - 500 hours/month free
- **Oracle Cloud** - Always Free tier (2 VMs forever)
- **Google Cloud** - Free tier for small VMs

**Note:** Most web hosting services (like Hostinger) don't support long-running Python processes. You need a VPS or cloud platform that allows persistent Python applications.

### Render.com Deployment

1. Push your code to GitHub
2. Create account on [render.com](https://render.com)
3. Create new "Web Service" and connect your repo
4. Render auto-detects Flask and deploys automatically

**Optional:** Add `render.yaml` to your repo:
```yaml
services:
  - type: web
    name: graphite
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python auto_message.py
```

## Important Notes

⚠️ **WARNING**: This tool uses selfbot functionality which violates Discord's Terms of Service. Account termination is possible. Use at your own risk.

⚠️ **Disclaimer**: This project is for educational purposes. The developer is not responsible for any consequences resulting from the use of this tool.
