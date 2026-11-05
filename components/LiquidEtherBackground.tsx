"use client";

import dynamic from "next/dynamic";

const LiquidEther = dynamic(
  () => import("./LiquidEther"),
  { ssr: false }
);

const liquidColors = [
  "#080B14",
  "#111B32",
  "#203B70",
  "#3157A5",
];

export default function LiquidEtherBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden"
      style={{
        background: "#080B14",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <LiquidEther
          colors={liquidColors}
          mouseForce={12}
          resolution={0.4}
          autoDemo={true}
          autoSpeed={0.25}
        />
      </div>
    </div>
  );
}