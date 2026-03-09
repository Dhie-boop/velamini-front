import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    // Require an authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = session.user.id;

    const body = await req.text();
    let template, tone, focus, jobTitle;
    try {
      ({ template, tone, focus, jobTitle } = JSON.parse(body));
    } catch {
      return NextResponse.json({ error: "Malformed JSON in request body" }, { status: 400 });
    }
    // Always use the authenticated user's ID — never accept userId from the client
    const userId = authenticatedUserId;


    // Fetch user profile and their knowledge base
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        knowledgeBase: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Gate: require at least 4 of the 5 knowledge sections to be filled
    const kb2 = user.knowledgeBase;
    const sections = [
      !!(kb2?.fullName || kb2?.birthDate || kb2?.bio),
      !!kb2?.education,
      !!kb2?.experience,
      !!kb2?.skills,
      !!kb2?.projects,
    ];
    const completedCount = sections.filter(Boolean).length;
    if (completedCount < 4) {
      return NextResponse.json(
        { error: `Resume generation requires at least 4 completed knowledge sections. You have ${completedCount}/4.` },
        { status: 403 }
      );
    }

    // Extract resume-relevant fields from knowledgeBase
    type KnowledgeBase = {
      fullName?: string | null;
      birthDate?: string | null;
      birthPlace?: string | null;
      currentLocation?: string | null;
      languages?: string | null;
      bio?: string | null;
      relationshipStatus?: string | null;
      hobbies?: string | null;
      favoriteFood?: string | null;
      education?: string | null;
      experience?: string | null;
      skills?: string | null;
      projects?: string | null;
      awards?: string | null;
      socialLinks?: string | null;
      socialUpdates?: string | null;
      qaPairs?: any;
      rawContent?: string | null;
      isModelTrained?: boolean;
      trainedPrompt?: string | null;
      lastTrainedAt?: Date | null;
      shareSlug?: string | null;
      isPubliclyShared?: boolean;
      shareViews?: number;
      createdAt?: Date;
      updatedAt?: Date;
    };
    const kb: Partial<KnowledgeBase> = user.knowledgeBase || {};
    const resumeData = {
      name: user.name || kb.fullName || undefined,
      email: user.email || undefined,
      image: user.image || undefined,
      location: kb.currentLocation || undefined,
      phone: null,
      linkedin: kb.socialLinks || undefined,
      summary: kb.bio || undefined,
      experience: kb.experience || undefined,
      education: kb.education || undefined,
      certifications: kb.awards || undefined,
      skills: kb.skills || undefined,
      achievements: kb.awards || undefined,
    };

    // Existing CV text uploaded by the user (optional — enhances output quality)
    const existingCv = kb.rawContent?.trim() ?? null;

    // Prepare prompt for DeepSeek LLM
    const resolvedStyle  = template || "modern";
    const resolvedTone   = tone    || "Professional";
    const resolvedFocus  = focus   || "Balanced";
    const targetRole     = jobTitle ? `Target Role: ${jobTitle}` : "";

    const cvSection = existingCv
      ? `\nEXISTING CV (uploaded by user — use this to enrich details, fill gaps, match their real style):\n${existingCv.slice(0, 3000)}\n`
      : "";

    const prompt = `You are an expert resume writer and designer. Given the following user data, write a professional resume in HTML.
${cvSection}

STYLE PREFERENCES:
- Visual Style: ${resolvedStyle} (modern=clean accent colours, classic=traditional, minimal=ultra-clean white space, bold=strong headers high impact)
- Tone: ${resolvedTone}
- Emphasis: ${resolvedFocus}
${targetRole ? `- ${targetRole}` : ""}

DESIGN REQUIREMENTS:
- Use a modern, visually appealing HTML layout with inline CSS only
- Clear header: name, ${targetRole || "professional title"}, contact info, location
- Detailed sections: Summary, Experience, Education, Skills, Projects, Achievements/Certifications
- For each experience entry: company, role, years, location, bullet achievements
- For education: institution, degree, years, short description
- For skills: list with categories if possible
- Tone should feel ${resolvedTone.toLowerCase()} throughout
- Emphasise ${resolvedFocus} aspects where choosing what to highlight
- Watermark: <img src='/logo.png' alt='logo' style='position:absolute;left:24px;bottom:24px;width:60px;opacity:0.12;'>

RULES:
- Return ONLY the HTML body content (no <html>/<head> wrapper)
- Inline CSS only, no external stylesheets
- Do NOT invent facts — use only what is in the user data
- Do NOT use markdown fences
- Say "Summary" not "Professional Summary"

User Data (JSON):
${JSON.stringify(resumeData, null, 2)}

Write the resume HTML now:`;

    // Call DeepSeek API (replace with your actual DeepSeek endpoint and API key)
    const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
    }

    const deepseekRes = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a professional resume writer. Return only clean HTML, no markdown fences, no explanations." },
          { role: "user", content: prompt },
        ],
        max_tokens: 3500,
        temperature: 0.25,
        stream: true,       // stream tokens as they are generated
      }),
    });

    if (!deepseekRes.ok || !deepseekRes.body) {
      const errorBody = await deepseekRes.text();
      console.error("DeepSeek API error:", deepseekRes.status, errorBody);
      return NextResponse.json({ error: "Failed to generate resume. Please try again." }, { status: 500 });
    }

    // Collect the full SSE stream server-side so we can save it to the DB
    const upstreamReader = deepseekRes.body.getReader();
    const decoder = new TextDecoder();
    let fullHtml = "";

    while (true) {
      const { done, value } = await upstreamReader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") break;
        try {
          const parsed = JSON.parse(payload);
          const chunk: string | undefined = parsed.choices?.[0]?.delta?.content;
          if (chunk) fullHtml += chunk;
        } catch { /* skip malformed lines */ }
      }
    }

    // Strip any accidental markdown fences the model may emit
    fullHtml = fullHtml.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();

    if (!fullHtml) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 500 });
    }

    // Persist to DB so the user can review, re-download, or delete later
    const saved = await prisma.generatedResume.create({
      data: {
        userId,
        html:     fullHtml,
        style:    template || "modern",
        tone:     tone     || "Professional",
        jobTitle: jobTitle || null,
      },
    });

    // Return as JSON — client will animate it word-by-word using streamText()
    return NextResponse.json({ text: fullHtml, resumeId: saved.id });

  } catch (err) {
    console.error("[generate-resume]", err);
    return NextResponse.json({ error: "Failed to generate resume. Please try again." }, { status: 500 });
  }
}
