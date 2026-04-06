export async function parseSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  if (!response.body) {
    onError("No response body");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice(5).trim();

        if (payload === "[DONE]") {
          onDone();
          return;
        }

        if (payload.startsWith("[ERROR]")) {
          onError(payload.slice(7).trim());
          return;
        }

        if (payload) {
          onChunk(payload);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
