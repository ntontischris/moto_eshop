import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handoffToHumanTool,
  handoffToHumanInputSchema,
  type HandoffResult,
} from "./handoff-to-human";

const sendMock = vi.fn();
vi.mock("resend", () => {
  function Resend(this: { emails: { send: typeof sendMock } }) {
    this.emails = { send: sendMock };
  }
  return { Resend };
});

vi.stubEnv("RESEND_API_KEY", "test_key");
vi.stubEnv("CHAT_HANDOFF_TO", "sales@motomarket-shop.gr");

describe("handoffToHumanTool", () => {
  beforeEach(() => sendMock.mockReset());

  it("requires reason and summary", () => {
    expect(handoffToHumanInputSchema.safeParse({}).success).toBe(false);
    expect(handoffToHumanInputSchema.safeParse({ reason: "x" }).success).toBe(
      false,
    );
  });

  it("calls Resend with the configured To address and includes summary", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "e_1" }, error: null });

    const out = (await handoffToHumanTool.execute!(
      { reason: "custom order", summary: "Wants a Klim jacket in size XS" },
      { toolCallId: "x", messages: [] } as never,
    )) as HandoffResult;

    expect(out.delivered).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    const arg = sendMock.mock.calls[0][0];
    expect(arg.to).toContain("sales@motomarket-shop.gr");
    expect(arg.subject).toContain("custom order");
    const body = (arg.html ?? arg.text ?? "") as string;
    expect(body).toContain("Klim jacket");
  });

  it("returns delivered=false on Resend error without throwing", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const out = (await handoffToHumanTool.execute!(
      { reason: "x_reason", summary: "ten chars yo" },
      { toolCallId: "x", messages: [] } as never,
    )) as HandoffResult;
    expect(out.delivered).toBe(false);
    expect(out.error).toContain("boom");
  });

  it("returns delivered=false when RESEND_API_KEY is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const out = (await handoffToHumanTool.execute!(
      { reason: "x_reason", summary: "ten chars yo" },
      { toolCallId: "x", messages: [] } as never,
    )) as HandoffResult;
    expect(out.delivered).toBe(false);
    expect(out.error).toContain("not configured");
    vi.stubEnv("RESEND_API_KEY", "test_key");
  });
});
