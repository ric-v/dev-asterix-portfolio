"use client";

import BootSequence from "./BootSequence";

interface BootWrapperProps {
  children: React.ReactNode;
}

export default function BootWrapper({ children }: BootWrapperProps) {
  const handleBootComplete = () => {
    // Dispatch post-boot event for terminal auto-run, etc.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("os-post-boot"));
    }, 800);
  };

  return (
    <>
      {/*
        BootSequence renders fixed at z-9999, fully covering the screen.
        Children always render underneath — revealed naturally as the
        boot screen fades out via AnimatePresence.
        No conditional gate = no blank screen on reload.
      */}
      <BootSequence onComplete={handleBootComplete} />
      {children}
    </>
  );
}
