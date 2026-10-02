import { BRANDING } from "../game/config/branding";

type GameLogoProps = {
  variant?: "hero" | "header" | "arena" | "modal";
  className?: string;
};

export function GameLogo({ variant = "header", className = "" }: GameLogoProps) {
  return (
    <img
      className={`game-logo game-logo--${variant} ${className}`.trim()}
      src={BRANDING.logo}
      alt={BRANDING.name}
      draggable={false}
    />
  );
}
