import { gl } from "./gl"
import { loadAsset } from "./asset";

window.addEventListener(`load`, async () =>
{
  const canvas = document.querySelector(`canvas`);
  // @ifdef DEBUG
  if (!canvas) throw `Unable to find canvas element on index.html`;
  // @endif
  canvas.width = 640;
  canvas.height = 360;
  let context = gl.getGLContext(canvas);
  gl.initGL(context);

  let then: number;
  let delta: number;
  const loop = (now: number) =>
  {
    delta = now - then;
    then = now;
    gl.clear();

    gl.flush();
    window.requestAnimationFrame(loop);
  };

  await loadAsset("sheet");
  then = window.performance.now();
  window.requestAnimationFrame(loop);
});