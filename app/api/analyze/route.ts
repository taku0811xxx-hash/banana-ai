import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 色データ → スコア（完全ルールベース）
 */
function calculateScore(colorData: any) {
  const green = colorData?.green || 0;
  const yellow = colorData?.yellow || 0;
  const black = colorData?.black || 0;

  // 熟度ロジック（ここが重要）
  const score =
    yellow * 1.0 +
    black * 1.2 +
    green * 0.2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 状態判定（完全ルールベース）
 */
function getStatus(score: number, black: number) {
  if (black >= 35) return "熟しすぎ";
  if (score < 35) return "未熟";
  if (score < 75) return "食べ頃";
  return "ベストピーク";
}

/**
 * 保存目安
 */
function getDaysLeft(score: number) {
  if (score < 30) return "あと5〜7日";
  if (score < 60) return "あと2〜4日";
  if (score < 85) return "あと1〜2日";
  return "今日〜明日";
}

export async function POST(req: Request) {
  try {
    const { colorData } = await req.json();

    // ① 完全ロジック
    const score = calculateScore(colorData);
    const status = getStatus(score, colorData?.black || 0);
    const daysLeft = getDaysLeft(score);

    // ② GPT（説明だけ）
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `
あなたはバナナの説明アシスタントです。

必ずJSONのみ返してください：

{
  "comment": "自然な日本語で1〜2文",
  "bestUse": ["用途1", "用途2", "用途3"]
}

ルール：
- スコア・状態は禁止
- ポジティブな表現
- 料理・活用方法中心

状態: ${status}
熟度: ${score}%
          `,
        },
      ],
    });

    let parsed;
    try {
      parsed = JSON.parse(response.choices[0].message.content || "{}");
    } catch {
      parsed = {
        comment: "ちょうど良い食べ頃です。",
        bestUse: ["そのまま食べる", "スムージー"],
      };
    }

    // ③ 保存アドバイス（固定）
    let storageAdvice = [];

    if (score < 35) {
      storageAdvice = [
        "常温で追熟させましょう",
        "風通しの良い場所に置く",
        "直射日光は避ける",
        "吊るして保存すると良い",
      ];
    } else if (score < 85) {
      storageAdvice = [
        "冷蔵で甘さキープ",
        "2〜3日以内に食べる",
        "茎をラップで包む",
        "野菜室がおすすめ",
      ];
    } else {
      storageAdvice = [
        "冷凍保存がおすすめ",
        "スムージー向き",
        "カットして保存",
        "約1ヶ月保存可能",
      ];
    }

    // ④ 最終返却
    return Response.json({
      result: {
        status,
        score,
        daysLeft,
        storageAdvice,
        comment: parsed.comment,
        bestUse: parsed.bestUse || [],
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "判定失敗" },
      { status: 500 }
    );
  }
}