import { Alert } from "./alert";

export function PageMessage({ success, error }: { success?: string; error?: string }) {
  if (!success && !error) return null;
  return <Alert variant={error ? "error" : "success"}>{error || success}</Alert>;
}
