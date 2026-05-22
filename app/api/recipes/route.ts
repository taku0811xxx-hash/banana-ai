import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Pexels画像取得
async function getRecipeImage(
    query: string
) {
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(
                query
            )}&per_page=1`,
            {
                headers: {
                    Authorization:
                        process.env.PEXELS_API_KEY || "",
                },
            }
        );

        const data = await res.json();

        return (
            data.photos?.[0]?.src?.large ||
            ""
        );
    } catch (error) {
        console.error(error);

        return "";
    }
}

export async function POST(req: Request) {
    try {
        const {
            status,
            score,
            ingredients,
        } = await req.json();

        const prompt = `
あなたはプロの料理AIです。

バナナの状態：
${status}

熟度：
${score}%

家にある材料：
${ingredients || "特になし"}

この条件に合うレシピを3つ提案してください。

重要ルール：

- 実際に作れるレベルで詳しく書く
- 材料には必ず分量を書く
- 作り方は初心者でも分かるように詳しく書く
- 手順は最低3工程以上
- バナナスムージーなら牛乳など必要材料をちゃんと含める
- 省略しない
- 日本語で自然に書く

JSONのみ返してください。

形式：

{
  "recipes": [
    {
      "name": "バナナスムージー",
      "description": "完熟バナナを使った甘いスムージー",
      "ingredients": [
        "バナナ 1本",
        "牛乳 200ml",
        "はちみつ 小さじ1"
      ],
      "steps": [
        "バナナの皮をむいて適当な大きさに切ります",
        "ミキサーにバナナ、牛乳、はちみつを入れます",
        "30秒ほど滑らかになるまで混ぜます",
        "グラスに注いで完成です"
      ]
    }
  ]
}
`;

        const response =
            await openai.chat.completions.create({
                model: "gpt-4.1-mini",
                temperature: 0.7,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

        const text =
            response.choices[0].message.content ||
            "";

        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        // 画像取得
        for (const recipe of parsed.recipes) {
            const query =
                recipe.imageQuery ||
                recipe.name;

            recipe.image =
                await getRecipeImage(query);
        }

        return Response.json(parsed);
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                error: "レシピ生成失敗",
            },
            {
                status: 500,
            }
        );
    }
}