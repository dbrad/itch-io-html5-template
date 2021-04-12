export function saveObject(key: string, object: Object): void
{
  const json = JSON.stringify(object);
  window.localStorage.setItem(key, json);
}

export function loadObject(key: string): Object
{
  const json = window.localStorage.getItem(key);
  if (!json)
  {
    return {};
  }
  return JSON.parse(json);
}