import { Align, parseText, pushQuad, pushSprite, pushSpriteAndSave, pushText, textHeight, textWidth } from "./draw";
import { Easing, InterpolationData, createInterpolationData } from "./interpolate";
import { gl_restore, gl_save, gl_translate } from "./gl";

import { assert } from "./debug";
import { v2 } from "./v2";

export const enum TAG
{
  NONE,
  TEXT,
  SPRITE
}

//#region Base Node Data
let nextNodeId = 1;

export const node_position: v2[] = [];
export const node_movement: Map<number, InterpolationData> = new Map();
export const node_size: v2[] = [];
export const node_scale: number[] = [];
export const node_enabled: boolean[] = [];
export const node_tags: TAG[] = [];
export const node_visible: boolean[] = [];
export const node_parent: number[] = [0];
export const node_children: number[][] = [[]];

//#endregion Base Node Data

//#region Extended Node Data
export const node_text: string[] = [];
export const node_text_align: Align[] = [];
export const node_drop_shadow: boolean[] = [];

//#endregion Extended Node Data

//#region Base Node
export function createNode(): number
{
  let id = nextNodeId++;

  node_children[id] = [];
  node_parent[id] = 0;
  node_children[0].push(id);

  node_size[id] = [1, 1];
  node_scale[id] = 1;
  node_position[id] = [0, 0];

  node_enabled[id] = true;
  node_visible[id] = true;

  return id;
}

export function addChildNode(parentId: number, childId: number): void
{
  const arr = node_children[node_parent[childId]];
  let index = -1
  for (let i = 0; i < arr.length; i++)
  {
    if (arr[i] === childId)
    {
      index = i;
      break;
    }
  }

  assert(index !== -1, `[${ childId }] This node was not present in its parrent's child list [${ parentId }]`)

  if (index > -1)
  {
    arr.splice(index, 1);
  }
  node_parent[childId] = parentId;
  node_children[parentId].push(childId);
}

export function moveNode(nodeId: number, pos: v2, ease: Easing = Easing.None, duration: number = 0): Promise<void>
{
  if (node_position[nodeId][0] === pos[0] && node_position[nodeId][1] === pos[1])
  {
    return Promise.resolve();
  }
  if (ease !== Easing.None && !node_movement.has(nodeId) && duration > 0)
  {
    return new Promise((resolve, _) =>
    {
      node_movement.set(nodeId, createInterpolationData(duration, node_position[nodeId], pos, ease, resolve));
    });
  }
  node_position[nodeId][0] = pos[0];
  node_position[nodeId][1] = pos[1];
  return Promise.resolve();
}

export function nodeSize(nodeId: number): v2
{
  const size = node_size[nodeId];
  const scale = node_scale[nodeId];
  return [size[0] * scale, size[1] * scale];
}

export function renderNode(nodeId: number, now: number, delta: number): void
{
  if (node_enabled[nodeId])
  {
    const pos = node_position[nodeId];

    gl_save();
    gl_translate(pos[0], pos[1]);

    if (node_visible[nodeId])
    {
      switch (node_tags[nodeId])
      {
        case TAG.TEXT:
          renderTextNode(nodeId);
          break;
        case TAG.SPRITE:
          renderSprite(nodeId, delta);
          break;
        case TAG.NONE:
        default:
      }
    }

    // @ifdef DEBUG
    // const size = nodeSize(nodeId);
    // pushQuad(0, 0, 1, size[1], 0xFF00ff00);
    // pushQuad(0, 0, size[0], 1, 0xFF00ff00);
    // pushQuad(size[0] - 1, 0, 1, size[1], 0xFF00ff00);
    // pushQuad(0, size[1] - 1, size[0], 1, 0xFF00ff00);
    // @endif

    for (let childId of node_children[nodeId])
    {
      renderNode(childId, now, delta);
    }
    gl_restore();
  }
}
//#endregion Base Node

//#region Text Node
export function createTextNode(text: string, scale: number = 1, align: Align = Align.Left, shadow: boolean = false): number
{
  const nodeId = createNode();
  node_tags[nodeId] = TAG.TEXT;
  updateTextNode(nodeId, text, scale, align, shadow);
  return nodeId;
}

export function updateTextNode(nodeId: number, text: string, scale: number = 1, align: Align = Align.Left, shadow: boolean = false): void
{
  const lines = parseText(text);
  const width = textWidth(text.length, scale);
  const height = textHeight(lines, scale);
  node_size[nodeId] = [width, height];
  node_text_align[nodeId] = align;
  node_drop_shadow[nodeId] = shadow;
  node_scale[nodeId] = scale;
  node_text[nodeId] = text;
}

function renderTextNode(nodeId: number): void
{
  const scale = node_scale[nodeId];
  const textAlign = node_text_align[nodeId];
  if (node_drop_shadow[nodeId])
  {
    pushText(node_text[nodeId], scale, scale, { scale, textAlign, colour: 0xFF000000 });
  }
  pushText(node_text[nodeId], 0, 0, { scale, textAlign });
}
//#endregion Text Node

export type Frame = { spriteName: string, duration: number }
const node_sprite_frames: Map<number, Frame[]> = new Map();
const node_sprite_timestamp: number[] = [];
const node_sprite_duration: number[] = [];
export function createSprite(frames: Frame[], scale: number = 1, shadow: boolean = false): number
{
  const nodeId = createNode();

  node_tags[nodeId] = TAG.SPRITE;

  node_scale[nodeId] = scale;
  node_drop_shadow[nodeId] = shadow;

  node_sprite_frames.set(nodeId, frames);
  let duration = 0;
  for (const frame of frames)
  {
    duration += frame.duration;
  }

  node_sprite_duration[nodeId] = duration;
  node_sprite_timestamp[nodeId] = 0;

  return nodeId;
}

function renderSprite(nodeId: number, delta: number): void
{
  const scale = node_scale[nodeId];
  const duration = node_sprite_duration[nodeId];
  const frames = node_sprite_frames.get(nodeId);

  if (frames)
  {
    if (duration > 0)
    {
      node_sprite_timestamp[nodeId] += delta;
      if (node_sprite_timestamp[nodeId] > duration)
      {
        node_sprite_timestamp[nodeId] = 0;
      }
    }

    let currentFrame = frames[0];
    let totalDuration: number = 0;
    for (const frame of frames)
    {
      totalDuration += frame.duration;
      if (node_sprite_timestamp[nodeId] <= totalDuration)
      {
        currentFrame = frame;
        break;
      }
    }

    if (node_drop_shadow[nodeId])
    {
      pushSpriteAndSave(currentFrame.spriteName, scale, scale, 0xFF000000, scale, scale);
    }
    pushSprite(currentFrame.spriteName, 0, 0, 0xFFFFFFFFFF, scale, scale);
  }
}