import { CurrentScene, getSceneRootId } from "./scene";
import { gl_clear, gl_flush, gl_getContext, gl_init, gl_setClear } from "./gl"
import { mainMenuScene, setupMainMenuScene } from "./scenes/main-menu";
import { moveNode, node_movement, renderNode } from "./node";
import { screenHeight, screenWidth } from "./screen";

import { interpolate } from "./interpolate";
import { loadAsset } from "./asset";
import { v2 } from "./v2";

window.addEventListener(`load`, async () =>
{
  const canvas = document.querySelector(`canvas`);
  // @ifdef DEBUG
  if (!canvas) throw `Unable to find canvas element on index.html`;
  // @endif
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  let context = gl_getContext(canvas);
  gl_init(context);

  setupMainMenuScene();

  let then: number;
  let delta: number;
  let currentSceneRootId = -1;
  const loop = (now: number) =>
  {
    delta = now - then;
    then = now;
    gl_clear();

    for (let [childId, interpolationData] of node_movement)
    {
      let i = interpolate(now, interpolationData);
      moveNode(childId, i.values as v2);
      if (i.done)
      {
        moveNode(childId, i.values as v2);
        node_movement.delete(childId);
      }
    }
    currentSceneRootId = getSceneRootId(CurrentScene);
    mainMenuScene(now, delta);
    renderNode(currentSceneRootId, now, delta);

    gl_flush();
    window.requestAnimationFrame(loop);
  };

  await loadAsset("sheet");
  gl_setClear(50, 25, 75);
  then = window.performance.now();
  window.requestAnimationFrame(loop);
});