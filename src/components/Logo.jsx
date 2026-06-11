import React from "react";
import logoPng from "../assets/logo.png";

export function LogoIcon({ size = 40, className = "" }) {
  // Crops the left-most square portion (the blue circle and yellow arrow icon)
  // The logo.png aspect ratio is approx 2.68 : 1
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        overflow: "hidden",
        position: "relative",
        display: "inline-block",
        verticalAlign: "middle"
      }}
    >
      <img
        src={logoPng}
        alt="Vistaraa Logo Icon"
        style={{
          height: "100%",
          width: `${size * 2.68}px`,
          maxWidth: "none",
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
          objectPosition: "left center",
          display: "block"
        }}
      />
    </div>
  );
}

export default function Logo({ size = 40, lightText = false, className = "" }) {
  return (
    <img
      src={logoPng}
      alt="Vistaraa Logo"
      className={className}
      style={{
        height: `${size}px`,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        filter: lightText ? "brightness(0) invert(1)" : "none",
        transition: "filter 0.2s ease"
      }}
    />
  );
}
