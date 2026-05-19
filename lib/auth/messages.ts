import { redirect } from "next/navigation";

export function redirectWithMessage(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
