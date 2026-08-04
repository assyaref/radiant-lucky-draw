import { useEffect, useRef } from 'react';
import { useAudio } from './AudioManager';
import { useBooth } from '../modes/BoothContext';

/**
 * useBoothAudio - Connects the audio system to booth lifecycle events.
 * Triggers SFX and voice lines at the right moments:
 *  - Initial load      -> systemReady voice line
 *  - Welcome mode      -> welcome voice line
 *  - Attraction        -> scan QR voice + next draw voice + machine spin SFX
 *  - Celebration       -> winner reveal SFX + voice + confetti/fireworks + prize pop
 *  - Countdown         -> countdown SFX
 */
export function useBoothAudio() {
  const { playSfx, playVoiceLine } = useAudio();
  const { mode } = useBooth();
  const prevModeRef = useRef(mode);
  const systemReadyPlayedRef = useRef(false);

  // System ready announcement on initial load (after a short delay)
  useEffect(() => {
    if (systemReadyPlayedRef.current) return;
    systemReadyPlayedRef.current = true;
    const timer = setTimeout(() => {
      playVoiceLine('systemReady');
    }, 2500);
    return () => clearTimeout(timer);
  }, [playVoiceLine]);

  // React to booth mode transitions
  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = mode;

    // Entering celebration mode -> winner reveal
    if (mode === 'celebration' && prev !== 'celebration') {
      playSfx('winnerReveal');
      playSfx('confetti');
      playSfx('fireworks');
      playSfx('prizePop');
      playVoiceLine('winnerAnnouncement');
    }

    // Entering welcome mode -> welcome voice
    if (mode === 'welcome' && prev !== 'welcome') {
      playVoiceLine('welcome');
    }

    // Entering attraction mode -> scan QR voice + next draw + machine spin
    if (mode === 'attraction' && prev !== 'attraction') {
      playVoiceLine('scanQr');
      playVoiceLine('nextDraw');
      playSfx('machineSpin');
    }
  }, [mode, playSfx, playVoiceLine]);

  return { playSfx, playVoiceLine };
}
