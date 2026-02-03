import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  handleApiError,
  ApiErrors,
} from "@/lib/api-response";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return ApiErrors.unauthorized();
    }

    // 管理者チェック（環境変数で管理者メールを設定）
    const adminEmails = env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (!adminEmails.includes(session.user.email)) {
      return ApiErrors.forbidden();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return successResponse({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
