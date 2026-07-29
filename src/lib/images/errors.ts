/**
 * A rejected image the user can do something about — wrong format, too large,
 * an unreachable or non-public URL. Its message is safe to show verbatim and
 * maps to a 400; anything else is an internal fault and maps to a 500.
 */
export class ImageInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageInputError';
  }
}
