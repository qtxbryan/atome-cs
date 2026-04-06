export async function parseSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  onToolCall?: (name: string) => void,
  onToolDone?: () => void
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

        // SSE format is "data: <content>" — strip exactly the "data:" prefix
        // and one optional separator space. Do NOT trim() the rest, because
        // content chunks may begin with a space (e.g. " world" after "Hello").
        const rest = trimmed.slice(5);
        const payload = rest.startsWith(" ") ? rest.slice(1) : rest;

        if (payload === "[DONE]") {
          onDone();
          return;
        }

        if (payload.startsWith("[ERROR]")) {
          onError(payload.slice(7).trim());
          return;
        }

        if (payload.startsWith("[TOOL_CALL] ")) {
          onToolCall?.(payload.slice(12).trim());
          continue;
        }

        if (payload === "[TOOL_DONE]") {
          onToolDone?.();
          continue;
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
