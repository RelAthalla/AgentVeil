import type { SVGProps } from "react";

export function BrandLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="agentveil-gradient" x1="12" y1="14" x2="80" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8A5CFF" />
          <stop offset="0.55" stopColor="#49C9FF" />
          <stop offset="1" stopColor="#1EF2BC" />
        </linearGradient>
      </defs>
      <path
        d="M48 10 77 21.5v21.7c0 17.5-11.8 31.1-29 42.8C30.8 74.3 19 60.7 19 43.2V21.5L48 10Z"
        stroke="url(#agentveil-gradient)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M33 55.5c5.1 6.2 10.1 10.8 15 14.5 5.4-4 10.8-8.8 16-15.4-1.3-12.8-7.1-20.1-16-24.7-9.7 4.8-14.3 13.5-15 25.6Z"
        fill="rgba(255,255,255,0.02)"
        stroke="url(#agentveil-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M35 39.5c3.7-9.2 10-14.3 13-16.5 5.8 3 10.1 7.6 13.2 13.8"
        stroke="url(#agentveil-gradient)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="m39.2 45.5 9 4.3 10.1-4.3"
        stroke="url(#agentveil-gradient)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
