import type { ReactNode } from "react";

export type Props = {
  reduceMotion: boolean;
  visible: boolean;
  onTransitionEnd: () => void;
  children: ReactNode;
};
