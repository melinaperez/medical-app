import { NextResponse } from "next/server";

interface ScoreResult {
  harms2afScore: number;
  mtaiwanScore: number;
  heartsScore: number;
  heartsRiskLevel: string;
  heartsRiskColor: string;
}

interface Range {
  min?: number;
  max?: number;
}

// Define region types
type Region = "southern" | "andean" | "central";

// Define country to region mapping
const COUNTRY_REGIONS: Record<string, Region> = {
  AR: "southern",
  CL: "southern",
  EC: "andean",
  PE: "andean",
  CO: "central",
  MX: "central",
};

// Define risk matrix type
type RiskMatrix = {
  male: number[][][][];
  female: number[][][][];
};

// Define matrices for each region
const RISK_MATRICES: Record<Region, RiskMatrix> = {
  southern: {
    male: [
      // 40-44
      [
        [
          [2, 2, 2, 3, 3],
          [2, 2, 3, 4, 4],
          [3, 3, 4, 5, 6],
          [4, 5, 5, 6, 8],
          [5, 6, 7, 8, 10],
        ],
        [
          [3, 4, 4, 5, 6],
          [4, 5, 6, 7, 8],
          [5, 6, 8, 9, 11],
          [7, 9, 10, 12, 14],
          [10, 11, 13, 16, 19],
        ],
      ],
      // 45-49
      [
        [
          [2, 3, 3, 4, 4],
          [3, 3, 4, 5, 6],
          [4, 4, 5, 6, 7],
          [5, 6, 7, 8, 10],
          [7, 8, 9, 11, 12],
        ],
        [
          [4, 5, 5, 6, 8],
          [5, 6, 7, 8, 10],
          [7, 8, 9, 11, 13],
          [9, 10, 12, 14, 17],
          [12, 14, 16, 18, 22],
        ],
      ],
      // 50-54
      [
        [
          [3, 4, 4, 5, 6],
          [4, 5, 5, 6, 7],
          [5, 6, 7, 8, 9],
          [7, 8, 9, 10, 12],
          [9, 10, 12, 13, 15],
        ],
        [
          [5, 6, 7, 8, 10],
          [7, 8, 9, 10, 12],
          [9, 10, 11, 13, 16],
          [11, 13, 15, 17, 20],
          [14, 16, 19, 22, 25],
        ],
      ],
      // 55-59
      [
        [
          [4, 5, 6, 6, 8],
          [5, 6, 7, 8, 10],
          [7, 8, 9, 10, 12],
          [9, 10, 12, 13, 15],
          [12, 13, 15, 17, 19],
        ],
        [
          [7, 8, 9, 10, 12],
          [8, 10, 11, 13, 15],
          [11, 12, 14, 16, 19],
          [14, 16, 18, 20, 23],
          [17, 20, 22, 25, 28],
        ],
      ],
      // 60-64
      [
        [
          [6, 7, 8, 9, 10],
          [8, 8, 10, 11, 12],
          [9, 11, 12, 13, 15],
          [12, 13, 15, 17, 19],
          [15, 16, 18, 21, 23],
        ],
        [
          [9, 10, 11, 13, 15],
          [11, 12, 14, 16, 18],
          [14, 15, 17, 19, 22],
          [17, 19, 21, 24, 27],
          [21, 23, 26, 29, 32],
        ],
      ],
      // 65-69
      [
        [
          [8, 9, 10, 12, 13],
          [10, 11, 13, 14, 16],
          [13, 14, 16, 17, 19],
          [15, 17, 19, 21, 23],
          [19, 21, 23, 25, 28],
        ],
        [
          [11, 13, 14, 16, 18],
          [14, 15, 17, 19, 22],
          [17, 19, 21, 23, 26],
          [21, 23, 25, 28, 31],
          [25, 27, 30, 33, 37],
        ],
      ],
      // 70-74
      [
        [
          [12, 13, 14, 16, 17],
          [14, 15, 17, 19, 21],
          [17, 18, 20, 22, 24],
          [20, 22, 24, 26, 29],
          [24, 26, 29, 31, 34],
        ],
        [
          [15, 16, 18, 20, 22],
          [18, 19, 21, 23, 26],
          [21, 23, 25, 28, 30],
          [25, 27, 30, 33, 36],
          [30, 32, 35, 38, 42],
        ],
      ],
    ],
    female: [
      // 40-44
      [
        [
          [0, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 3, 3, 3, 4],
        ],
        [
          [1, 2, 2, 2, 3],
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 5, 5, 6, 8],
          [6, 7, 8, 9, 11],
        ],
      ],
      // 45-49
      [
        [
          [1, 1, 1, 1, 1],
          [1, 1, 1, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 3, 3, 3],
          [3, 3, 4, 4, 5],
        ],
        [
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
          [5, 6, 7, 8, 9],
          [7, 8, 10, 11, 13],
        ],
      ],
      // 50-54
      [
        [
          [1, 1, 1, 2, 2],
          [2, 2, 2, 2, 3],
          [2, 2, 3, 3, 3],
          [3, 3, 4, 4, 5],
          [4, 5, 5, 6, 6],
        ],
        [
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 6],
          [5, 6, 7, 7, 9],
          [7, 8, 9, 10, 12],
          [9, 11, 12, 14, 16],
        ],
      ],
      // 55-59
      [
        [
          [2, 2, 2, 2, 3],
          [2, 3, 3, 3, 4],
          [3, 4, 4, 4, 5],
          [4, 5, 5, 6, 7],
          [6, 6, 7, 8, 9],
        ],
        [
          [4, 4, 5, 5, 6],
          [5, 6, 6, 7, 8],
          [7, 8, 9, 10, 11],
          [9, 10, 11, 13, 14],
          [12, 13, 15, 17, 19],
        ],
      ],
      // 60-64
      [
        [
          [3, 3, 3, 4, 4],
          [4, 4, 4, 5, 5],
          [5, 5, 6, 6, 7],
          [6, 7, 7, 8, 9],
          [8, 9, 10, 11, 12],
        ],
        [
          [5, 6, 7, 7, 8],
          [7, 8, 9, 10, 11],
          [9, 10, 11, 12, 14],
          [12, 13, 14, 16, 18],
          [15, 17, 19, 21, 23],
        ],
      ],
      // 65-69
      [
        [
          [4, 5, 5, 6, 6],
          [6, 6, 7, 7, 8],
          [7, 8, 8, 9, 10],
          [9, 10, 11, 11, 13],
          [12, 12, 13, 15, 16],
        ],
        [
          [8, 8, 9, 10, 11],
          [10, 11, 11, 13, 14],
          [12, 13, 15, 16, 17],
          [16, 17, 18, 20, 22],
          [20, 21, 23, 25, 27],
        ],
      ],
      // 70-74
      [
        [
          [7, 7, 8, 8, 9],
          [9, 9, 10, 10, 11],
          [11, 11, 12, 13, 14],
          [13, 14, 15, 16, 17],
          [16, 17, 19, 20, 21],
        ],
        [
          [11, 11, 12, 13, 14],
          [13, 14, 15, 16, 18],
          [16, 18, 19, 20, 22],
          [20, 22, 23, 25, 27],
          [25, 26, 28, 30, 33],
        ],
      ],
    ],
  },
  andean: {
    male: [
      // 40-44
      [
        [
          [1, 1, 1, 2, 2],
          [1, 2, 2, 2, 3],
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 6],
        ],
        [
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
          [5, 6, 7, 8, 9],
          [7, 8, 9, 10, 12],
        ],
      ],
      // 45-49
      [
        [
          [1, 2, 2, 2, 3],
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 5],
          [4, 4, 5, 5, 6],
          [5, 5, 6, 7, 8],
        ],
        [
          [3, 3, 3, 4, 5],
          [3, 4, 5, 5, 6],
          [5, 5, 6, 7, 8],
          [6, 7, 8, 9, 11],
          [8, 9, 11, 12, 14],
        ],
      ],
      // 50-54
      [
        [
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 5],
          [4, 4, 5, 5, 6],
          [5, 5, 6, 7, 8],
          [6, 7, 8, 9, 10],
        ],
        [
          [3, 4, 4, 5, 6],
          [4, 5, 6, 7, 8],
          [6, 6, 7, 9, 10],
          [8, 8, 10, 11, 13],
          [10, 11, 13, 14, 17],
        ],
      ],
      // 55-59
      [
        [
          [3, 3, 4, 4, 5],
          [4, 4, 5, 5, 6],
          [5, 5, 6, 7, 8],
          [6, 7, 8, 9, 10],
          [8, 9, 10, 11, 13],
        ],
        [
          [4, 5, 6, 6, 7],
          [6, 6, 7, 8, 10],
          [7, 8, 9, 11, 12],
          [9, 10, 12, 13, 15],
          [12, 13, 15, 17, 19],
        ],
      ],
      // 60-64
      [
        [
          [4, 4, 5, 6, 6],
          [5, 6, 6, 7, 8],
          [6, 7, 8, 9, 10],
          [8, 9, 10, 11, 13],
          [10, 11, 12, 14, 16],
        ],
        [
          [6, 6, 7, 8, 9],
          [7, 8, 9, 10, 12],
          [9, 10, 11, 13, 15],
          [11, 13, 14, 16, 18],
          [14, 16, 18, 20, 23],
        ],
      ],
      // 65-69
      [
        [
          [6, 6, 7, 8, 8],
          [7, 8, 8, 9, 10],
          [8, 9, 10, 12, 13],
          [10, 12, 13, 14, 16],
          [13, 14, 16, 17, 19],
        ],
        [
          [7, 8, 9, 10, 12],
          [9, 10, 11, 13, 14],
          [11, 13, 14, 16, 18],
          [14, 15, 17, 19, 21],
          [17, 19, 21, 23, 26],
        ],
      ],
      // 70-74
      [
        [
          [8, 8, 9, 10, 11],
          [9, 10, 11, 12, 14],
          [11, 12, 14, 15, 17],
          [14, 15, 16, 18, 20],
          [16, 18, 20, 22, 24],
        ],
        [
          [10, 11, 12, 13, 15],
          [12, 13, 14, 16, 18],
          [14, 16, 17, 19, 21],
          [17, 19, 21, 23, 25],
          [21, 23, 25, 27, 30],
        ],
      ],
    ],
    female: [
      // 40-44
      [
        [
          [1, 1, 1, 1, 1],
          [1, 1, 1, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 3, 3],
          [3, 3, 3, 4, 4],
        ],
        [
          [2, 2, 2, 3, 3],
          [3, 3, 3, 4, 4],
          [3, 4, 4, 5, 5],
          [4, 5, 5, 6, 7],
          [6, 6, 7, 8, 9],
        ],
      ],
      // 45-49
      [
        [
          [1, 1, 1, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 2, 3, 3],
          [3, 3, 3, 4, 4],
          [4, 4, 4, 5, 5],
        ],
        [
          [3, 3, 3, 3, 4],
          [3, 4, 4, 4, 5],
          [4, 5, 5, 6, 6],
          [5, 6, 7, 7, 8],
          [7, 8, 8, 9, 10],
        ],
      ],
      // 50-54
      [
        [
          [2, 2, 2, 2, 2],
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 4],
          [4, 4, 4, 5, 5],
          [5, 5, 5, 6, 6],
        ],
        [
          [3, 4, 4, 4, 5],
          [4, 5, 5, 5, 6],
          [5, 6, 6, 7, 8],
          [7, 7, 8, 9, 10],
          [8, 9, 10, 11, 12],
        ],
      ],
      // 55-59
      [
        [
          [2, 3, 3, 3, 3],
          [3, 3, 3, 4, 4],
          [4, 4, 4, 5, 5],
          [5, 5, 5, 6, 6],
          [6, 6, 7, 7, 8],
        ],
        [
          [4, 5, 5, 5, 6],
          [5, 6, 6, 7, 7],
          [7, 7, 8, 8, 9],
          [8, 9, 9, 10, 11],
          [10, 11, 12, 13, 14],
        ],
      ],
      // 60-64
      [
        [
          [3, 4, 4, 4, 4],
          [4, 4, 5, 5, 5],
          [5, 5, 6, 6, 7],
          [6, 7, 7, 7, 8],
          [7, 8, 8, 9, 10],
        ],
        [
          [5, 6, 6, 7, 7],
          [7, 7, 8, 8, 9],
          [8, 9, 9, 10, 11],
          [10, 11, 11, 12, 13],
          [12, 13, 14, 15, 16],
        ],
      ],
      // 65-69
      [
        [
          [5, 5, 5, 6, 6],
          [6, 6, 6, 7, 7],
          [7, 7, 8, 8, 8],
          [8, 9, 9, 10, 10],
          [10, 10, 11, 11, 12],
        ],
        [
          [7, 7, 8, 8, 9],
          [8, 9, 9, 10, 11],
          [10, 11, 11, 12, 13],
          [12, 13, 13, 14, 15],
          [14, 15, 16, 17, 18],
        ],
      ],
      // 70-74
      [
        [
          [7, 7, 7, 7, 8],
          [8, 8, 8, 9, 9],
          [9, 9, 10, 10, 11],
          [11, 11, 12, 12, 13],
          [12, 13, 14, 14, 15],
        ],
        [
          [9, 9, 10, 10, 11],
          [11, 11, 12, 12, 13],
          [12, 13, 14, 14, 15],
          [15, 15, 16, 17, 18],
          [17, 18, 19, 20, 21],
        ],
      ],
    ],
  },
  central: {
    male: [
      // 40-44
      [
        [
          [1, 1, 1, 2, 2],
          [1, 2, 2, 2, 3],
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
        ],
        [
          [2, 2, 3, 3, 4],
          [3, 3, 4, 5, 6],
          [4, 4, 5, 6, 8],
          [5, 6, 7, 9, 10],
          [7, 8, 10, 12, 14],
        ],
      ],
      // 45-49
      [
        [
          [1, 2, 2, 2, 3],
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
          [5, 6, 7, 8, 9],
        ],
        [
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
          [5, 6, 7, 8, 9],
          [6, 7, 9, 10, 12],
          [9, 10, 12, 14, 17],
        ],
      ],
      // 50-54
      [
        [
          [2, 2, 3, 3, 4],
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
          [5, 6, 6, 7, 9],
          [7, 7, 8, 10, 11],
        ],
        [
          [3, 4, 5, 6, 7],
          [5, 5, 6, 7, 9],
          [6, 7, 8, 10, 11],
          [8, 9, 11, 13, 15],
          [11, 12, 14, 16, 19],
        ],
      ],
      // 55-59
      [
        [
          [3, 3, 4, 4, 5],
          [4, 4, 5, 6, 7],
          [5, 6, 6, 7, 9],
          [6, 7, 8, 10, 11],
          [8, 9, 11, 12, 14],
        ],
        [
          [5, 5, 6, 7, 8],
          [6, 7, 8, 9, 11],
          [8, 9, 10, 12, 14],
          [10, 11, 13, 15, 18],
          [13, 15, 17, 19, 22],
        ],
      ],
      // 60-64
      [
        [
          [4, 5, 5, 6, 7],
          [5, 6, 7, 8, 9],
          [7, 8, 9, 10, 11],
          [9, 10, 11, 12, 14],
          [11, 12, 14, 16, 18],
        ],
        [
          [6, 7, 8, 9, 11],
          [8, 9, 10, 12, 13],
          [10, 11, 13, 15, 17],
          [13, 14, 16, 18, 21],
          [16, 18, 20, 23, 26],
        ],
      ],
      // 65-69
      [
        [
          [6, 7, 7, 8, 9],
          [7, 8, 9, 10, 12],
          [9, 10, 11, 13, 15],
          [11, 13, 14, 16, 18],
          [14, 16, 18, 20, 22],
        ],
        [
          [8, 9, 10, 12, 13],
          [10, 11, 13, 14, 16],
          [13, 14, 16, 18, 20],
          [16, 17, 19, 22, 25],
          [19, 21, 24, 27, 30],
        ],
      ],
      // 70-74
      [
        [
          [8, 9, 10, 11, 13],
          [10, 11, 12, 14, 16],
          [12, 14, 15, 17, 19],
          [15, 17, 18, 21, 23],
          [18, 20, 22, 25, 27],
        ],
        [
          [11, 12, 13, 15, 17],
          [13, 14, 16, 18, 20],
          [16, 18, 20, 22, 24],
          [19, 21, 24, 26, 29],
          [23, 26, 28, 31, 35],
        ],
      ],
    ],
    female: [
      // 40-44
      [
        [
          [1, 1, 1, 1, 1],
          [1, 1, 1, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 4],
        ],
        [
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 5],
          [4, 4, 5, 5, 6],
          [5, 5, 6, 7, 8],
          [6, 7, 8, 9, 10],
        ],
      ],
      // 45-49
      [
        [
          [1, 1, 2, 2, 2],
          [2, 2, 2, 2, 2],
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 4],
          [4, 4, 4, 5, 5],
        ],
        [
          [3, 3, 3, 4, 4],
          [3, 4, 4, 5, 6],
          [5, 5, 6, 6, 7],
          [6, 7, 7, 8, 9],
          [8, 8, 9, 11, 12],
        ],
      ],
      // 50-54
      [
        [
          [2, 2, 2, 2, 3],
          [2, 2, 3, 3, 3],
          [3, 3, 3, 4, 4],
          [4, 4, 4, 5, 5],
          [5, 5, 6, 6, 7],
        ],
        [
          [4, 4, 4, 5, 5],
          [4, 5, 5, 6, 7],
          [6, 6, 7, 8, 9],
          [7, 8, 9, 10, 11],
          [9, 10, 11, 12, 14],
        ],
      ],
      // 55-59
      [
        [
          [3, 3, 3, 3, 4],
          [3, 3, 4, 4, 4],
          [4, 4, 5, 5, 6],
          [5, 5, 6, 6, 7],
          [6, 7, 7, 8, 9],
        ],
        [
          [5, 5, 6, 6, 7],
          [6, 6, 7, 8, 8],
          [7, 8, 9, 10, 10],
          [9, 10, 11, 12, 13],
          [11, 12, 13, 15, 16],
        ],
      ],
      // 60-64
      [
        [
          [4, 4, 4, 4, 5],
          [4, 5, 5, 6, 6],
          [5, 6, 6, 7, 7],
          [7, 7, 8, 8, 9],
          [8, 9, 10, 10, 11],
        ],
        [
          [6, 7, 7, 8, 8],
          [7, 8, 9, 9, 10],
          [9, 10, 11, 12, 13],
          [11, 12, 13, 14, 15],
          [14, 15, 16, 17, 19],
        ],
      ],
      // 65-69
      [
        [
          [5, 5, 6, 6, 7],
          [6, 7, 7, 7, 8],
          [7, 8, 8, 9, 10],
          [9, 10, 10, 11, 12],
          [11, 12, 12, 13, 14],
        ],
        [
          [8, 8, 9, 10, 10],
          [10, 10, 11, 12, 13],
          [12, 12, 13, 14, 15],
          [14, 15, 16, 17, 18],
          [17, 18, 19, 20, 22],
        ],
      ],
      // 70-74
      [
        [
          [7, 8, 8, 8, 9],
          [9, 9, 10, 10, 11],
          [10, 11, 11, 12, 13],
          [12, 13, 13, 14, 15],
          [14, 15, 16, 17, 18],
        ],
        [
          [10, 11, 11, 12, 13],
          [12, 13, 14, 14, 15],
          [14, 15, 16, 17, 18],
          [17, 18, 19, 20, 21],
          [20, 21, 22, 24, 25],
        ],
      ],
    ],
  },
};

