// ABOUTME: The one way the function talks to upstreams: fetch with a 5-second limit that covers the
// ABOUTME: connection and the body. Returns status and text, so callers can tell a 404 from a failure.

export const TIMEOUT_MS = 5000;

export interface Reply {
  status: number;
  ok: boolean;
  body: string;
}

export async function fetchText(url: string, headers: Record<string, string>): Promise<Reply> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`timed out after ${TIMEOUT_MS} ms`));
      controller.abort();
    }, TIMEOUT_MS);
  });
  const work = (async (): Promise<Reply> => {
    const res = await fetch(url, { headers, signal: controller.signal });
    return { status: res.status, ok: res.ok, body: await res.text() };
  })();
  work.catch(() => undefined); // if the timeout wins, the aborted request's rejection is expected
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
