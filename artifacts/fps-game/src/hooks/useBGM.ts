import { useEffect, useRef } from "react";
import type { BGMTrack } from "../context/SettingsContext";

const TRACKS: Record<Exclude<BGMTrack, "off">, string> = {
  ambient: "/assets/bgm/bgm_ambient.mp3",
  glass: "/assets/bgm/bgm_glass.mp3",
};

export function useBGM(track: BGMTrack, volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track === "off") {
      audio.pause();
      startedRef.current = false;
      return;
    }

    const src = TRACKS[track];
    if (audio.src !== window.location.origin + src) {
      audio.src = src;
      audio.load();
    }
    audio.volume = volume;

    // Try autoplay; if blocked, wait for first user gesture
    const tryPlay = () => {
      audio.play().then(() => {
        startedRef.current = true;
      }).catch(() => {
        // Autoplay blocked — attach one-time gesture listener
        const onGesture = () => {
          audio.play().then(() => { startedRef.current = true; }).catch(() => {});
          document.removeEventListener("touchstart", onGesture);
          document.removeEventListener("mousedown", onGesture);
        };
        document.addEventListener("touchstart", onGesture, { once: true });
        document.addEventListener("mousedown", onGesture, { once: true });
      });
    };

    tryPlay();
  }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle volume changes separately (no need to reload src)
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
}
