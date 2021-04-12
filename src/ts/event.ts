type EventHanlder = (...args: any[]) => void;
type ValidEvent = "test";
const allEvents: Map<ValidEvent, Set<EventHanlder>> = new Map();
export function subscribe(eventName: ValidEvent, handler: EventHanlder): void
{
  let handlers = allEvents.get(eventName);
  if (!handlers)
  {
    handlers = new Set();
  }
  handlers.add(handler);
  allEvents.set(eventName, handlers);
}

export function unsubscribe(eventName: ValidEvent, handler: EventHanlder)
{
  let handlers = allEvents.get(eventName);
  if (!handlers)
  {
    return;
  }
  handlers.delete(handler);
  allEvents.set(eventName, handlers);
}

export function unsubscribeAll(eventName: ValidEvent)
{
  let handlers = allEvents.get(eventName);
  if (!handlers)
  {
    return;
  }
  handlers.clear();
  allEvents.set(eventName, handlers);
}

export function emit(eventName: ValidEvent, ...args: any[])
{
  let handlers = allEvents.get(eventName);
  if (!handlers)
  {
    return;
  }
  for (const handler of handlers)
  {
    handler(...args);
  }
}