# Rebuild the original instrumental without external samples or dependencies.
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.IO;
public static class WarpScore {
    const int Rate = 24000;
    static double[,] mix;
    static double Hz(int midi) { return 440 * Math.Pow(2, (midi - 69) / 12.0); }
    static void Note(double start, double duration, int midi, double level, int voice, double pan) {
        int first = (int)(start * Rate), count = (int)(duration * Rate);
        double hz = Hz(midi), left = Math.Sqrt((1 - pan) / 2), right = Math.Sqrt((1 + pan) / 2);
        for (int i = 0; i < count && first + i < mix.GetLength(0); i++) {
            double t = i / (double)Rate, p = 2 * Math.PI * hz * t;
            double env, wave;
            if (voice == 0) {
                // Gentle detuned string pad, with a slow attack and release.
                env = Math.Min(1, t / .65) * Math.Min(1, (duration - t) / 1.3);
                wave = (Math.Sin(p) + .32 * Math.Sin(p * 1.002) + .18 * Math.Sin(p * 2) + .07 * Math.Sin(p * 3)) / 1.57;
            } else if (voice == 1) {
                // Glass bell; quiet non-harmonic partials give the stars a shimmer.
                env = Math.Min(1, t / .012) * Math.Exp(-t * 3.1) * Math.Min(1, (duration - t) / .15);
                wave = Math.Sin(p) + .24 * Math.Sin(p * 2.76) * Math.Exp(-t * 5);
            } else if (voice == 2) {
                // Warm piano-like lead, never a vocal sample.
                env = Math.Min(1, t / .018) * Math.Exp(-t * 1.35) * Math.Min(1, (duration - t) / .25);
                wave = Math.Sin(p) + .28 * Math.Sin(p * 2) * Math.Exp(-t * 2) + .1 * Math.Sin(p * 3) * Math.Exp(-t * 4);
            } else if (voice == 8) {
                // Tight neon pluck with an octave edge.
                env = Math.Min(1, t / .004) * Math.Exp(-t * 14) * Math.Min(1, (duration - t) / .035);
                wave = Math.Sin(p) + .38 * Math.Sin(p * 2) + .2 * Math.Sin(p * 4);
            } else if (voice == 9) {
                // Saturated sub bass: syncopated, with a little pitch fall.
                env = Math.Min(1, t / .007) * Math.Exp(-t * 2.3) * Math.Min(1, (duration - t) / .055);
                double phase = p + 1.4 * (1 - Math.Exp(-t * 28));
                wave = Math.Tanh(1.5 * (Math.Sin(phase) + .2 * Math.Sin(phase * 2))) * .8;
            } else if (voice == 4) {
                // Low string ostinato: urgency without a hip-hop beat.
                env = Math.Min(1, t / .008) * Math.Exp(-t * 9) * Math.Min(1, (duration - t) / .045);
                wave = Math.Sin(p) + .32 * Math.Sin(p * 2) + .14 * Math.Sin(p * 3);
            } else if (voice == 5) {
                // A restrained cinematic timpani hit with a falling pitch.
                env = Math.Min(1, t / .008) * Math.Exp(-t * 7) * Math.Min(1, (duration - t) / .08);
                wave = Math.Sin(2 * Math.PI * (hz * t + 35 * (1 - Math.Exp(-t * 14)) / 14));
            } else if (voice == 7) {
                // Dark brass accents, kept behind the star-like lead.
                env = Math.Min(1, t / .055) * Math.Exp(-t * 3.5) * Math.Min(1, (duration - t) / .15);
                wave = Math.Sin(p) + .42 * Math.Sin(p * 2) + .18 * Math.Sin(p * 3) + .06 * Math.Sin(p * 5);
            } else if (voice == 6) {
                // Rising, airy harmonics beneath each phrase.
                env = Math.Sin(Math.PI * t / duration) * .65;
                double sweep = p * (1 + t * .3);
                wave = Math.Sin(sweep) * .5 + Math.Sin(sweep * 1.007) * .3;
            } else {
                env = Math.Min(1, t / .15) * Math.Min(1, (duration - t) / .5);
                wave = Math.Sin(p);
            }
            double sample = wave * env * level;
            mix[first + i, 0] += sample * left;
            mix[first + i, 1] += sample * right;
        }
    }
    static readonly Random Noise = new Random(160);
    static void Drum(double start, int kind, double level, double pan) {
        double duration = kind == 0 ? .38 : kind == 1 ? .22 : .065;
        int first = (int)(start * Rate), count = (int)(duration * Rate);
        double last = 0, left = Math.Sqrt((1 - pan) / 2), right = Math.Sqrt((1 + pan) / 2);
        for (int i = 0; i < count && first + i < mix.GetLength(0); i++) {
            double t = i / (double)Rate, noise = Noise.NextDouble() * 2 - 1;
            double high = noise - last; last = noise;
            double wave;
            if (kind == 0) {
                double phase = 2 * Math.PI * (47 * t + 105 * (1 - Math.Exp(-t * 38)) / 38);
                wave = Math.Sin(phase) * Math.Exp(-t * 12) + high * Math.Exp(-t * 180) * .15;
            } else if (kind == 1) {
                wave = high * Math.Exp(-t * 25) * .6 + Math.Sin(2 * Math.PI * 180 * t) * Math.Exp(-t * 30) * .4;
            } else wave = high * Math.Exp(-t * 85) * .55;
            double sample = wave * level * Math.Min(1, t / .001) * Math.Min(1, (duration - t) / .008);
            mix[first + i, 0] += sample * left; mix[first + i, 1] += sample * right;
        }
    }
    public static void Build(string path) {
        int frames = Rate * 29;
        mix = new double[frames, 2];
        // 160 BPM, sixteen 1.5-second bars: halftime drums and rapid hats.
        int[][] chords = { new[]{50,57,62,65}, new[]{46,53,58,62}, new[]{43,50,55,58}, new[]{45,52,57,61} };
        double beat = .375, stepTime = beat / 4;
        int[] arp = {0,2,1,3,2,1,3,2};
        int[] bassSteps = {0,3,6,10,14};
        int[] kickSteps = {0,6,10,15};
        for (int bar = 0; bar < 16; bar++) {
            double start = bar * 1.5;
            int[] chord = chords[(bar / 2) % 4];
            for (int j = 0; j < 4; j++) Note(start, 2.2, chord[j] + 12, .037, 0, -.65 + j * .43);
            foreach (int step in bassSteps) {
                int midi = chord[0] - 12 + (step == 14 && bar % 2 == 1 ? 12 : 0);
                Note(start + step * stepTime, step == 0 ? .48 : .26, midi, .24, 9, 0);
            }
            foreach (int step in kickSteps) Drum(start + step * stepTime, 0, step == 0 ? .48 : .34, 0);
            Drum(start + beat * 2, 1, .26, .05);
            if (bar % 4 == 3) Drum(start + stepTime * 13, 1, .075, -.15);
            for (int step = 0; step < 16; step++) {
                if (step % 2 == 0 || bar % 2 == 1) Drum(start + step * stepTime, 2, step % 4 == 0 ? .095 : .055, step % 2 == 0 ? -.3 : .3);
                if (bar % 4 == 3 && step >= 14) Drum(start + (step + .5) * stepTime, 2, .045, .4);
            }
            for (int step = 0; step < 8; step++) {
                Note(start + step * beat / 2, .23, chord[arp[step]] + 24, step % 2 == 0 ? .077 : .055, 8, step % 2 == 0 ? -.45 : .45);
            }
            if (bar % 2 == 0) Note(start, 1.35, chord[2] + 24, .045, 1, .15);
            if (bar % 4 == 3) Note(start + .75, .75, 69, .065, 6, 0);
        }
        // A soft five-second tail after the waiting-screen loop.
        foreach (int note in new[]{50,57,62,65,69}) Note(24, 4.9, note, .06, 0, (note % 3 - 1) * .45);
        Note(24, .8, 38, .15, 9, 0);
        Note(24, 3.6, 86, .055, 1, 0);
        // Stereo cross echoes, processed backwards so the reverb never feeds back.
        for (int i = frames - 1; i >= 0; i--) {
            for (int tap = 1; tap <= 5; tap++) {
                int delay = (int)(Rate * (.19 * tap + .023 * (tap % 2)));
                if (i >= delay) {
                    double decay = .09 * Math.Pow(.6, tap - 1);
                    mix[i,0] += mix[i-delay,tap%2] * decay;
                    mix[i,1] += mix[i-delay,1-tap%2] * decay;
                }
            }
        }
        double peak = 0;
        for (int i = 0; i < frames; i++) {
            double fade = Math.Min(1, i / (Rate * .012)) * Math.Min(1, (frames - 1 - i) / (Rate * 2.2));
            // The waiting-screen loop ends at 24 s; soften that boundary.
            if (i >= Rate * 24 - 360 && i < Rate * 24) fade *= (Rate * 24 - 1 - i) / 360.0;
            for (int c = 0; c < 2; c++) { mix[i,c] *= fade; peak = Math.Max(peak, Math.Abs(mix[i,c])); }
        }
        using (var writer = new BinaryWriter(File.Create(path))) {
            writer.Write(System.Text.Encoding.ASCII.GetBytes("RIFF")); writer.Write(36 + frames * 4);
            writer.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt ")); writer.Write(16);
            writer.Write((short)1); writer.Write((short)2); writer.Write(Rate); writer.Write(Rate * 4);
            writer.Write((short)4); writer.Write((short)16);
            writer.Write(System.Text.Encoding.ASCII.GetBytes("data")); writer.Write(frames * 4);
            for (int i = 0; i < frames; i++) for (int c = 0; c < 2; c++) writer.Write((short)(mix[i,c] / peak * 26000));
        }
    }
}
'@
[WarpScore]::Build((Join-Path $PSScriptRoot 'starlit-orbit.wav'))
Get-Item -LiteralPath (Join-Path $PSScriptRoot 'starlit-orbit.wav') | Select-Object Name, Length
