# 🎲 G PERYA - Color Dice & Wheel Game

A faithful replica of the iconic **G PERYA** website ([gperya.neocities.org](http://gperya.neocities.org/)) featuring custom high-vibrancy color dice, the Light or Dark wheel of fortune, authentic audio, and perya carnival aesthetics.

---

## 🎨 Configured Colors & Hex Codes

| # | Face Color | Hex Code | Visual Style |
| :-: | :-: | :-: | :-: |
| **1** | **Red** | `#FF0000` | White center dot / text |
| **2** | **Purple** | `#800080` | White center dot / text |
| **3** | **Yellow** | `#FFFF00` | Dark text contrast / white dot |
| **4** | **Green** | `#008000` | White center dot / text |
| **5** | **Blue** | `#0000FF` | White center dot / text |
| **6** | **Orange** | `#FFA500` | Dark text contrast / white dot |

---

## 🌟 Features Replicated from G PERYA

1. **Exact UI & Aesthetics**:
   - Distinctive typography using Google Font **'Luckiest Guy'**.
   - Radial carnival blue background (`radial-gradient(circle, #3e6d9d 0%, #1a3a5a 90%)`).
   - Frosted glass central wrapper (`rgba(255, 255, 255, 0.15)` with `5px solid #ffffff` border and blur).
   - Official `gperya.png` logo and layered 3D text-stroke header.
   - Original background overlays (`pic/background.png` and `pic/light.png`) with animated floating bokeh bubbles.
2. **Color Dice Mode**:
   - Dropdown selection for **1 to 6 Dice**.
   - Signature squircle color blocks (90x90px with 10px white border and 25px border-radius).
   - The iconic white glowing center dot.
   - Shaking dice roll animation (`shake-dice`) with transition delays and audio.
3. **Light or Dark Wheel Mode**:
   - Smooth conic-gradient wheel with pointer arrow.
   - 7 segments: **LIGHT** (White), **DARK** (Dark Charcoal), and **3X GRAY** (Multiplier).
   - Wheel spin physics with cubic-bezier deceleration, tick sound per segment, and winner popup banner.
4. **Interactive Controls & Audio**:
   - Big tactile **"ROLL AGAIN !"** / **"SPIN AGAIN!"** button with press compression.
   - Spacebar keyboard shortcut to roll/spin.
   - Local offline audio files (`roll-sound.mp3`, `tick-sound.wav`, `wheel-win.wav`) + sound toggle.
5. **Color Avoidance Hotkeys (F1 - F6)**:
   - Press an **F-key** before rolling to ensure that color is **never chosen** on the roll:
     - **F1**: Avoid **Red** (`#FF0000`)
     - **F2**: Avoid **Purple** (`#800080`)
     - **F3**: Avoid **Yellow** (`#FFFF00`)
     - **F4**: Avoid **Green** (`#008000`)
     - **F5**: Avoid **Blue** (`#0000FF`)
     - **F6**: Avoid **Orange** (`#FFA500`)
   - **Stealth Operation**: Hidden completely from the UI (no visible hotkey buttons or pills on screen).
   - Press the same key again or press `Escape` / `Z` to clear avoidance.
6. **Roll & Spin History (Bottom Section)**:
   - Live scrollable history feed placed at the bottom of the page.
   - Displays miniature color dice with white dots or numbers for Color Dice rolls.
   - Displays outcome badges (LIGHT, DARK, 3X GRAY) for Wheel spins.
   - Includes roll sequence counter (`#1`, `#2`, ...), timestamps, and a `✕ CLEAR` button.
   - Automatically saved to `localStorage` so history persists across visits.
7. **Bonus Features**:
   - **Toggle Betting Board**: Place bets on colors with virtual chips (₱10 to ₱500) and track your purse.
   - **Toggle Numbers / Dots**: Switch between the classic G Perya white dots or face numbers (1 to 6).

---

## 🚀 How to Run

1. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open 👉 **`http://localhost:8081/`** (or the port displayed in terminal)

2. **Or open directly**:
   Double click [index.html](file:///c:/Users/Kirk/OneDrive/Documents/color%20dice/index.html) in your file explorer.
