"use client";

import { useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import BananaMap from "./components/BananaMap";
import { testCases } from "@/lib/testCases";

export default function Home() {
  const [image, setImage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [colorData, setColorData] = useState<any>(null);
  const [croppedImage, setCroppedImage] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [spots, setSpots] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [accuracySummary, setAccuracySummary] = useState<any>(null);
  const [accuracy, setAccuracy] = useState<any>(null);

  const [ingredients, setIngredients] =
    useState("");

  const [recipes, setRecipes] = useState<any[]>(
    []
  );

  const [recipeLoading, setRecipeLoading] =
    useState(false);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;

      setImage(base64);
      setResult(null);

      detectBanana(base64);
      analyzeColors(base64);
      setRecipes([]);
    };

    reader.readAsDataURL(selectedFile);
  };

  const analyzeColors = (
    imageSrc: string
  ) => {
    const img = new Image();

    img.src = imageSrc;

    img.onload = () => {
      const canvas =
        document.createElement("canvas");

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const data = imageData.data;

      let yellow = 0;
      let green = 0;
      let black = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 黄色
        if (
          r > 180 &&
          g > 150 &&
          b < 120
        ) {
          yellow++;
        }

        // 緑
        else if (
          g > r &&
          g > b
        ) {
          green++;
        }

        // 黒
        else if (
          r < 80 &&
          g < 80 &&
          b < 80
        ) {
          black++;
        }
      }

      const total =
        yellow + green + black;

      setColorData({
        yellow: Math.round(
          (yellow / total) * 100
        ),
        green: Math.round(
          (green / total) * 100
        ),
        black: Math.round(
          (black / total) * 100
        ),
      });
    };
  };

  const analyzeSpots = (
    imageSrc: string
  ) => {
    const img = new Image();

    img.src = imageSrc;

    img.onload = () => {
      const canvas =
        document.createElement("canvas");

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData =
        ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

      const data = imageData.data;

      const detectedSpots: any[] = [];

      for (
        let y = 0;
        y < canvas.height;
        y += 8
      ) {
        for (
          let x = 0;
          x < canvas.width;
          x += 8
        ) {
          const index =
            (y * canvas.width + x) * 4;

          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          // 黒っぽい場所
          if (
            r < 70 &&
            g < 70 &&
            b < 70
          ) {
            // 間引き
            if (Math.random() > 0.97) {
              detectedSpots.push({
                x:
                  (x / canvas.width) * 100,
                y:
                  (y / canvas.height) * 100,
              });
            }
          }
        }
      }

      setSpots(detectedSpots);
    };
  };

  const detectBanana = async (
    imageSrc: string
  ) => {
    const img = new Image();

    img.src = imageSrc;

    img.onload = async () => {
      const model =
        await cocoSsd.load();

      const predictions =
        await model.detect(img);

      const banana =
        predictions.find(
          (p) => p.class === "banana"
        );

      if (!banana) {
        alert(
          "バナナが見つかりませんでした"
        );
        return;
      }

      const [x, y, width, height] =
        banana.bbox;

      const canvas =
        document.createElement("canvas");

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(
        img,
        x,
        y,
        width,
        height,
        0,
        0,
        width,
        height
      );

      const cropped =
        canvas.toDataURL("image/jpeg");

      // デバッグ表示用
      setCroppedImage(cropped);

      // 元画像はそのまま表示
      setImage(imageSrc);

      // 切り抜き画像を解析
      analyzeColors(cropped);
    };
  };

  const sleep = (ms: number) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  const analyzeBanana = async () => {
    if (!image) return;

    setLoading(true);

    setLoadingText("画像読み込み中...");
    await sleep(700);

    setLoadingText("バナナ検出中...");
    await sleep(1000);

    setLoadingText("色解析中...");
    await sleep(1000);

    setLoadingText("シュガースポット解析中...");
    await sleep(1200);

    setLoadingText("熟度計算中...");
    await sleep(800);

    setLoadingText("AIレシピ生成中...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          image,
          colorData,
        }),
      });

      const data = await res.json();

      setResult(data.result);
      analyzeSpots(image);

      // 前回のレシピをリセット
      setRecipes([]);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const generateRecipes = async () => {
    if (!result) return;

    setRecipeLoading(true);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          status: result.status,
          score: result.score,
          ingredients,
        }),
      });

      const data = await res.json();

      setRecipes(data.recipes || []);
    } catch (error) {
      console.error(error);
    }

    setRecipeLoading(false);
  };

  // const runAccuracyTest = async () => {
  //   setTestLoading(true);

  //   const summary = {
  //     green: { correct: 0, total: 0 },
  //     yellow: { correct: 0, total: 0 },
  //     black: { correct: 0, total: 0 },
  //   };

  //   const results: any[] = [];

  //   for (const test of testCases) {
  //     const res = await fetch("/api/analyze", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         image: test.image,
  //         colorData: null,
  //       }),
  //     });

  //     const data = await res.json();
  //     const result =
  //       typeof data.result === "string"
  //         ? JSON.parse(data.result)
  //         : data.result;

  //     const expected =
  //       test.expectedStatus === "未熟"
  //         ? "未熟"
  //         : test.expectedStatus === "食べ頃"
  //           ? "食べ頃"
  //           : "熟しすぎ";

  //     const actual = result.status;

  //     results.push({
  //       name: test.name,
  //       expected,
  //       actual,
  //       score: result.score,
  //       correct: actual === expected,
  //     });

  //     // -------------------------
  //     // 集計ロジック
  //     // -------------------------
  //     const category =
  //       expected === "未熟"
  //         ? "green"
  //         : expected === "食べ頃"
  //           ? "yellow"
  //           : "black";

  //     summary[category].total++;

  //     if (actual === expected) {
  //       summary[category].correct++;
  //     }
  //   }

  //   // -------------------------
  //   // 精度計算
  //   // -------------------------
  //   const accuracyCalc = {
  //     green:
  //       summary.green.total === 0
  //         ? 0
  //         : summary.green.correct / summary.green.total,

  //     yellow:
  //       summary.yellow.total === 0
  //         ? 0
  //         : summary.yellow.correct / summary.yellow.total,

  //     black:
  //       summary.black.total === 0
  //         ? 0
  //         : summary.black.correct / summary.black.total,
  //   };

  //   setTestResults(results);
  //   setAccuracySummary(summary);
  //   setAccuracy(accuracyCalc);

  //   setTestLoading(false);
  // };

  return (
    <main className="min-h-screen overflow-x-hidden bg-yellow-50 p-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10">
          {/* タイトル */}
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold">
              食べ頃チェッカー
            </h1>

            <p className="text-gray-500 mt-3">
              バナナの食べ頃を判定します
            </p>
          </div>

          {/* <button
            onClick={runAccuracyTest}
            className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold"
          >
            精度テスト実行
          </button> */}

          {/* 画像選択 */}
          <div className="mt-8 max-w-md mx-auto">
            <label className="block">
              <div className="bg-yellow-400 hover:bg-yellow-500 transition text-white text-center py-4 rounded-2xl cursor-pointer font-bold text-lg shadow">
                写真を選択
              </div>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>

          {/* 画像 + 判定 */}
          {(image || result) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
              {/* 左 */}
              <div>
                <div className="relative">
                  <img
                    src={image}
                    alt=""
                    className="w-full rounded-3xl shadow-lg"
                  />

                  {loading && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                      <div className="scan-line" />
                    </div>
                  )}

                  {/* {spots.map((spot, index) => (
                    <div
                      key={index}
                      className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"
                      style={{
                        left: `${spot.x}%`,
                        top: `${spot.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))} */}
                </div>


                {image && !loading && (
                  <button
                    onClick={analyzeBanana}
                    className="w-full mt-5 bg-green-500 hover:bg-green-600 transition text-white font-bold py-4 rounded-2xl text-lg shadow"
                  >
                    判定スタート
                  </button>
                )}
                {/* {croppedImage && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-2">
                      デバッグ：切り抜き画像
                    </p>

                    <img
                      src={croppedImage}
                      alt=""
                      className="w-full rounded-2xl border-4 border-red-400"
                    />
                  </div>
                )} */}

                {loading && (
                  <div className="mt-5 bg-white rounded-2xl p-6 shadow text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    </div>

                    <p className="text-2xl font-bold">
                      AI解析中...
                    </p>

                    <p className="text-gray-500 mt-3 animate-pulse">
                      {loadingText}
                    </p>

                    <div className="mt-6 space-y-2 text-left max-w-sm mx-auto">
                      <div className="bg-yellow-100 rounded-xl px-4 py-2">
                        ✓ 画像スキャン
                      </div>

                      <div className="bg-yellow-100 rounded-xl px-4 py-2">
                        ✓ バナナ領域検出
                      </div>

                      <div className="bg-yellow-100 rounded-xl px-4 py-2">
                        ✓ シュガースポット解析
                      </div>

                      <div className="bg-yellow-100 rounded-xl px-4 py-2">
                        ✓ 熟度推定
                      </div>

                      <div className="bg-yellow-100 rounded-xl px-4 py-2">
                        ✓ AIレシピ生成
                      </div>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="mt-16">
                    <h2 className="text-3xl font-bold text-center">
                      🌍 世界のバナナマップ
                    </h2>
                    <div className="mt-8">
                      <BananaMap />
                    </div>
                  </div>
                )}

                {accuracy && (
                  <div className="mb-6 bg-blue-50 p-4 rounded-xl">
                    <h3 className="font-bold mb-2">📊 精度サマリー</h3>

                    <p>未熟（green）: {Math.round(accuracy.green * 100)}%</p>
                    <p>食べ頃（yellow）: {Math.round(accuracy.yellow * 100)}%</p>
                    <p>熟しすぎ（black）: {Math.round(accuracy.black * 100)}%</p>
                  </div>
                )}

                {testResults.length > 0 && (
                  <div className="mt-10 bg-white p-6 rounded-2xl shadow">
                    <h2 className="text-xl font-bold mb-4">
                      🧪 精度テスト結果
                    </h2>

                    {testResults.map((r, i) => (
                      <div
                        key={i}
                        className="border-b py-3 flex justify-between"
                      >
                        <div>
                          <p className="font-bold">{r.name}</p>
                          <p className="text-sm text-gray-500">
                            期待: {r.expected} / 実際: {r.actual}
                          </p>
                        </div>

                        <div>
                          {r.correct ? (
                            <span className="text-green-600 font-bold">
                              ✔ 正解
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">
                              ✖ ミス
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}


              </div>

              {/* 右 */}
              {result && (
                <div className="bg-yellow-100 rounded-3xl p-6">
                  <p className="text-gray-500 text-sm text-center">
                    判定結果
                  </p>

                  <p className="text-center text-4xl font-bold mt-2">
                    {result.status}
                  </p>

                  {/* {colorData && (
                    <div className="mt-5 bg-white rounded-2xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 text-center">
                        色解析
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>黄色</span>
                            <span>
                              {colorData.yellow}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                            <div
                              className="bg-yellow-400 h-full rounded-full"
                              style={{
                                width: `${colorData.yellow}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>緑</span>
                            <span>
                              {colorData.green}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                            <div
                              className="bg-green-500 h-full rounded-full"
                              style={{
                                width: `${colorData.green}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>黒</span>
                            <span>
                              {colorData.black}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                            <div
                              className="bg-black h-full rounded-full"
                              style={{
                                width: `${colorData.black}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* 熟度 */}
                  <div className="mt-6">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        熟度
                      </span>

                      <span className="font-bold">
                        {result.score}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full transition-all duration-700"
                        style={{
                          width: `${result.score}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 保存目安 */}
                  <div className="mt-5 bg-white rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-sm text-gray-500">
                      保存目安
                    </p>

                    <p className="text-2xl font-bold mt-1">
                      {result.daysLeft}
                    </p>
                  </div>

                  {/* 保存方法 */}
                  <div className="mt-5 bg-white rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 text-center">
                      保存アドバイス
                    </p>

                    <div className="mt-4 space-y-3">
                      {result.storageAdvice.map(
                        (advice: string) => (
                          <div
                            key={advice}
                            className="bg-yellow-50 rounded-xl px-4 py-3 text-sm text-gray-700"
                          >
                            {advice}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* コメント */}
                  <div className="mt-5 bg-white rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 text-center">
                      コメント
                    </p>

                    <p className="text-center mt-2 leading-relaxed text-gray-700">
                      {result.comment}
                    </p>
                  </div>

                  {/* 用途 */}
                  <div className="mt-5 bg-white rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 text-center">
                      おすすめ用途
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {result.bestUse.map(
                        (use: string) => (
                          <span
                            key={use}
                            className="bg-yellow-200 px-4 py-2 rounded-full text-sm font-bold"
                          >
                            {use}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* レシピ生成 */}
                  <div className="mt-5 bg-white rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 text-center">
                      レシピ生成
                    </p>

                    <p className="text-sm text-gray-500 text-center mt-1">
                      家にある材料を入力できます
                    </p>

                    <div className="flex flex-col gap-3 mt-4">
                      <input
                        type="text"
                        value={ingredients}
                        onChange={(e) =>
                          setIngredients(
                            e.target.value
                          )
                        }
                        placeholder="例：牛乳、ヨーグルト、卵"
                        className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />

                      <button
                        onClick={generateRecipes}
                        disabled={recipeLoading}
                        className="bg-yellow-400 hover:bg-yellow-500 transition text-white font-bold py-3 rounded-2xl disabled:opacity-50"
                      >
                        {recipeLoading
                          ? "生成中..."
                          : "レシピを見る"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* レシピ */}
          {recipes.length > 0 && (
            <div className="mt-12">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold">
                  🍽 おすすめレシピ
                </h2>

                <p className="text-gray-500 mt-2">
                  この熟し具合にぴったりのレシピ
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {recipes.map((recipe: any) => (
                  <div
                    key={recipe.name}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-yellow-100 h-full"
                  >
                    {/* 画像
                    <img
                      src={`https://picsum.photos/seed/${encodeURIComponent(
                        recipe.name
                      )}/600/400`}
                      alt={recipe.name}
                      className="w-full h-48 object-cover rounded-2xl mb-4"
                    /> */}

                    {/* タイトル */}
                    <div>
                      <p className="text-2xl font-bold">
                        🍌 {recipe.name}
                      </p>

                      <p className="text-gray-600 mt-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>

                    {/* 材料 */}
                    <div className="mt-5">
                      <p className="font-bold text-sm text-gray-500 uppercase tracking-wide">
                        材料
                      </p>

                      <ul className="mt-3 space-y-2">
                        {recipe.ingredients.map(
                          (
                            ingredient: string
                          ) => (
                            <li
                              key={ingredient}
                              className="bg-yellow-50 rounded-xl px-3 py-2 text-sm"
                            >
                              {ingredient}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {/* 作り方 */}
                    <div className="mt-5">
                      <p className="font-bold text-sm text-gray-500 uppercase tracking-wide">
                        作り方
                      </p>

                      <ol className="mt-3 space-y-3">
                        {recipe.steps.map(
                          (step: string) => (
                            <li
                              key={step}
                              className="flex gap-3"
                            >
                              <div className="min-w-7 h-7 rounded-full bg-yellow-400 text-white flex items-center justify-center text-sm font-bold">
                                ✓
                              </div>

                              <p className="text-sm leading-relaxed text-gray-700">
                                {step}
                              </p>
                            </li>
                          )
                        )}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}