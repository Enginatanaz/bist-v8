import { OHLCV, BacktestParams, BacktestResult, BacktestTrade } from '../types.js';
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateParabolicSAR
} from '../indicators/technicalEngine.js';

/**
 * Deterministic Strategy Backtesting Engine for Borsa İstanbul (BIST)
 * Enforces transaction costs (BIST commission + slippage), take-profit/stop-loss logic,
 * drawdown calculation, and trade accounting.
 */
export function runBacktest(ohlcv: OHLCV[], params: BacktestParams): BacktestResult {
  const {
    symbol,
    strategy,
    initialCapital = 100000,
    slippagePct = 0.1,    // 0.10% kayma
    commissionPct = 0.15,  // 0.15% aracı kurum + BIST tescil komisyonu
    takeProfitPct,
    stopLossPct
  } = params;

  if (!ohlcv || ohlcv.length < 50) {
    throw new Error('Backtest için en az 50 adet mum verisi gereklidir.');
  }

  const closes = ohlcv.map(b => b.close);
  const highs = ohlcv.map(b => b.high);
  const lows = ohlcv.map(b => b.low);

  // Pre-calculate indicators needed for each strategy (All EMA-based)
  const ema5 = calculateEMA(closes, 5);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const bb = calculateBollingerBands(closes, 20, 2);
  const psar = calculateParabolicSAR(highs, lows);

  let cash = initialCapital;
  let shares = 0;
  let entryPrice = 0;
  let entryDate = '';
  let entryBarIdx = 0;
  let inPosition = false;

  const trades: BacktestTrade[] = [];
  const equityCurve: { dateStr: string; portfolioValue: number; benchmarkValue: number }[] = [];

  const initialClose = closes[0];
  let totalCommissionsTL = 0;
  let totalSlippageTL = 0;

  // Track max capital for drawdown calculation
  let peakPortfolioValue = initialCapital;
  let maxDrawdownPct = 0;

  const slippageFactorBuy = 1 + (slippagePct / 100);
  const slippageFactorSell = 1 - (slippagePct / 100);
  const commissionRate = commissionPct / 100;

  for (let i = 1; i < ohlcv.length; i++) {
    const bar = ohlcv[i];
    const prevBar = ohlcv[i - 1];
    const currentClose = bar.close;
    const dateStr = bar.dateStr;

    // Check Take-Profit & Stop-Loss triggers if in position
    if (inPosition) {
      let exitReason: BacktestTrade['exitReason'] | null = null;
      let exitPriceRaw = currentClose;

      if (takeProfitPct && currentClose >= entryPrice * (1 + takeProfitPct / 100)) {
        exitReason = 'TAKE_PROFIT';
        exitPriceRaw = entryPrice * (1 + takeProfitPct / 100);
      } else if (stopLossPct && currentClose <= entryPrice * (1 - stopLossPct / 100)) {
        exitReason = 'STOP_LOSS';
        exitPriceRaw = entryPrice * (1 - stopLossPct / 100);
      }

      if (exitReason) {
        // Execute Exit
        const executionPrice = exitPriceRaw * slippageFactorSell;
        const grossValue = shares * executionPrice;
        const commission = grossValue * commissionRate;
        const slippageTL = shares * (exitPriceRaw - executionPrice);

        totalCommissionsTL += commission;
        totalSlippageTL += slippageTL;

        const netProceeds = grossValue - commission;
        const pnl = netProceeds - (shares * entryPrice);
        const returnPct = ((executionPrice - entryPrice) / entryPrice) * 100;

        cash += netProceeds;
        trades.push({
          id: `tr_${trades.length + 1}`,
          entryDate,
          entryPrice: Number(entryPrice.toFixed(2)),
          exitDate: dateStr,
          exitPrice: Number(executionPrice.toFixed(2)),
          side: 'LONG',
          shares,
          pnlTL: Number(pnl.toFixed(2)),
          returnPct: Number(returnPct.toFixed(2)),
          holdingDays: i - entryBarIdx,
          exitReason
        });

        shares = 0;
        inPosition = false;
      }
    }

    // Evaluate Strategy Buy/Sell Signals
    let buySignal = false;
    let sellSignal = false;

    if (strategy === 'EMA_CROSSOVER' || (strategy as string) === 'SMA_CROSSOVER') {
      const prevEma20 = ema20[i - 1];
      const curEma20 = ema20[i];
      const prevEma50 = ema50[i - 1];
      const curEma50 = ema50[i];

      if (prevEma20 !== null && curEma20 !== null && prevEma50 !== null && curEma50 !== null) {
        // Bullish Golden Cross (EMA20 crossed above EMA50)
        if (prevEma20 <= prevEma50 && curEma20 > curEma50) buySignal = true;
        // Bearish Death Cross (EMA20 crossed below EMA50)
        if (prevEma20 >= prevEma50 && curEma20 < curEma50) sellSignal = true;
      }
    } else if (strategy === 'RSI_REVERSAL') {
      const prevRsi = rsi[i - 1];
      const curRsi = rsi[i];

      if (prevRsi !== null && curRsi !== null) {
        // Crosses above 30 from oversold
        if (prevRsi <= 30 && curRsi > 30) buySignal = true;
        // Crosses above 70 into overbought
        if (curRsi >= 70) sellSignal = true;
      }
    } else if (strategy === 'MACD_CROSSOVER') {
      const prevHist = macd.histogram[i - 1];
      const curHist = macd.histogram[i];

      if (prevHist !== null && curHist !== null) {
        if (prevHist <= 0 && curHist > 0) buySignal = true;
        if (prevHist >= 0 && curHist < 0) sellSignal = true;
      }
    } else if (strategy === 'BOLLINGER_BREAKOUT') {
      const prevUpper = bb.upper[i - 1];
      const curUpper = bb.upper[i];
      const middle = bb.middle[i];

      if (prevUpper !== null && curUpper !== null && middle !== null) {
        if (prevBar.close <= prevUpper && currentClose > curUpper) buySignal = true;
        if (currentClose < middle) sellSignal = true;
      }
    } else if (strategy === 'SUPERTREND_MOMENTUM') {
      const curSar = psar[i];
      const prevSar = psar[i - 1];

      if (curSar !== null && prevSar !== null) {
        if (prevBar.close <= prevSar && currentClose > curSar) buySignal = true;
        if (prevBar.close >= prevSar && currentClose < curSar) sellSignal = true;
      }
    }

    // Execute Entry
    if (buySignal && !inPosition && cash > 1000) {
      const executionPrice = currentClose * slippageFactorBuy;
      const allocatableCash = cash * 0.98; // 2% buffer for fees
      const sharesToBuy = Math.floor(allocatableCash / executionPrice);

      if (sharesToBuy > 0) {
        const cost = sharesToBuy * executionPrice;
        const commission = cost * commissionRate;
        const slippageTL = sharesToBuy * (executionPrice - currentClose);

        totalCommissionsTL += commission;
        totalSlippageTL += slippageTL;

        cash -= (cost + commission);
        shares = sharesToBuy;
        entryPrice = executionPrice;
        entryDate = dateStr;
        entryBarIdx = i;
        inPosition = true;
      }
    }
    // Execute Exit on Signal
    else if (sellSignal && inPosition) {
      const executionPrice = currentClose * slippageFactorSell;
      const grossValue = shares * executionPrice;
      const commission = grossValue * commissionRate;
      const slippageTL = shares * (currentClose - executionPrice);

      totalCommissionsTL += commission;
      totalSlippageTL += slippageTL;

      const netProceeds = grossValue - commission;
      const pnl = netProceeds - (shares * entryPrice);
      const returnPct = ((executionPrice - entryPrice) / entryPrice) * 100;

      cash += netProceeds;
      trades.push({
        id: `tr_${trades.length + 1}`,
        entryDate,
        entryPrice: Number(entryPrice.toFixed(2)),
        exitDate: dateStr,
        exitPrice: Number(executionPrice.toFixed(2)),
        side: 'LONG',
        shares,
        pnlTL: Number(pnl.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2)),
        holdingDays: i - entryBarIdx,
        exitReason: 'SIGNAL_EXIT'
      });

      shares = 0;
      inPosition = false;
    }

    // Calculate current portfolio value for equity curve
    const currentPortfolioValue = inPosition ? cash + (shares * currentClose) : cash;
    if (currentPortfolioValue > peakPortfolioValue) {
      peakPortfolioValue = currentPortfolioValue;
    }
    const currentDrawdown = ((peakPortfolioValue - currentPortfolioValue) / peakPortfolioValue) * 100;
    if (currentDrawdown > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdown;
    }

    // Benchmark equity curve (Buy & Hold from initialClose)
    const benchmarkValue = initialCapital * (currentClose / initialClose);

    equityCurve.push({
      dateStr,
      portfolioValue: Number(currentPortfolioValue.toFixed(2)),
      benchmarkValue: Number(benchmarkValue.toFixed(2))
    });
  }

  // Close open position at end of backtest if still open
  if (inPosition) {
    const finalClose = closes[closes.length - 1];
    const executionPrice = finalClose * slippageFactorSell;
    const grossValue = shares * executionPrice;
    const commission = grossValue * commissionRate;

    totalCommissionsTL += commission;
    const netProceeds = grossValue - commission;
    const pnl = netProceeds - (shares * entryPrice);
    const returnPct = ((executionPrice - entryPrice) / entryPrice) * 100;

    cash += netProceeds;
    trades.push({
      id: `tr_${trades.length + 1}`,
      entryDate,
      entryPrice: Number(entryPrice.toFixed(2)),
      exitDate: ohlcv[ohlcv.length - 1].dateStr,
      exitPrice: Number(executionPrice.toFixed(2)),
      side: 'LONG',
      shares,
      pnlTL: Number(pnl.toFixed(2)),
      returnPct: Number(returnPct.toFixed(2)),
      holdingDays: ohlcv.length - 1 - entryBarIdx,
      exitReason: 'END_OF_DATA'
    });
  }

  const finalCapital = cash;
  const totalReturnPct = Number((((finalCapital - initialCapital) / initialCapital) * 100).toFixed(2));
  const finalBenchmarkClose = closes[closes.length - 1];
  const benchmarkReturnPct = Number((((finalBenchmarkClose - initialClose) / initialClose) * 100).toFixed(2));

  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.pnlTL > 0).length;
  const losingTrades = trades.filter(t => t.pnlTL <= 0).length;
  const winRatePct = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const grossProfit = trades.filter(t => t.pnlTL > 0).reduce((sum, t) => sum + t.pnlTL, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnlTL < 0).reduce((sum, t) => sum + t.pnlTL, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99 : 0);

  const avgTradePct = totalTrades > 0
    ? Number((trades.reduce((sum, t) => sum + t.returnPct, 0) / totalTrades).toFixed(2))
    : 0;

  // Approximate annualized Sharpe ratio
  const returns = equityCurve.slice(1).map((pt, i) => (pt.portfolioValue - equityCurve[i].portfolioValue) / equityCurve[i].portfolioValue);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdReturn = returns.length > 1
    ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
    : 0.01;
  const sharpeRatio = stdReturn > 0 ? Number(((avgReturn / stdReturn) * Math.sqrt(252)).toFixed(2)) : 0;

  const strategyNames: Record<string, string> = {
    EMA_CROSSOVER: 'EMA 20/50 Kesişimi (Golden / Death Cross)',
    SMA_CROSSOVER: 'EMA 20/50 Kesişimi (Golden / Death Cross)',
    RSI_REVERSAL: 'RSI Aşırı Satım / Dönüş Stratejisi (14)',
    MACD_CROSSOVER: 'MACD Sinyal Kesişim Stratejisi (12, 26, 9)',
    BOLLINGER_BREAKOUT: 'Bollinger Bandı (EMA20) Sıkışma & Kırılım',
    SUPERTREND_MOMENTUM: 'Parabolic SAR / Trend Takip'
  };

  return {
    symbol,
    strategyName: strategyNames[strategy] || strategy,
    initialCapital,
    finalCapital: Number(finalCapital.toFixed(2)),
    totalReturnPct,
    benchmarkReturnPct,
    totalTrades,
    winningTrades,
    losingTrades,
    winRatePct,
    profitFactor,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    sharpeRatio,
    averageTradePct: avgTradePct,
    totalCommissionsTL: Number(totalCommissionsTL.toFixed(2)),
    totalSlippageTL: Number(totalSlippageTL.toFixed(2)),
    equityCurve,
    trades
  };
}
