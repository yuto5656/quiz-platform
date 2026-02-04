import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabase, AVATAR_BUCKET, getAvatarUrl } from "@/lib/supabase";

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { customAvatar: true },
    });

    if (user?.customAvatar && user.customAvatar.includes(AVATAR_BUCKET)) {
      // Extract old file path from URL
      const oldPath = user.customAvatar.split(`${AVATAR_BUCKET}/`)[1];
      if (oldPath) {
        await getSupabase().storage.from(AVATAR_BUCKET).remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await getSupabase().storage
      .from(AVATAR_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const publicUrl = getAvatarUrl(data.path);

    // Update user's customAvatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { customAvatar: publicUrl },
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// Delete avatar
export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { customAvatar: true },
    });

    if (user?.customAvatar && user.customAvatar.includes(AVATAR_BUCKET)) {
      // Extract file path from URL
      const filePath = user.customAvatar.split(`${AVATAR_BUCKET}/`)[1];
      if (filePath) {
        await getSupabase().storage.from(AVATAR_BUCKET).remove([filePath]);
      }
    }

    // Clear customAvatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { customAvatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}
