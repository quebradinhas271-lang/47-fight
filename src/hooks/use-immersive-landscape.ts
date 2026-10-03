import { createContext, useContext } from "react";

export const ImmersiveLandscapeContext = createContext<() => void>(() => undefined);

export function useImmersiveLandscape() {
  return useContext(ImmersiveLandscapeContext);
}
