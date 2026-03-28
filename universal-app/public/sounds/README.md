# Sound Files

This directory contains notification sound files for the Universal Council App.

## Required Files

Add the following audio files to this directory:

| File | Description | Recommended Duration | Notes |
|------|-------------|---------------------|-------|
| `success.mp3` | Short positive chime | 0.3-0.5s | Play on successful actions (save, approve, etc.) |
| `error.mp3` | Subtle error tone | 0.3-0.5s | Play on failed operations |
| `notification.mp3` | Gentle ping | 0.2-0.4s | Play for new notifications |
| `warning.mp3` | Alert tone | 0.3-0.5s | Play for warnings |
| `complete.mp3` | Task completion sound | 0.5-0.8s | Play when long tasks finish |

## Audio Requirements

- **Format**: MP3 (for broadest browser compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono or Stereo
- **Volume**: Normalized to -3dB to -6dB peak
- **File Size**: Keep under 50KB each for fast loading

## Creating Sound Files

### Option 1: Use Royalty-Free Sounds

Download from:
- [freesound.org](https://freesound.org)
- [mixkit.co](https://mixkit.co/free-sound-effects/)
- [soundbible.com](https://soundbible.com)

### Option 2: Generate Programmatically

Use AudioWorklet or Web Audio API oscillators to generate simple tones:

```javascript
// Example: Generate a simple success chime
const ctx = new AudioContext();
const osc = ctx.createOscillator();
const gain = ctx.createGain();

osc.type = 'sine';
osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

gain.gain.setValueAtTime(0.3, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime + 0.4);
```

### Option 3: Use Audio Editing Software

- Audacity (free)
- Adobe Audition
- Logic Pro

## Accessibility Considerations

1. **Respect Reduced Motion**: The sound system respects `prefers-reduced-motion`
2. **Provide Mute Option**: Users can mute all sounds
3. **Keep Sounds Brief**: Short sounds are less disruptive
4. **Avoid Alarming Tones**: Use gentle, professional sounds
5. **Visual Alternatives**: Always provide visual feedback alongside sounds

## Testing

After adding sound files:

1. Clear browser cache
2. Test each sound plays correctly
3. Test mute functionality
4. Test volume controls
5. Test on mobile devices
6. Verify offline fallback works

## Fallback Behavior

If sound files are not present:
- The system uses a silent audio fallback
- No errors are thrown
- Functionality continues normally

This allows development and testing without actual audio files.
