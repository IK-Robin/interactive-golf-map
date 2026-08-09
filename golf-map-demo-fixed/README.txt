GREEN VALLEY INTERACTIVE GOLF MAP DEMO

Files:
- index.html: application layout
- assets/course-map.svg: the single interactive SVG containing all overlays
- assets/course-background.png: static artwork linked by the SVG image element
- assets/style.css: responsive interface styling
- assets/app.js: interactions, hole content, zoom/pan and guide animation

PREMIUM CINEMATIC GUIDE
All 18 hole badges and navigation buttons are clickable. Selecting a hole
uses a capped responsive zoom and a GPU-accelerated smooth focus transition.
The information card opens beside the selected hole instead of covering a
fixed section of the map. The cinematic
guide flies a golf ball from the tee to the green, adds height and shadow, and
leaves an infinitely animated dashed route until another hole is selected.
In fullscreen mode the 01–18 navigation automatically moves inside the map.
Dragging can begin over holes and badges; a press becomes a selection only when
the pointer is released without a drag.
The demo now uses a map-only layout. Focus calculations center the selected
number badge exactly, and the compact information card contains only essential
hole statistics and the cinematic guide control.
Edge-hole focus uses controlled overscroll so badges near the course boundary
can reach the viewport center. Hover hit-testing is paused during automatic
movement and cinematic playback to prevent repeated tooltip flashing.
Active holes keep their subtle fill without a persistent outline. The white
stroke appears only during hover and is limited to one screen pixel.
The default hole stroke is also one pixel, preventing it from briefly jumping
to a wide line while the hover color transitions back to transparent.

HOW TO RUN
Because the page loads the interactive SVG with fetch(), use a local server.

Option 1 — VS Code:
Install/open Live Server, then open index.html with Live Server.

Option 2 — XAMPP:
Copy the golf-map-demo folder into htdocs and open:
http://localhost/golf-map-demo/

Option 3 — terminal:
Run `python -m http.server 8000` inside this folder, then open:
http://localhost:8000/

CUSTOMIZATION
Edit the hole content in assets/app.js. Replace assets/course-background.png
with another 1400 × 850 course image, then redraw the matching paths, badges,
markers and animation routes inside assets/course-map.svg. The SVG image tag
keeps the static artwork and interactive elements synchronized in one canvas.

This artwork and code were created as an original demonstration and use no
third-party image assets or libraries.

NEW COURSE TOOLS
- Navigation shows hole number, par and white-tee yardage.
- Black, white and red tee selection updates yardage.
- Facilities, hazards and layup-distance markers can be toggled.
- Share creates a selected-hole URL such as ?hole=8.
- Arrow keys navigate holes; Escape closes the card.
- Mobile uses a compact bottom sheet; reduced-motion is supported.
- Edit assets/config.js for each owner's accent, booking URL and defaults.
- Cinematic mode measures the selected SVG shot path and automatically chooses
  a responsive fit scale, keeping the complete tee-to-green animation visible.
- Starting a cinematic guide also reduces the current scale by 0.30 (for
  example, 1.70 to 1.40) and fits the combined hole, badge and flight path.
