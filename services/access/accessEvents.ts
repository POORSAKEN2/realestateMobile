type Listener = (message: string) => void;
const listeners = new Set<Listener>();
export function reportAccessDenied(message: string) { listeners.forEach((listener) => listener(message)); }
export function subscribeAccessDenied(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
