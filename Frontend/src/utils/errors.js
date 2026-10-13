export const messageFrom = (error) =>
  error instanceof Error ? error.message : "Something went wrong.";
