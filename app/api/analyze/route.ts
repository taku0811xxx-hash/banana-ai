import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * スコア計算（AI依存を排除）
 */
function calculateScore(colorData: any) {
  const green = colorData?.green || 0;
  const yellow = colorData?.yellow || 0;
  const black = colorData?.black || 0;

  // 重み（ここが熟度ロジックの核）
  const score =
    green * 0.3 +
    yellow * 1.0 +
    black * 0.9;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 状態判定（ルールベース）
 */
function getStatus(score: number, black: number) {
  if (black >= 40) return "熟しすぎ";
  if (score < 40) return "未熟";
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
    const { image, colorData } = await req.json();

    // ① スコアは完全にロジックで決定
    const score = calculateScore(colorData);
    const status = getStatus(score, colorData?.black || 0);
    const daysLeft = getDaysLeft(score);

    // ② GPTは「コメント生成のみ」
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `
あなたはバナナ熟度の説明アシスタントです。

以下のJSONだけを返してください：

{
  "comment": "自然な日本語で1〜2文",
  "bestUse": ["用途1", "用途2", "用途3"]
}

条件：
- スコアや状態は絶対に出力しない
- 専門的すぎない自然な日本語
- ポジティブな表現
- 料理・用途提案中心

状態: ${status}
熟度スコア: ${score}%
`,
        },
      ],
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    // ③ 保存アドバイス（固定ロジック）
    let storageAdvice = [];

    if (score < 40) {
      storageAdvice = [
        "常温で追熟させましょう",
        "風通しの良い場所に置くと熟しやすいです",
        "直射日光は避けましょう",
        "吊るして保存すると傷みにくいです",
      ];
    } else if (score < 90) {
      storageAdvice = [
        "冷蔵すると甘さを維持しやすいです",
        "2〜3日以内に食べるのがおすすめです",
        "茎をラップで包むと長持ちします",
        "野菜室保存がおすすめです",
      ];
    } else {
      storageAdvice = [
        "冷凍保存がおすすめです",
        "スムージーやお菓子作り向きです",
        "カットして保存すると使いやすいです",
        "約1ヶ月保存可能です",
      ];
    }

    // ④ 最終レスポンス統合
    const result = {
      status,
      score,
      daysLeft,
      storageAdvice,
      comment: parsed.comment,
      bestUse: parsed.bestUse || [],
    };

    return Response.json({ result });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "判定失敗" },
      { status: 500 }
    );
  }
}