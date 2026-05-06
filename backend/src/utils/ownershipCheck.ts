export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const assertOwnership = (resourceUserId: string | undefined, currentUserId: string) => {
  if (!resourceUserId || resourceUserId.toString() !== currentUserId.toString()) {
    throw new NotFoundError(); // strict security rule: always 404, never 403
  }
};
