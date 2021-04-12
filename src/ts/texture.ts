import { gl_createTexture } from "./gl";

export type Texture = {
  _atlas: WebGLTexture;
  w: number;
  h: number;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
};

export type TextureJson = {
  type: "sprite" | "row";
  name: string | string[];
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TextureAssetJson = {
  type: "textures";
  name: string;
  url: string;
  textures: TextureJson[];
};

export const ATLAS_CACHE: Map<string, WebGLTexture> = new Map();
export const TEXTURE_CACHE: Map<string, Texture> = new Map();

export function loadSpriteSheet(sheet: TextureAssetJson): Promise<void>
{
  const image: HTMLImageElement = new Image();
  // @ifdef DEBUG
  console.log("LOADING SPRITESHEET => " + sheet.name);
  // @endif

  return new Promise((resolve, reject) =>
  {
    try
    {
      image.addEventListener("load", () =>
      {
        // @ifdef DEBUG
        console.log("CREATING TEXTURE => " + sheet.name);
        // @endif
        const canvas = document.createElement("canvas")
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d")?.drawImage(image, 0, 0);
        const glTexture: WebGLTexture = gl_createTexture(canvas);
        ATLAS_CACHE.set(sheet.name, glTexture);

        for (const texture of sheet.textures)
        {
          if (texture.type === "sprite")
          {
            // @ifdef DEBUG
            console.log("LOADING SPRITE => " + texture.name);
            // @endif
            TEXTURE_CACHE.set(texture.name as string, {
              _atlas: glTexture,
              w: texture.w,
              h: texture.h,
              u0: texture.x / canvas.width,
              v0: texture.y / canvas.height,
              u1: (texture.x + texture.w) / canvas.width,
              v1: (texture.y + texture.h) / canvas.height
            });
          }
          else
          {
            for (let ox: number = texture.x, i: number = 0; ox < canvas.width; ox += texture.w)
            {
              // @ifdef DEBUG
              console.log("LOADING SPRITE ROW");
              // @endif
              TEXTURE_CACHE.set(texture.name[i], {
                _atlas: glTexture,
                w: texture.w,
                h: texture.h,
                u0: ox / canvas.width,
                v0: texture.y / canvas.height,
                u1: (ox + texture.w) / canvas.width,
                v1: (texture.y + texture.h) / canvas.height
              });
              i++;
            }
          }
        }
        let i = 1;
        for (let x = 0; x < canvas.width; x += 8)
        {
          TEXTURE_CACHE.set(`t${ i++ }`, {
            _atlas: glTexture,
            w: 8,
            h: 8,
            u0: x / canvas.width,
            v0: 48 / canvas.height,
            u1: (x + 8) / canvas.width,
            v1: (48 + 8) / canvas.height
          });
        }
        resolve();
      });
      image.src = sheet.url;
    }
    catch (err)
    {
      reject(err);
    }
  });
};