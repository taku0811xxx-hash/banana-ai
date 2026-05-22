import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { image, colorData } =
            await req.json();

        const response =
            await openai.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `
このバナナの熟し具合を判定してください。

JSON形式のみで返してください。

形式：

{
  "status": "食べ頃",
  "score": 82,
  "comment": "今が一番甘いタイミングです。",
  "bestUse": [
    "そのまま食べる",
    "スムージー"
  ],
  "daysLeft": "あと2日"
}

色解析結果：

- 黄色率：${colorData?.yellow || 0}%
- 緑率：${colorData?.green || 0}%
- 黒率：${colorData?.black || 0}%

この数値も参考にして、
熟し具合を判定してください。

判断基準：

- 緑が多い → 未熟
- 黄色が多い → 食べ頃
- 黒が多い → 熟しすぎ

ルール：

- score は0〜100
- comment は自然な日本語
- bestUse は配列
- daysLeft は保存目安

bestUse 候補例：

- そのまま食べる
- スムージー
- バナナジュース
- バナナケーキ
- パンケーキ
- バナナトースト
- ヨーグルトトッピング
- 冷凍バナナ
- アイス風
- 離乳食
- プロテインスムージー
- チョコバナナ
- 焼きバナナ
- ジャム
`,
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: image,
                                },
                            },
                        ],
                    },
                ],
            });

        const content =
            response.choices[0].message.content ||
            "";

        const cleaned = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        let storageAdvice = [];

        // 保存方法ロジック
        if (parsed.score < 40) {
            storageAdvice = [
                "常温で追熟させましょう",
                "まだ少し青めなので冷蔵保存はおすすめしません",
                "風通しの良い場所に置くと追熟しやすいです",
                "直射日光は避けましょう",
                "吊るして保存すると傷みにくくなります",
            ];
        } else if (parsed.score < 90) {
            storageAdvice = [
                "冷蔵すると甘さを維持しやすいです",
                "2〜3日以内に食べるのがおすすめです",
                "皮は黒くなっても中身は問題ありません",
                "茎をラップで包むと長持ちしやすいです",
                "野菜室保存がおすすめです",
            ];
        } else {
            storageAdvice = [
                "冷凍保存がおすすめです",
                "スムージーやお菓子作り向きです",
                "皮を剥いてから冷凍すると使いやすいです",
                "カットしてジップ袋で保存がおすすめです",
                "そのまま冷凍すると解凍時に剥きにくくなります",
                "冷凍で約1ヶ月ほど保存できます",
            ];
        }

        // JSONへ追加
        parsed.storageAdvice =
            storageAdvice;

        return Response.json({
            result: JSON.stringify(parsed),
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                error: "判定失敗",
            },
            {
                status: 500,
            }
        );
    }
}