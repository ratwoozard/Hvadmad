import type { Variants } from "framer-motion";
import { DURATION, EASING, STAGGER } from "./tokens";

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASING.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.exit, ease: EASING.in },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASING.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.exit, ease: EASING.in },
  },
};

export const listContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: STAGGER.list },
  },
};

export const resultStagger: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: STAGGER.row },
  },
};

export const voteCardEntry: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASING.out },
  },
};

export const voteCardExitJa = {
  y: "-120%",
  rotate: -8,
  opacity: 0,
  transition: { duration: DURATION.card, ease: EASING.out },
};

export const voteCardExitNej = {
  y: "120%",
  rotate: 8,
  opacity: 0,
  transition: { duration: DURATION.card, ease: EASING.out },
};

export const voteCardExitMaaske = {
  x: "110%",
  rotate: 12,
  opacity: 0,
  transition: { duration: DURATION.card, ease: EASING.out },
};

export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.08, ease: EASING.out },
};

export const buttonHover = {
  transition: { duration: DURATION.fast, ease: EASING.out },
};
