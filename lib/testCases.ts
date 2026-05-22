export const testCases = [
  // 🟢 未熟
  { name: "green_1", image: "/test/green1.jpg", expectedStatus: "未熟" },
  { name: "green_2", image: "/test/green2.jpg", expectedStatus: "未熟" },
  { name: "green_3", image: "/test/green3.jpg", expectedStatus: "未熟" },
  { name: "green_4", image: "/test/green4.jpg", expectedStatus: "未熟" },

  // 🟡 食べ頃
  { name: "yellow_1", image: "/test/yellow1.jpg", expectedStatus: "食べ頃" },
  { name: "yellow_2", image: "/test/yellow2.jpg", expectedStatus: "食べ頃" },
  { name: "yellow_3", image: "/test/yellow3.jpg", expectedStatus: "食べ頃" },
  { name: "yellow_4", image: "/test/yellow4.jpg", expectedStatus: "食べ頃" },

  // ⚫ 熟しすぎ
  { name: "black_1", image: "/test/black1.jpg", expectedStatus: "熟しすぎ" },
  { name: "black_2", image: "/test/black2.jpg", expectedStatus: "熟しすぎ" },
  { name: "black_3", image: "/test/black3.jpg", expectedStatus: "熟しすぎ" },
  { name: "black_4", image: "/test/black4.jpg", expectedStatus: "熟しすぎ" },
];