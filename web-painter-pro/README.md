# 🎨 Web Painter Pro
### *The Professional-Grade Web Annotation & Productivity Suite*

**Web Painter Pro** is an elite, high-performance Chrome extension designed for researchers, designers, students, and power users. It transforms any website into a digital canvas with the fluidity of a desktop design app and the precision of a professional note-taking tool.

---

## 🚀 Elite Features

### 🖋️ Professional Drawing Engine
- **Anti-Jitter Smoothing**: A non-linear stabilizer algorithm that filters out hand jitters for elegant, professional lines.
- **Hardware Acceleration**: Built on the GPU-optimized Canvas API for lag-free 60 FPS performance.
- **Pointer API Integration**: Native support for **Apple Pencil**, pressure sensitivity, and touch interaction.

### 🧠 Intelligent Productivity
- **Smart Highlighter**: Automatically detects text height and self-adjusts its thickness for a perfect highlight every time.
- **Click-to-Edit Text**: Annotate with rich text boxes that remain editable. Click back into any existing note to refine your thoughts.
- **Floating Glassmorphism UI**: A movable, draggable toolbar that stays out of your way while looking beautiful in both light and dark modes.

### 📑 Professional Export & Persistence
- **SVG-Vector PDF Export**: Generates high-resolution PDFs using a vector engine. Includes a "Clean Print" logic that automatically strips away ads, sidebars, and navigation menus.
- **Auto-Save Persistence**: Every stroke is saved to the website's URL automatically. Your work stays where you left it, even across browser restarts.

---

## ⌨️ Power-User Shortcuts
| Tool | Shortcut | Description |
| :--- | :---: | :--- |
| **Select** | `V` | Interact with the page (links, scroll) |
| **Pen** | `P` | Smooth freehand drawing |
| **Highlighter** | `H` | Smart-sizing text highlight |
| **Text Tool** | `T` | Click to add or edit notes |
| **Line / Shapes**| `L` / `R` / `C`| Lines, Rectangles, and Circles |
| **Eraser** | `E` | Precision stroke removal |
| **Size** | `[` or `]` | Decrease or Increase brush size |
| **Undo** | `Ctrl + Z` | Revert last action |
| **Save PDF** | `Ctrl + S` | Export clean PDF |

---

## 📱 iPad & Apple Pencil Support
Web Painter Pro is optimized for **Orion Browser** on iPadOS. 
- **Touch-Lock**: Default scrolling is disabled while drawing for a stable writing experience.
- **Palm Rejection**: Built to work seamlessly with the Apple Pencil's precision.
- **Setup**: Transfer this folder to your iPad and "Install from Disk" in Orion's Extension settings.

---

## 🛠️ Installation
1. Download/Clone this repository.
2. Navigate to `chrome://extensions/` in Chrome or Brave.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `web-painter-pro` folder.

---

## 🔧 Technical Stack
- **Engine**: Vanilla ES6+ JavaScript, Canvas Path2D, SVG Vector API.
- **UI**: Shadow DOM encapsulation with CSS Glassmorphism.
- **Persistence**: Chrome Storage API (Synchronized per URL).

---
*Built for the next generation of digital thinkers.*
