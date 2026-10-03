import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ImmersiveLandscapeContext } from "../hooks/use-immersive-landscape";
import { GameLogo } from "./GameLogo";

type OrientationLock = (orientation: "landscape") => Promise<void>;

function isMobileLikeDevice() {
  if (typeof window === "undefined") return false;

  const navigatorWithUserAgentData = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };

  const mobileUserAgent = /Android|iPhone|iPod|IEMobile|Mobile/i.test(navigator.userAgent);
  const touchDevice =
    navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches;

  return Boolean(
    navigatorWithUserAgentData.userAgentData?.mobile || mobileUserAgent || touchDevice,
  );
}

export function LandscapeExperience({ children }: { children: ReactNode }) {
  const applicationRef = useRef<HTMLDivElement>(null);
  const [mustRotate, setMustRotate] = useState(false);

  useEffect(() => {
    const portrait = window.matchMedia("(orientation: portrait)");
    const updateOrientation = () => setMustRotate(isMobileLikeDevice() && portrait.matches);

    updateOrientation();
    portrait.addEventListener("change", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    window.addEventListener("resize", updateOrientation);

    return () => {
      portrait.removeEventListener("change", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  useEffect(() => {
    const application = applicationRef.current;
    if (!application) return;

    application.inert = mustRotate;
    return () => {
      application.inert = false;
    };
  }, [mustRotate]);

  const requestImmersiveLandscape = useCallback(() => {
    const request = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        }
      } catch {
        // Fullscreen is an enhancement; Safari and embedded browsers may reject it.
      }

      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: OrientationLock;
        };
        await orientation.lock?.("landscape");
      } catch {
        // Manual rotation remains the supported fallback when locking is unavailable.
      }
    };

    void request();
  }, []);

  return (
    <ImmersiveLandscapeContext.Provider value={requestImmersiveLandscape}>
      <div className="landscape-app" ref={applicationRef} aria-hidden={mustRotate || undefined}>
        {children}
      </div>
      {mustRotate && (
        <section className="rotate-device" role="dialog" aria-modal="true" aria-live="polite">
          <div className="rotate-device__content">
            <GameLogo variant="hero" />
            <div className="rotate-device__phone" aria-hidden="true">
              <span />
            </div>
            <h1>Gire seu celular para jogar</h1>
            <p>O 47-FIGHT foi desenvolvido para ser jogado na horizontal.</p>
          </div>
        </section>
      )}
    </ImmersiveLandscapeContext.Provider>
  );
}
