import { useEffect, useRef, useState } from "react";
import { useImmersiveLandscape } from "../hooks/use-immersive-landscape";

export const INTRO_VIDEO_PATH = "/assets/videos/intro.mp4";
const EXIT_DURATION_MS = 520;

type CinematicIntroProps = {
  onComplete: () => void;
};

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const requestImmersiveLandscape = useImmersiveLandscape();
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitTimerRef = useRef<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [needsPlaybackGesture, setNeedsPlaybackGesture] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.currentTime = 0;

    void video.play().catch(() => {
      // Do not fall back to muted playback: let the player explicitly start the intro with sound.
      video.pause();
      video.currentTime = 0;
      setNeedsPlaybackGesture(true);
    });

    return () => {
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      video.pause();
    };
  }, []);

  const startGame = () => {
    if (isExiting) return;
    videoRef.current?.pause();
    requestImmersiveLandscape();
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onComplete();
    }, EXIT_DURATION_MS);
  };

  const playIntro = async () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    video.muted = false;

    try {
      await video.play();
      setNeedsPlaybackGesture(false);
    } catch {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <section className="intro-screen" data-exiting={isExiting} aria-label="Introdução do 47-FIGHT">
      <video
        ref={videoRef}
        className="intro-video"
        src={INTRO_VIDEO_PATH}
        autoPlay
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        aria-hidden="true"
      />

      <button className="intro-start" type="button" onClick={startGame} aria-label="Iniciar jogo">
        TOQUE PARA INICIAR
      </button>

      {needsPlaybackGesture && (
        <button className="intro-watch" type="button" onClick={playIntro}>
          ASSISTIR INTRO
        </button>
      )}
    </section>
  );
}
