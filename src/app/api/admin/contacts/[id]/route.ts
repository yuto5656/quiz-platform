import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  handleApiError,
  ApiErrors,
} from "@/lib/api-response";
import { env } from "@/lib/env";

const updateSchema = z.object({
  status: z.enum(["unread", "read", "replied", "closed"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return ApiErrors.unauthorized();
    }

    // 管理者チェック
    const adminEmails = env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (!adminEmails.includes(session.user.email)) {
      return ApiErrors.forbidden();
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = updateSchema.parse(body);

    const contact = await prisma.contact.update({
      where: { id },
      data: { status },
    });

    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return ApiErrors.unauthorized();
    }

    // 管理者チェック
    const adminEmails = env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (!adminEmails.includes(session.user.email)) {
      return ApiErrors.forbidden();
    }

    const { id } = await params;

    await prisma.contact.delete({
      where: { id },
    });

    return successResponse({ message: "削除しました" });
  } catch (error) {
    return handleApiError(error);
  }
}
