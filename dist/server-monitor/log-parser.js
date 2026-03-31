import { detectLevel, isServerReady, extractPort } from './error-detector.js';
export function parseLogLine(text, source) {
    const trimmed = text.trim();
    if (!trimmed) {
        return { ts: new Date().toISOString(), level: 'info', source, text: '' };
    }
    const detected = detectLevel(trimmed);
    const level = detected !== 'info' ? detected : (source === 'stderr' ? 'warn' : 'info');
    const entry = {
        ts: new Date().toISOString(),
        level,
        source,
        text: trimmed,
    };
    if (isServerReady(trimmed)) {
        entry.serverReady = true;
        const port = extractPort(trimmed);
        if (port)
            entry.port = port;
    }
    return entry;
}
export function parseLogChunk(chunk, source) {
    return chunk
        .split('\n')
        .filter(line => line.trim())
        .map(line => parseLogLine(line, source));
}
//# sourceMappingURL=log-parser.js.map