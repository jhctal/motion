import { isAxiosError } from "axios";

// A readable message from a failed API call. The backend sends
// `{ message }`; Mongo duplicate-key errors arrive raw, so translate those.
export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
) {
  const message = isAxiosError(err)
    ? (err.response?.data?.message as string | undefined)
    : err instanceof Error
      ? err.message
      : undefined;

  if (!message) return fallback;
  if (message.includes("E11000")) {
    if (message.includes("username")) return "That username is already taken";
    if (message.includes("email"))
      return "An account with that email already exists";
    return "That account already exists";
  }
  if (message === "User already exists") {
    return "An account with that email already exists";
  }
  return message;
}
