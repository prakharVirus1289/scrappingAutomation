# 🖱️ Web Action Recorder & Replayer (Puppeteer Automation)

A browser automation tool that records your manual interactions on a webpage (clicks, typing, navigation, scrolling, selections, etc.) and replays them later to automate tasks like **data scraping**, **UI testing**, or **repetitive workflows** — all without manually writing CSS selectors.

## 🚀 Features

✅ **Interactive action recording**
✅ Records navigation, clicks, scrolls, typing, text selections, and more
✅ **Replays all actions** in sequence, with timing preserved
✅ Automatically waits for elements before interaction
✅ Saves/loads recordings to/from JSON files
✅ **Headless or visible browser** modes using Puppeteer
✅ Ideal for **data scraping**, **bot behavior replication**, **UI automation**, etc.

---

## 🛠️ Tech Stack

* [Puppeteer](https://pptr.dev/) - Headless Chrome Node API
* Node.js
* JavaScript
* JSON for action storage
* readline (for CLI commands)

---

## 🔧 Setup Instructions

1. **Clone the repo:**

   ```bash
   git clone https://github.com/yourusername/web-action-recorder.git
   cd web-action-recorder
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the script:**

   ```bash
   node record.js
   ```

4. **Provide a URL** when prompted and interact with the page. Use commands below for more control.

---

## 🧑‍💻 CLI Commands

Once launched, you can use the following commands in the terminal:

| Command | Action                       |
| ------- | ---------------------------- |
| `r`     | Start/Stop recording         |
| `s`     | Take full-page screenshot    |
| `w`     | Wait for 2 seconds           |
| `p`     | Replay recorded actions      |
| `x`     | Save recording to a file     |
| `l`     | Load a recording from a file |
| `q`     | Quit the app & close browser |

---

## 📦 Action Types Supported

* `click`
* `type`
* `navigation`
* `select`
* `scroll`
* `wait`
* `screenshot`
* `text_selection`

All actions are timestamped and replayed in sequence, preserving real user behavior.

---

## 🙋‍♂️ Author

**Prakhar Agrawal**
4th Year Engineering Student
Feel free to reach out for collaboration, feedback, or improvements!


