import React from "react";
import Spline from "@splinetool/react-spline";

type Props = {
  scene?: string;
  className?: string;
};

export default function Spline404Viewer({
  scene = "https://prod.spline.design/ymO8Fsm5OvZ3IfaQ/scene.splinecode",
  className,
}: Props) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }} aria-label="Spline 404 scene">
      <Spline scene={scene} />
    </div>
  );
}
