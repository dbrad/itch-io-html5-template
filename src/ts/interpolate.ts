export const enum Easing
{
  None,
  Linear,
  EaseInBack,
  EaseInOutBack,
  EaseOutQuad,
  Bounce,
};

function linear(t: number): number
{
  return t;
};

function easeInBack(t: number): number
{
  const s: number = 1.70158;
  return (t) * t * ((s + 1) * t - s);
};

function bounce(t: number): number
{
  if (t < (1 / 2.75))
  {
    return (7.5625 * t * t);
  } else if (t < (2 / 2.75))
  {
    return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
  } else if (t < (2.5 / 2.75))
  {
    return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
  } else
  {
    return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
  }
};

function easeInOutBack(t: number)
{
  let s: number = 1.70158;
  t /= 0.5;
  if (t < 1) { return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s)); }
  return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
};

function easeOutQuad(t: number)
{
  return t * (2 - t);
};

function ease(t: number, fn: Easing = Easing.Linear): number
{
  switch (fn)
  {
    case Easing.EaseOutQuad:
      return easeOutQuad(t);
    case Easing.EaseInBack:
      return easeInBack(t);
    case Easing.EaseInOutBack:
      return easeInOutBack(t);
    case Easing.Bounce:
      return bounce(t);
    case Easing.Linear:
      return linear(t);
    case Easing.None:
    default:
      return 1;
  }
}

export type InterpolationData =
  {
    startTime: number,
    duration: number,
    origin: number[],
    target: number[],
    easing: Easing,
    callback: ((...args: any[]) => void) | null
  }

type InterpolationResult =
  {
    values: number[],
    done: boolean
  }

export function createInterpolationData(
  duration: number,
  origin: number[],
  destination: number[],
  easing: Easing = Easing.Linear,
  callback: ((...args: any[]) => void) | null = null): InterpolationData
{
  return {
    startTime: -1,
    duration: duration,
    origin: [...origin],
    target: [...destination],
    easing: easing,
    callback: callback
  };
}

export function interpolate(now: number, interpolationData: InterpolationData): InterpolationResult
{
  if (interpolationData.startTime === -1)
  {
    interpolationData.startTime = now;
  }
  let elapsed = now - interpolationData.startTime;
  if (elapsed >= interpolationData.duration)
  {
    if (interpolationData.callback)
    {
      interpolationData.callback();
    }
    return { values: interpolationData.target, done: true };
  }

  let p = ease(elapsed / interpolationData.duration, interpolationData.easing);

  let values: number[] = [];
  for (let i = 0, len = interpolationData.origin.length; i < len; i++)
  {
    values[i] = interpolationData.origin[i] + Math.round(interpolationData.target[i] - interpolationData.origin[i]) * p;
  }
  return { values: values, done: false };
}