function convertMgDlToMmolL(mgDl: number): number {
  return mgDl * 0.0259;
}

function calculateHeartsScore(
  edad: number,
  genero: string,
  presionSistolica: number,
  colesterolTotal: number,
  tabaquismo: string,
  enfermedadCoronaria: string,
  enfermedadCerebrovascular: string,
  enfermedadVascular: string,
  enfermedadRenal: string,
  diabetesMellitus: string,
  pais: string
): { score: number; riskLevel: string; color: string } {
  // Check immediate high-risk conditions first
  if (
    enfermedadCoronaria === "S" ||
    enfermedadCerebrovascular === "S" ||
    enfermedadVascular === "S"
  ) {
    return {
      score: 25,
      riskLevel: "Muy alto",
      color: "bg-red-600",
    };
  }

  if (enfermedadRenal === "S" || diabetesMellitus === "S") {
    return {
      score: 15,
      riskLevel: "Alto",
      color: "bg-orange-500",
    };
  }

  // Get the region for the country
  const region = COUNTRY_REGIONS[pais];
  if (!region) {
    throw new Error("País no soportado");
  }

  // Get the risk matrix for the region
  const riskMatrix = RISK_MATRICES[region];

  // Convert cholesterol to mmol/L for the calculation
  const colesterolMmolL = convertMgDlToMmolL(colesterolTotal);

  // Age ranges and their corresponding matrix rows
  const ageRanges = [
    { min: 40, max: 44 },
    { min: 45, max: 49 },
    { min: 50, max: 54 },
    { min: 55, max: 59 },
    { min: 60, max: 64 },
    { min: 65, max: 69 },
    { min: 70, max: 100 },
  ];

  // Find the age group index
  const ageGroupIndex = ageRanges.findIndex(
    (range) => edad >= range.min && edad <= range.max
  );
  if (ageGroupIndex === -1) {
    // Age out of range, return maximum risk
    return {
      score: 30,
      riskLevel: "Crítico",
      color: "bg-red-900",
    };
  }

  // Define SBP ranges
  const sbpRanges: Range[] = [
    { max: 120 },
    { min: 120, max: 139 },
    { min: 140, max: 159 },
    { min: 160, max: 179 },
    { min: 180 },
  ];

  // Find SBP range index
  const sbpIndex = sbpRanges.findIndex((range) => {
    if (!range.min && range.max) return presionSistolica < range.max;
    if (range.min && !range.max) return presionSistolica >= range.min;
    if (range.min && range.max)
      return presionSistolica >= range.min && presionSistolica <= range.max;
    return false;
  });

  // Define cholesterol ranges
  const cholRanges: Range[] = [
    { max: 4 },
    { min: 4, max: 4.9 },
    { min: 5, max: 5.9 },
    { min: 6, max: 6.9 },
    { min: 7 },
  ];

  // Find cholesterol range index
  const cholIndex = cholRanges.findIndex((range) => {
    if (!range.min && range.max) return colesterolMmolL < range.max;
    if (range.min && !range.max) return colesterolMmolL >= range.min;
    if (range.min && range.max)
      return colesterolMmolL >= range.min && colesterolMmolL <= range.max;
    return false;
  });

  // Get risk percentage from matrix
  const isSmoker = tabaquismo === "S";
  const baseRisk =
    riskMatrix[genero === "M" ? "male" : "female"][ageGroupIndex][
      isSmoker ? 1 : 0
    ][sbpIndex][cholIndex];

  // Determine risk level and color based on percentage
  let riskLevel: string;
  let color: string;

  if (baseRisk < 5) {
    riskLevel = "Bajo";
    color = "bg-green-500";
  } else if (baseRisk < 10) {
    riskLevel = "Moderado";
    color = "bg-yellow-500";
  } else if (baseRisk < 20) {
    riskLevel = "Alto";
    color = "bg-orange-500";
  } else if (baseRisk < 30) {
    riskLevel = "Muy alto";
    color = "bg-red-600";
  } else {
    riskLevel = "Crítico";
    color = "bg-red-900";
  }

  return {
    score: baseRisk,
    riskLevel,
    color,
  };
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Extract values including país
    const {
      edad,
      genero,
      presionSistolica,
      colesterolTotal,
      hipertensionArterial,
      tabaquismo,
      imc,
      apneaSueno,
      usoAlcohol,
      insuficienciaCardiaca,
      enfermedadCoronaria,
      enfermedadRenal,
      enfermedadCerebrovascular,
      enfermedadVascular,
      diabetesMellitus,
      pais, // Add país to the destructuring
    } = data;

    // Calcular HARMS2-AF Score
    let harms2afScore = 0;

    // Hipertensión Arterial (4 puntos)
    if (hipertensionArterial === "S") {
      harms2afScore += 4;
    }

    // Edad
    const edadNum = Number(edad);
    if (edadNum >= 65) {
      harms2afScore += 2;
    } else if (edadNum >= 60) {
      harms2afScore += 1;
    }

    // IMC ≥30
    if (imc === "S") {
      harms2afScore += 1;
    }

    // Género Masculino
    if (genero === "M") {
      harms2afScore += 1;
    }

    // Apnea del Sueño
    if (apneaSueno === "S") {
      harms2afScore += 1;
    }

    // Tabaquismo
    if (tabaquismo === "S") {
      harms2afScore += 1;
    }

    // Uso de Alcohol
    if (usoAlcohol === "alto") {
      harms2afScore += 2;
    } else if (usoAlcohol === "moderado") {
      harms2afScore += 1;
    }

    // Calcular mTaiwan AF Score
    let mtaiwanScore = 0;

    // Edad
    if (edadNum >= 80) mtaiwanScore += 8;
    else if (edadNum >= 75) mtaiwanScore += 5;
    else if (edadNum >= 70) mtaiwanScore += 4;
    else if (edadNum >= 65) mtaiwanScore += 3;
    else if (edadNum >= 60) mtaiwanScore += 2;
    else if (edadNum >= 55) mtaiwanScore += 1;
    else if (edadNum >= 50) mtaiwanScore += 0;
    else if (edadNum >= 45) mtaiwanScore -= 1;
    else if (edadNum >= 40) mtaiwanScore -= 2;

    // Género Masculino
    if (genero === "M") {
      mtaiwanScore += 1;
    }

    // Hipertensión
    if (hipertensionArterial === "S") {
      mtaiwanScore += 1;
    }

    // Insuficiencia Cardíaca
    if (insuficienciaCardiaca === "S") {
      mtaiwanScore += 2;
    }

    // Enfermedad Coronaria
    if (enfermedadCoronaria === "S") {
      mtaiwanScore += 1;
    }

    // Enfermedad Renal
    if (enfermedadRenal === "S") {
      mtaiwanScore += 1;
    }

    // Calculate HEARTS score with país
    const heartsResult = calculateHeartsScore(
      edadNum,
      genero,
      presionSistolica,
      colesterolTotal,
      tabaquismo,
      enfermedadCoronaria,
      enfermedadCerebrovascular,
      enfermedadVascular,
      enfermedadRenal,
      diabetesMellitus,
      pais // Pass país to the function
    );

    return NextResponse.json({
      harms2afScore,
      mtaiwanScore,
      heartsScore: heartsResult.score,
      heartsRiskLevel: heartsResult.riskLevel,
      heartsRiskColor: heartsResult.color,
    });
  } catch (error) {
    console.error("Error calculating scores:", error);
    return NextResponse.json(
      { error: "Error al calcular los scores" },
      { status: 500 }
    );
  }
}
