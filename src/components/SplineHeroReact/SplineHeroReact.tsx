import React from "react";
import Spline from "@splinetool/react-spline";
import style from "./splineHeroReact.module.scss";

/**
 * Hero React con Spline:
 * - Desktop: 60vh (>=1024px)
 * - Mobile/Tablet: 40vh (<1024px)
 * - Monta SOLO una escena según el viewport (mejor perf. que renderizar 2 viewers)
 */
const DESKTOP_SCENE = "https://prod.spline.design/30qGkqFEi3uqAwjY/scene.splinecode";
const MOBILE_SCENE = "https://prod.spline.design/LdSy6WjvZKIW4Jzu/scene.splinecode";

export default function SplineHeroReact() {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, []);

  return (
    <section className={style.SplineHeroReact} aria-label="Spline Hero (React)">
      <div className={style.SplineHeroReact_viewer}>
        <Spline scene={isDesktop ? DESKTOP_SCENE : MOBILE_SCENE} />
      </div>
    </section>
  );
}
