import { ImageResponse } from "next/og";

export const alt = "COTOR.IA — copiloto de engenharia de prompts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "3px solid #FF5A5F",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#FF5A5F",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, opacity: 0.7 }}>
            COTOR.IA
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 66, lineHeight: 1.15 }}>
            <span>Você diz a intenção.</span>
            <span>O COTOR faz a engenharia do prompt.</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#FF5A5F", letterSpacing: 2 }}>
            Create · Optimize · Test · Organize · Reuse
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, opacity: 0.5 }}>
          cotor-ia.vercel.app
        </div>
      </div>
    ),
    size,
  );
}
