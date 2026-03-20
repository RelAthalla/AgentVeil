"use client";

import { useEffect, useMemo, useState } from "react";

const lines = [
  "Private Intent Settlement for Autonomous Agents.",
  "Buy data without strategy leakage.",
  "Pay APIs privately on Polkadot.",
  "Rent compute with hidden operator intent.",
  "Settle AI-to-AI flows with protected metadata.",
];

export function HomeTypingCard() {
  const [lineIndex, setLineIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentLine = lines[lineIndex];
    const isComplete = visibleLength === currentLine.length;
    const isEmpty = visibleLength === 0;

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && !isComplete) {
          setVisibleLength((value) => value + 1);
          return;
        }

        if (!isDeleting && isComplete) {
          setIsDeleting(true);
          return;
        }

        if (isDeleting && !isEmpty) {
          setVisibleLength((value) => value - 1);
          return;
        }

        setIsDeleting(false);
        setLineIndex((value) => (value + 1) % lines.length);
      },
      isDeleting ? 38 : isComplete ? 1200 : 72,
    );

    return () => window.clearTimeout(timeout);
  }, [isDeleting, lineIndex, visibleLength]);

  const currentLine = useMemo(() => lines[lineIndex].slice(0, visibleLength), [lineIndex, visibleLength]);

  return (
    <div className="typing-card shell-card">
      <div className="typing-bar">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <div className="typing-window">
        <span className="typing-label">Private intent prompt</span>
        <div className="typing-input">
          <span>{currentLine}</span>
          <span className="typing-caret" />
        </div>
      </div>
    </div>
  );
}
