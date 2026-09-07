import { ImageResponse } from "next/og";
import { getPublicPrompt } from "@/lib/prompts/queries";
import { TASK_TYPE_LABELS } from "@/lib/ai/schema";

export const alt = "Prompt público — COTOR.IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPublicPrompt(id).catch(() => null);

  const title = p?.title ?? "Prompt no COTOR.IA";
  const kind = p ? TASK_TYPE_LABELS[p.taskType] : "";
  const score = p?.score?.overall;
  const grade = p?.score?.grade;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0B0B",
          color: "#F5F5F5",
          padding: 80,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "3px solid #FF5A5F",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#FF5A5F",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, opacity: 0.7 }}>
            COTOR.IA
          </div>
          {kind ? (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                padding: "4px 12px",
                border: "1px solid #333",
                borderRadius: 6,
                opacity: 0.7,
              }}
            >
              {kind}
            </div>
          ) : null}
        </div>

        <div
          style={{
            fontSize: 60,
            lineHeight: 1.1,
            maxWidth: 1040,
            display: "flex",
          }}
        >
          {title.length > 90 ? title.slice(0, 87) + "…" : title}
        </div>

        <div style={{ display: "flex", fontSize: 26 }}>
          {typeof score === "number" ? (
            <span style={{ color: "#FF5A5F" }}>
              {`Prompt Score ${score}/100 · ${grade}`}
            </span>
          ) : (
            <span style={{ opacity: 0.5 }}>prompt público</span>
          )}
        </div>
      </div>
    ),
    size,
  );
}
