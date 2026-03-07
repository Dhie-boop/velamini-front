import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }
    const { message, history = [], chatId: incomingChatId } = body as {
      message: string;
      history: { role: string; content: string }[];
      chatId?: string;
    };

    // Verify ownership and load org + KB
    const org = await prisma.organization.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        knowledgeBase: { select: { trainedPrompt: true, isModelTrained: true } },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key missing" }, { status: 500 });
    }

    // ── Get or create the Chat record for this test session ──────────
    let chatId = incomingChatId ?? null;

    if (chatId) {
      // Verify this chat belongs to this org (security check)
      const existing = await prisma.chat.findFirst({
        where: { id: chatId, organizationId: id },
        select: { id: true },
      });
      if (!existing) chatId = null; // orphaned id — start a new chat
    }

    if (!chatId) {
      // Tag test sessions with a special userId prefix so they're distinguishable
      const newChat = await prisma.chat.create({
        data: {
          userId: `owner_test:${session.user.id}`,
          organizationId: id,
        },
      });
      chatId = newChat.id;

      // Only count as a new conversation the first time
      await prisma.organization.update({
        where: { id },
        data: { totalConversations: { increment: 1 } },
      });
    }

    // ── Save the user message ────────────────────────────────────────
    await prisma.message.create({
      data: { chatId, role: "user", content: message },
    });

    // ── Build prompt and call DeepSeek ───────────────────────────────
    const agentName = org.agentName || org.displayName || org.name;
    const personality = org.agentPersonality || "You are a helpful, professional assistant.";
    const kbContext = org.knowledgeBase?.isModelTrained && org.knowledgeBase?.trainedPrompt
      ? `\n\nKNOWLEDGE BASE:\n${org.knowledgeBase.trainedPrompt}`
      : "";

    const systemPrompt =
      `You are ${agentName}, the AI agent for ${org.displayName ?? org.name}.\n` +
      `Personality: ${personality}` +
      kbContext +
      `\n\nThis is a test session by the organisation owner. Respond as you would to a real customer.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json({ error: "AI service error", details: err }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't respond.";

    // DeepSeek returns token usage in data.usage
    const promptTokens     = (data.usage?.prompt_tokens     ?? 0) as number;
    const completionTokens = (data.usage?.completion_tokens ?? 0) as number;
    const totalTokens      = (data.usage?.total_tokens      ?? 0) as number;

    // ── Save the assistant reply with token count ─────────────────────
    await prisma.message.create({
      data: { chatId, role: "assistant", content: reply, tokenCount: totalTokens },
    });

    // ── Increment org usage counters ──────────────────────────────────
    // totalMessages counts both user + assistant messages (+2)
    // monthlyMessageCount counts one exchange (+1) — consistent with WhatsApp webhook
    await prisma.organization.update({
      where: { id },
      data: {
        monthlyMessageCount: { increment: 1 },
        totalMessages:       { increment: 2 },
      },
    });

    return NextResponse.json({
      ok: true,
      reply,
      chatId,
      tokens: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
    });
  } catch (error) {
    console.error("Org chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
