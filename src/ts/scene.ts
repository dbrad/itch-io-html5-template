import { mainMenuRootId } from "./scenes/main-menu";

export const enum Scenes
{
  MainMenu,
  Game,
  GameOver
}

export let CurrentScene: Scenes = Scenes.MainMenu;

export function setScene(scene: Scenes): void
{
  CurrentScene = scene;
}

export function getSceneRootId(scene: Scenes): number 
{
  switch (scene)
  {
    case Scenes.Game:
    case Scenes.GameOver:
    case Scenes.MainMenu:
    default:
      return mainMenuRootId;
  }
}