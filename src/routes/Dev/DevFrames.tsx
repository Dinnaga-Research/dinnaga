// ABOUTME: DEV-only harness route (/dev/frames) for the frame-sequence engine. FOUNDATION PLACEHOLDER:
// ABOUTME: registered in App.tsx only when import.meta.env.DEV; the engine unit replaces it.
export function DevFrames() {
  return <div className="dn-page" data-dev-frames="" />;
}
