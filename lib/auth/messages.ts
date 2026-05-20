import { redirect } from "next/navigation";

export function redirectWithMessage(path: string, type: "success" | "error", message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${type}=${encodeURIComponent(message)}`);
}
