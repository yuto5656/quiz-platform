import { auth } from "@/lib/auth";
import { successResponse, ApiErrors } from "@/lib/api-response";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return successResponse({ isAdmin: false });
    }

    const adminEmails = env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    const isAdmin = adminEmails.includes(session.user.email);

    return successResponse({ isAdmin });
  } catch {
    return ApiErrors.internalError();
  }
}
