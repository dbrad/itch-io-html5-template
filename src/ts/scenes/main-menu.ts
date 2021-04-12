import { addChildNode, createNode, createTextNode, node_position, node_size, node_visible } from "../node";
import { screenCenterX, screenHeight, screenWidth } from "../screen";

import { Align } from "../draw";

export let mainMenuRootId = -1;
let mainMenuTitleText = -1;
export function setupMainMenuScene(): void
{
  mainMenuRootId = createNode();
  node_visible[mainMenuRootId] = false;
  node_size[mainMenuRootId][0] = screenWidth;
  node_size[mainMenuRootId][1] = screenHeight;

  mainMenuTitleText = createTextNode("Main Menu", 6, Align.Center, true);
  node_position[mainMenuTitleText][0] = screenCenterX;
  node_position[mainMenuTitleText][1] = 50;
  addChildNode(mainMenuRootId, mainMenuTitleText);
}
export function mainMenuScene(now: number, delta: number): void
{

}