# ecolmeditor

## Upgraded lute soundfonts

With Python, NumPy, SciPy, and FFmpeg installed, run from the repository root:

```sh
python tools/process_audio.py
python tools/build_upgraded_soundfonts.py --install
```

The first command decodes and aligns the archived samples. The second writes
WAV masters and MP3 samples to `build/upgraded-soundfonts/` and installs the
upgraded MP3 JavaScript banks in `sft/` for the editor. Serve the repository
over HTTP and open `test/new_index.html` to select and play each bank. Omit
`--install` to export individual samples only. FFmpeg needs the `libmp3lame`
encoder. The original recordings and aligned WAV files are preserved.
Generated audio is ignored by Git.

The E and G lute banks use 12-tone equal temperament anchored to the original
sample labelled A4 in each bank (377.37 Hz and 448.84 Hz, respectively).
The D minor lute includes five donor-note substitutions, +1 dB across its
sounding notes, and another +1 dB below A♯2 (Bb2).
