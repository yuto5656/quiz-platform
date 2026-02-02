import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Quiz Platform";
  const description = searchParams.get("description") || "クイズを作って、みんなで楽しもう";
  const type = searchParams.get("type") || "default";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 80px",
            maxWidth: "90%",
          }}
        >
          {type === "quiz" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                padding: "8px 24px",
                backgroundColor: "#3b82f6",
                borderRadius: "9999px",
                fontSize: "24px",
                color: "white",
              }}
            >
              Quiz
            </div>
          )}
          {type === "result" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                padding: "8px 24px",
                backgroundColor: "#22c55e",
                borderRadius: "9999px",
                fontSize: "24px",
                color: "white",
              }}
            >
              Result
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: "60px",
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              lineHeight: 1.2,
              marginBottom: "20px",
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {title.length > 40 ? title.substring(0, 40) + "..." : title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#94a3b8",
              textAlign: "center",
              maxWidth: "100%",
            }}
          >
            {description.length > 80
              ? description.substring(0, 80) + "..."
              : description}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              fontWeight: "bold",
              color: "#3b82f6",
            }}
          >
            Quiz Platform
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
