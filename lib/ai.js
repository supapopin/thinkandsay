import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function getFeedback({ essay, topic, targets }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const prompt = `
You are an English writing TA. Evaluate the essay.
Steps: 
1) grammar & spelling
2) vocabulary variety & target-word usage
3) coherence & logic
4) task response

Make minimal edits only (do NOT rewrite everything).

IMPORTANT for "changes":
- "from" and "to" MUST be the *smallest* phrase that actually changed, NOT the whole sentence.
- Prefer 1~5 words only.
- Example:
  original: "technology effect is both good and bad side"
  corrected: "technology has both a good and a bad side"
  → use: { "from": "is", "to": "has", ... } (NOT the full sentence)
- Preserve ALL existing line breaks and paragraph breaks from the original text.
- When you rewrite the essay ("revised"), DO NOT remove or merge paragraphs.
- Keep the same number of line breaks as the original as much as possible.
- Only change words/phrases/sentences, but keep the paragraph structure and line breaks.

Return JSON with:
{
 "score": { "grammar":0-5, "vocab":0-5, "coherence":0-5, "task":0-5, "overall":0-100 },
 "revised": "the minimally corrected essay",
 "changes": [
   {
     "from": "짧은 원래 표현(전체 문장이 아닌, 바뀐 부분만)",
     "to": "짧은 수정 표현",
     "reason": "short explanation in Korean"
   }
 ]
}

Topic: ${topic || "(no topic provided)"}
Targets: ${JSON.stringify(targets || [])}
Essay:
${essay}
`;

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You must return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenAI error:", text);
    throw new Error("OpenAI API request failed");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  // content는 JSON string
  return JSON.parse(content);
}

export async function generateTopic({ difficulty }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const levelText =
    difficulty === "B1"
      ? "intermediate (B1)"
      : difficulty === "B2"
      ? "upper-intermediate (B2)"
      : "advanced (C1)";

  const prompt = `
You are an English test designer.
Create ONE short essay topic for an English learner at ${levelText} level.

Rules:
- Topic should be suitable for TOEIC-style or general English writing practice.
- Topic must be a single sentence or question.
- Do NOT add explanations or numbering.
- Answer in English only.
`;

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate only one essay topic." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenAI topic error:", text);
    throw new Error("OpenAI topic API request failed");
  }

  const data = await res.json();
  const topic = data.choices?.[0]?.message?.content?.trim();

  if (!topic) {
    throw new Error("No topic generated");
  }

  return topic;
}

export async function generateHintKeywords({ description, difficulty }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const levelText =
    difficulty === "B1"
      ? "intermediate (B1)"
      : difficulty === "B2"
      ? "upper-intermediate (B2)"
      : "advanced (C1)";

  const prompt = `
You receive a description in Korean of what the learner wants to write about.
Your job is to give ONLY useful English keywords and short phrases, not full sentences.

Rules:
- Level: ${levelText}
- Output format: JSON with a "keywords" array.
- Each element is a short word or phrase (max 5 words).
- NO full sentences.
- NO Korean in the output.
- Include 5~10 useful keywords/phrases (verbs, collocations, noun phrases).
- Focus on expressions that will help writing about the topic.

Korean description:
${description}
`;

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenAI hint error:", text);
    throw new Error("OpenAI hint API request failed");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  const parsed = JSON.parse(content);
  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];

  return keywords;
}

export async function generateTopicFromKeyword({ keyword, difficulty }) {
  const levelStr =
    difficulty === "C1"
      ? "상급(C1)"
      : difficulty === "B2"
      ? "중상급(B2)"
      : "중급(B1)";

  const prompt = `
당신은 영어 시험용 에세이 질문을 만드는 전문가입니다.

아래 정보를 바탕으로, 학습자가 에세이를 쓸 수 있는 "질문 문장"을 1개만 만들어 주세요.

조건:
- 난이도: ${levelStr}
- 에세이 주제 키워드: "${keyword}"
- 문장 수: 1문장
- 영어로만 작성
- 의문문 형태(Do you ~ / How should ~ / To what extent ~ 등)로 만들기
- 너무 길지 않게 (20단어 이내)

출력 형식:
- 질문 문장만 한 줄로 출력하고, 다른 설명은 쓰지 마세요.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You generate concise English essay questions." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content || "";
  // 혹시 앞에 따옴표나 불필요한 공백이 있으면 정리
  const cleaned = raw.trim().replace(/^["']/, "").replace(/["']$/, "");
  return cleaned;
}