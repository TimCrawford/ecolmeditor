"""Build the auditioned WAV banks from the aligned recordings."""
import argparse
import base64
from fractions import Fraction
import json
from pathlib import Path
import shutil
import wave

import numpy as np
from scipy.signal import resample_poly

from process_audio import BANKS, ROOT

SUBSTITUTIONS = {
    'Gb5': ('G5', -100),
    'F5': ('G5', -200),
    'Db5': ('D5', -100),
    'B4': ('Bb4', 100),
    'C5': ('D5', -200),
}
ONE_DB = 10 ** (1 / 20)


def midi(note):
    pitch_classes = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    return 12 * (int(note[-1]) + 1) + pitch_classes[note[0]] + note.count('#') - note.count('b')


def transform(source, destination, rate, gain_passes):
    if rate == 1 and not gain_passes:
        shutil.copyfile(source, destination)
        return

    with wave.open(str(source)) as reader:
        params = reader.getparams()
        pcm = np.frombuffer(reader.readframes(params.nframes), dtype='<i2')
    if not pcm.any():
        shutil.copyfile(source, destination)
        return

    signal = pcm.reshape(-1, params.nchannels).astype(float)
    if rate != 1:
        signal = resample_poly(signal, rate.numerator, rate.denominator, axis=0,
                               window=('kaiser', 8.6))
        peak = np.max(np.abs(signal))
        if peak > 32767:
            signal *= 32767 / peak
        signal = np.rint(signal)
    for _ in range(gain_passes):
        signal = np.rint(signal * ONE_DB)
    if signal.min() < -32768 or signal.max() > 32767:
        raise ValueError(f'Gain would clip {destination.name}')

    with wave.open(str(destination), 'wb') as writer:
        writer.setparams(params)
        writer.writeframes(signal.astype('<i2').tobytes())


def build(output, install):
    tuning = json.loads(Path(__file__).with_name('lute_tuning.json').read_text())
    for bank in BANKS:
        aligned = ROOT / 'web' / 'audio' / bank / 'aligned'
        inputs = sorted(aligned.glob('*.wav'))
        if len(inputs) != 88:
            raise SystemExit(f'{aligned} must contain 88 WAVs. Run tools/process_audio.py first.')

        destination = output / bank
        destination.mkdir(parents=True, exist_ok=True)
        values = {}
        for sample in inputs:
            key = sample.stem
            if bank == 'Bar_lute':
                donor, cents = SUBSTITUTIONS.get(key, (key, 0))
                rate = Fraction(2 ** (-cents / 1200)).limit_denominator(4000)
                gain_passes = 1 + (midi(key) < midi('Bb2'))
            else:
                donor = key
                rate = Fraction(*tuning[bank].get(key, [1, 1]))
                gain_passes = 0

            wav = destination / sample.name
            transform(aligned / (donor + '.wav'), wav, rate, gain_passes)
            if install:
                values[key] = 'data:audio/wav;base64,' + base64.b64encode(wav.read_bytes()).decode()

        if install:
            target = ROOT / 'sft' / bank / 'acoustic_grand_piano-wav.js'
            temporary = target.with_suffix('.tmp')
            temporary.write_text('MIDI.Soundfont.acoustic_grand_piano = ' + json.dumps(values) + ';\n')
            temporary.replace(target)
        print(f'{bank}: {len(inputs)} WAV files in {destination}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'build' / 'upgraded-soundfonts')
    parser.add_argument('--install', action='store_true',
                        help='Also write the generated banks at the editor’s existing soundfont URLs.')
    options = parser.parse_args()
    build(options.output, options.install)
