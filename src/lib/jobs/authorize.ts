import { timingSafeEqual } from "node:crypto";

export function isAuthorizedJobRequest(request: Request) {
  const expectedSecret = process.env.JOB_SECRET;
  const authorization = request.headers.get("authorization");
  const receivedSecret = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!expectedSecret || !receivedSecret || expectedSecret.length !== receivedSecret.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expectedSecret), Buffer.from(receivedSecret));
}
