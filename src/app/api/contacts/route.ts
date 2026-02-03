import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  handleApiError,
  ApiErrors,
  sanitizeInput,
  checkRateLimit,
} from "@/lib/api-response";

const contactSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  content: z.string().min(10, "お問い合わせ内容は10文字以上で入力してください").max(5000, "お問い合わせ内容は5000文字以内で入力してください"),
});

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 requests per minute per IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (!checkRateLimit(`contact:${ip}`, 5, 60000)) {
      return ApiErrors.tooManyRequests();
    }

    const body = await request.json();
    const validated = contactSchema.parse(body);

    // サニタイズ
    const sanitizedData = {
      name: sanitizeInput(validated.name),
      email: validated.email.toLowerCase().trim(),
      content: sanitizeInput(validated.content),
    };

    // ログインユーザーの場合はuserIdを保存
    const session = await auth();
    const userId = session?.user?.id;

    const contact = await prisma.contact.create({
      data: {
        ...sanitizedData,
        userId: userId || null,
      },
    });

    return successResponse({ id: contact.id, message: "お問い合わせを受け付けました" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
