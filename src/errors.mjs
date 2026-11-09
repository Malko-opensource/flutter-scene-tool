export class ToolError extends Error {
  constructor(code, message, details = [], exitCode = 2) {
    super(message); this.code = code; this.details = details; this.exitCode = exitCode;
  }
}
