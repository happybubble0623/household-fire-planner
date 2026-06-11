export type HistoricalMonthlyReturn = {
  monthIndex: number;
  month: string;
  stockReturn: number;
  bondEquivalentReturn: number;
  cashReturn: number;
  inflation: number;
};

export const historicalMonthlyReturns: HistoricalMonthlyReturn[] = [
  { monthIndex: 0, month: "2008-01", stockReturn: -0.0604, bondEquivalentReturn: 0.012, cashReturn: 0.002, inflation: 0.004 },
  { monthIndex: 1, month: "2008-02", stockReturn: -0.0348, bondEquivalentReturn: 0.006, cashReturn: 0.002, inflation: 0.003 },
  { monthIndex: 2, month: "2008-03", stockReturn: -0.0087, bondEquivalentReturn: 0.011, cashReturn: 0.001, inflation: 0.009 },
  { monthIndex: 3, month: "2008-04", stockReturn: 0.0475, bondEquivalentReturn: -0.002, cashReturn: 0.001, inflation: 0.006 },
  { monthIndex: 4, month: "2008-05", stockReturn: 0.0129, bondEquivalentReturn: -0.006, cashReturn: 0.001, inflation: 0.008 },
  { monthIndex: 5, month: "2008-06", stockReturn: -0.0843, bondEquivalentReturn: 0.002, cashReturn: 0.001, inflation: 0.011 },
  { monthIndex: 6, month: "2008-07", stockReturn: -0.0099, bondEquivalentReturn: 0.013, cashReturn: 0.001, inflation: 0.005 },
  { monthIndex: 7, month: "2008-08", stockReturn: 0.0145, bondEquivalentReturn: 0.005, cashReturn: 0.001, inflation: -0.001 },
  { monthIndex: 8, month: "2008-09", stockReturn: -0.0908, bondEquivalentReturn: 0.006, cashReturn: 0.001, inflation: 0.000 },
  { monthIndex: 9, month: "2008-10", stockReturn: -0.1694, bondEquivalentReturn: -0.012, cashReturn: 0.001, inflation: -0.010 },
  { monthIndex: 10, month: "2008-11", stockReturn: -0.0748, bondEquivalentReturn: 0.034, cashReturn: 0.001, inflation: -0.019 },
  { monthIndex: 11, month: "2008-12", stockReturn: 0.0106, bondEquivalentReturn: 0.022, cashReturn: 0.001, inflation: -0.008 },
  { monthIndex: 12, month: "2013-01", stockReturn: 0.0504, bondEquivalentReturn: -0.002, cashReturn: 0.000, inflation: 0.003 },
  { monthIndex: 13, month: "2013-02", stockReturn: 0.0127, bondEquivalentReturn: 0.005, cashReturn: 0.000, inflation: 0.007 },
  { monthIndex: 14, month: "2013-03", stockReturn: 0.0375, bondEquivalentReturn: 0.001, cashReturn: 0.000, inflation: 0.003 },
  { monthIndex: 15, month: "2013-04", stockReturn: 0.0193, bondEquivalentReturn: 0.011, cashReturn: 0.000, inflation: -0.002 },
  { monthIndex: 16, month: "2013-05", stockReturn: 0.0234, bondEquivalentReturn: -0.019, cashReturn: 0.000, inflation: 0.001 },
  { monthIndex: 17, month: "2013-06", stockReturn: -0.0140, bondEquivalentReturn: -0.016, cashReturn: 0.000, inflation: 0.005 },
  { monthIndex: 18, month: "2013-07", stockReturn: 0.0509, bondEquivalentReturn: 0.002, cashReturn: 0.000, inflation: 0.002 },
  { monthIndex: 19, month: "2013-08", stockReturn: -0.0290, bondEquivalentReturn: -0.008, cashReturn: 0.000, inflation: 0.001 },
  { monthIndex: 20, month: "2013-09", stockReturn: 0.0297, bondEquivalentReturn: 0.006, cashReturn: 0.000, inflation: 0.001 },
  { monthIndex: 21, month: "2013-10", stockReturn: 0.0459, bondEquivalentReturn: 0.001, cashReturn: 0.000, inflation: -0.001 },
  { monthIndex: 22, month: "2013-11", stockReturn: 0.0305, bondEquivalentReturn: -0.003, cashReturn: 0.000, inflation: 0.000 },
  { monthIndex: 23, month: "2013-12", stockReturn: 0.0250, bondEquivalentReturn: -0.006, cashReturn: 0.000, inflation: 0.003 },
  { monthIndex: 24, month: "2020-01", stockReturn: -0.0016, bondEquivalentReturn: 0.019, cashReturn: 0.001, inflation: 0.002 },
  { monthIndex: 25, month: "2020-02", stockReturn: -0.0841, bondEquivalentReturn: 0.026, cashReturn: 0.001, inflation: 0.003 },
  { monthIndex: 26, month: "2020-03", stockReturn: -0.1249, bondEquivalentReturn: 0.001, cashReturn: 0.001, inflation: -0.004 },
  { monthIndex: 27, month: "2020-04", stockReturn: 0.1268, bondEquivalentReturn: 0.014, cashReturn: 0.000, inflation: -0.008 },
  { monthIndex: 28, month: "2020-05", stockReturn: 0.0453, bondEquivalentReturn: 0.005, cashReturn: 0.000, inflation: 0.000 },
  { monthIndex: 29, month: "2020-06", stockReturn: 0.0184, bondEquivalentReturn: 0.006, cashReturn: 0.000, inflation: 0.006 },
  { monthIndex: 30, month: "2020-07", stockReturn: 0.0551, bondEquivalentReturn: 0.004, cashReturn: 0.000, inflation: 0.005 },
  { monthIndex: 31, month: "2020-08", stockReturn: 0.0701, bondEquivalentReturn: -0.008, cashReturn: 0.000, inflation: 0.003 },
  { monthIndex: 32, month: "2020-09", stockReturn: -0.0392, bondEquivalentReturn: 0.002, cashReturn: 0.000, inflation: 0.001 },
  { monthIndex: 33, month: "2020-10", stockReturn: -0.0277, bondEquivalentReturn: -0.003, cashReturn: 0.000, inflation: 0.000 },
  { monthIndex: 34, month: "2020-11", stockReturn: 0.1075, bondEquivalentReturn: 0.010, cashReturn: 0.000, inflation: 0.001 },
  { monthIndex: 35, month: "2020-12", stockReturn: 0.0371, bondEquivalentReturn: 0.001, cashReturn: 0.000, inflation: 0.001 }
];
