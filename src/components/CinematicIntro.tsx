import { useEffect, useRef, useState } from "react";

export const INTRO_VIDEO_PATH = "/assets/videos/intro.mp4";
const EXIT_DURATION_MS = 520;

type CinematicIntroProps = {
  onComplete: () => void;
};

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitTimerRef = useRef<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => {
      // Some browsers defer playback until the first user interaction.
    });

    return () => {
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      video.pause();
    };
  }, []);

  const startGame = () => {
    if (isExiting) return;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      videoRef.current?.pause();
      onComplete();
    }, EXIT_DURATION_MS);
  };

  const enableSound = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    try {
      await video.play();
    } catch {
      video.muted = true;
      setIsMuted(true);
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
        muted={isMuted}
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        aria-hidden="true"
      />

      <button className="intro-start" type="button" onClick={startGame} aria-label="Iniciar jogo">
        <span className="intro-start-mobile">TOQUE PARA INICIAR</span>
        <span className="intro-start-desktop">CLIQUE PARA INICIAR</span>
      </button>

      {isMuted && (
        <button className="intro-sound" type="button" onClick={enableSound}>
          ATIVAR SOM
        </button>
      )}
    </section>
  );
}