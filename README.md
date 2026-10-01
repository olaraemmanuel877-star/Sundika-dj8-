# Sundika DJ8 Pro — Android build 1

This is a landscape Android Studio project that recreates the supplied DJ reference layout and adds a working browser/audio layer.

Working in this first build:
- Two deck audio loading from Android storage
- Play/pause/cue
- Dual-deck Web Audio routing
- High/Mid/Low EQ per deck
- Crossfader
- Master volume
- Touch jog seeking / scratch-style time movement
- Real waveform rendering after a file is loaded
- Sampler pads
- 4-second loop
- Master level meters
- Mix recording to WebM when supported by the Android WebView

Open the project in Android Studio and build the `app` module.

Note: this source does not copy VirtualDJ source code. It recreates the visible layout and implements the audio behavior independently.
