# aesthetic-pomodoro ⏱️

A pomodoro timer that actually feels nice to sit next to while you work. Three background scenes (rain, cafe, forest), each with matching ambient sound. Instead of shipping a folder of mp3s, the sound is generated live in the browser with the Web Audio API.

![status](https://img.shields.io/badge/status-active-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)

## Why synthesized audio instead of sound files

Most "ambient pomodoro" apps bundle a handful of looping mp3s, which means a bigger repo, licensing to think about, and a sound loop that's obviously looping after five minutes. Instead, this generates rain, cafe murmur, and forest ambience from raw noise buffers filtered differently per scene, plus a little oscillator that occasionally chirps for the forest scene. It never exactly repeats, and there's nothing to download. The whole repo is three small text files.

## Features

- 25/5/15 minute presets (classic pomodoro cadence), easy to retune
- A soft glass timer card with a progress ring that fills as the session runs
- Three switchable scenes, each with its own animated background (falling rain, rising steam, drifting leaves) and matching generated soundscape
- Session counter that tracks how many focus sessions you've finished today, resets at midnight, stored locally
- Browser notification when a session ends, if you grant permission

## Running it

No build step, just open `index.html`, or serve the folder if you'd rather:

```bash
npx serve .
```

## Using it as a daily driver

I use this on my own laptop while working, usually with the forest scene and the sound on low. A few notes if you do the same:

- The tab needs to stay open for the timer to keep counting (it's not a background worker), so keep it pinned in a corner of your screen
- Turning on ambient sound requires one click somewhere on the page first. Browsers block audio from starting completely silently, and that's a browser policy, not a bug here
- Session counts are stored in `localStorage`, so they're per browser, not synced anywhere

## How it works, in plain English

- Pick a session length, and a countdown starts ticking down once a second, updating the clock and the ring around it
- Switch scenes and the background swaps colors, and a fresh batch of animated particles (raindrops, steam, or leaves) gets built for that scene
- If sound is on: generate random noise in the browser, run it through a different filter per scene (high-pass for rain, low-pass for cafe murmur, band-pass plus the occasional chirp for forest), and fade it in
- When the timer hits zero, log a completed session for the day and let you know

## Customizing

Everything about tuning is near the top of `script.js` and in the scene builder functions.

- Change preset lengths by editing the `data-mins` values on the session buttons in `index.html`
- Add a new scene by adding a color scheme in `style.css` (`body[data-scene="yours"]`), a particle builder function in `script.js`, and a filter type in `startAmbience()`
- Swap fonts or colors in `style.css`. Everything reads from a small set of CSS variables at the top

## License

MIT. Build your own scene, ship it, sell it, whatever's useful to you.
