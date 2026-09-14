# Android App Icon Design SOP & Prompt Engineering Guide

This document outlines the official Android Human Interface Guidelines / Standard Operating Procedure (SOP) for designing the **AgentFlow** app icon, along with production-grade structured prompts for AI image generation tools (Midjourney, DALL-E 3, Ideogram, Flux, Leonardo).

---

## 1. Android Adaptive Icon SOP Specifications

Starting from Android 8.0 (API 26) through Android 15, Android requires **Adaptive Icons**. The system applies dynamic OEM masks (Circle on Pixel, Squircle on Samsung One UI, Rounded Square on Xiaomi/OnePlus) and physics-based parallax animations.

```
+--------------------------------------------------------+
|  Total Canvas: 108dp x 108dp (100%)                    |
|                                                        |
|      +------------------------------------------+      |
|      |  Safe Zone Viewport: 72dp x 72dp (66%)   |      |
|      |                                          |      |
|      |          [ MAIN LOGO GLYPH ]             |      |
|      |         (Guaranteed Visible)             |      |
|      |                                          |      |
|      +------------------------------------------+      |
|                                                        |
|  Outer Bleed Ring: 18dp (Mask & Parallax Margin)       |
+--------------------------------------------------------+
```

### The 3 Required Icon Layers:
1. **Foreground (`ic_launcher_foreground.png` / Vector)**:
   - Contains the primary logo symbol or glyph.
   - Must be strictly centered inside the inner **72dp x 72dp (66%)** safe area.
   - Background **must be 100% transparent**.
2. **Background (`ic_launcher_background.png` or XML gradient)**:
   - Full bleed **108dp x 108dp**.
   - Solid color or subtle seamless gradient without distinct iconography.
3. **Monochrome / Themed Icon (`ic_launcher_monochrome.xml` / `.png`)** (Android 13+):
   - Single flat silhouette (pure `#FFFFFF` white on transparent background).
   - Dynamically tinted by Android to match the user's wallpaper Material You theme.

---

## 2. Google Play Store & Mipmap Resolution Table

| Density Bucket | Scale Factor | Legacy / Square | Adaptive Layer (108dp) | Target Directory |
|---|---|---|---|---|
| **mdpi** | 1.0x | 48 x 48 px | 108 x 108 px | `res/mipmap-mdpi/` |
| **hdpi** | 1.5x | 72 x 72 px | 162 x 162 px | `res/mipmap-hdpi/` |
| **xhdpi** | 2.0x | 96 x 96 px | 216 x 216 px | `res/mipmap-xhdpi/` |
| **xxhdpi** | 3.0x | 144 x 144 px | 324 x 324 px | `res/mipmap-xxhdpi/` |
| **xxxhdpi** | 4.0x | 192 x 192 px | 432 x 432 px | `res/mipmap-xxhdpi/` |
| **Google Play Store** | - | **512 x 512 px** | Full 32-bit PNG, sRGB, Max 1024KB | Google Play Console |

> [!IMPORTANT]
> **Google Play Store Rule**: Never pre-round corners or bake drop-shadows into the 512x512 Play Store graphic. Google Play automatically applies a 20% corner radius and elevation shadows.

---

## 3. Structured AI Prompts for Image Generators

Use these tailored prompts in **Midjourney v6**, **DALL-E 3 (ChatGPT Plus)**, **Ideogram**, or **Flux**.

### Concept 1: Modern Fintech 3D Glassmorphism (Recommended)
*Combines an infinity growth flow, payout card chip, and verified checkmark.*

```text
A premium modern mobile app icon for a financial payout and work tracking application named "AgentFlow". Centered composition featuring a sleek 3D stylized infinity flow ribbon fused with an illuminated biometric microchip and a subtle dynamic checkmark. Aesthetic: Frosted glassmorphism, glowing emerald green (#10B981) and vibrant electric cyan (#06B6D4) light accents against an ultra-dark obsidian navy background. Soft studio rim lighting, 3D render style, octane render, smooth specular reflections, minimal and elegant. The logo is strictly centered within the middle 65% of the frame with ample breathing room from borders. Pure front-facing perspective, vector-like clarity, high resolution, no text, no letters, no mockups, no device frame --ar 1:1 --v 6.0
```

### Concept 2: Minimalist 2D Vector & Bold Geometry (Easiest to Extract)
*Perfect for clean extraction into SVG and transparent foreground layers.*

```text
Minimalist vector app icon logo for "AgentFlow" payout tracking app. Flat design, bold geometric logo mark consisting of a stylized letter 'A' intertwined with an upward-trending financial arrow and checkmark. Two-tone color palette: Mint green and deep teal on a solid dark slate background (#0F172A). Centered design, generous padding around edges, adhering to Android adaptive icon safe zone, clean lines, high contrast, SVG logo style, dribbble trend, no gradients, no photorealism, no text, no frame --ar 1:1
```

### Concept 3: Dynamic Speed Shield & Currency Flow
*Focuses on security, verified work submissions, and instant payout speed.*

```text
App icon design for mobile tracker app. A modern isometric 3D emblem representing rapid payout and verified attendance: a sleek modern shield contour with an embedded glowing neon green bolt and layered currency cards. High-tech fintech aesthetic, smooth metallic and acrylic glass textures, deep sapphire and obsidian background, volumetric lighting. Centered with 25% margin padding from edges for Android icon mask compatibility, no phone frame, no text, high contrast --ar 1:1
```

---

## 4. Structured Prompt for Android Monochrome (Material You)

To create the monochrome silhouette icon for Android 13+:

```text
Flat 2D vector silhouette glyph icon of an infinity flow ribbon fused with a checkmark and currency chip. Pure solid flat white color (#FFFFFF) on an isolated solid flat black background. Minimalist line art, bold stroke weight, perfectly symmetrical, vector logo mark, centered with 25% margin, no gradients, no shadows, no gray shades, clean vector silhouette --ar 1:1
```

---

## 5. Negative Prompt (To Prevent Common AI Artifacts)

When using tools with negative prompt fields (e.g. Leonardo, Stable Diffusion, Ideogram):
```text
text, words, typography, watermark, phone mockup, smartphone, hand holding phone, realistic human, multiple angles, busy background, borders, rounded square frame, drop shadow, complex textures, low resolution, blurry
```

---

## 6. Production Integration SOP (From Generated Image to Android App)

1. **Pick & Download the Best Image**: Select a generated 1:1 image.
2. **Remove Background**:
   - Use [Remove.bg](https://www.remove.bg) or Figma to isolate the central glyph with a transparent background.
   - Save as `ic_launcher_foreground.png`.
3. **Extract Background Color/Gradient**:
   - Extract the background color (e.g. `#0F172A`) or create a radial gradient XML.
4. **Import via Android Studio Asset Studio**:
   - In Android Studio: Right-click `app/src/main/res` -> **New** -> **Image Asset**.
   - Icon Type: **Launcher Icons (Adaptive and Legacy)**.
   - **Foreground Layer**: Select your transparent `ic_launcher_foreground.png`. Adjust the **Resize** slider until the logo sits comfortably inside the circle/squircle safe line.
   - **Background Layer**: Select **Color** or your background asset.
   - **Options**: Asset Studio automatically outputs `res/mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi`!
5. **Generate Google Play Icon**:
   - In Figma or Photoshop, place the full composition on a 512x512 canvas (flat square, no rounded corners).
   - Export as 32-bit PNG.
