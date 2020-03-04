const port = window.location.port;
const host = window.location.hostname;
const protocol = window.location.protocol;

export const baseUrl = `${protocol}//${host}:${port}`;
