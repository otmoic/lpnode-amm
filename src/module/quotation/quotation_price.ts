/* eslint-disable @typescript-eslint/indent */
/* eslint-disable arrow-parens */
import BigNumber from "bignumber.js";
import { dataConfig } from "../../data_config";
import { logger } from "../../sys_lib/logger";
import { orderbook } from "../orderbook";

class QuotationPrice {
  public getCoinUsdtOrderbook(
    token: string,
    chainId: number
  ): {
    stdSymbol: string | null;
    bids: number[][];
    asks: number[][];
  } {
    const { symbol: stdCoinSymbol } = dataConfig.getStdCoinSymbolInfoByToken(
      token,
      chainId
    );
    if (!stdCoinSymbol) {
      logger.error(`获取Token对应的StdCoinSymbol失败，请检查基础配置${token}`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]] };
    }
    const stdSymbol = `${stdCoinSymbol}/USDT`;
    if (stdSymbol === "USDT/USDT" || stdSymbol === "USDC/USDT") {
      return {
        stdSymbol,
        bids: [[1, 100000000]],
        asks: [[1, 100000000]],
      };
    }
    const orderbookItem = orderbook.getSpotOrderbook(stdSymbol);
    if (!orderbookItem) {
      logger.error(`获取orderbook失败...`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]] };
    }
    const { bids, asks } = orderbookItem;
    const retBids = bids.map((it) => {
      return [Number(it[0]), Number(it[1])];
    });
    const retAsks = asks.map((it) => {
      return [Number(it[0]), Number(it[1])];
    });
    if (retBids.length <= 2 || retAsks.length <= 2) {
      logger.debug(`orderbook的深度不够`, stdSymbol);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]] };
    }
    return { stdSymbol, asks: retAsks, bids: retBids };
  }

  public getCoinUsdtOrderbookByCoinName(stdCoinSymbol: string) {
    const stdSymbol = `${stdCoinSymbol}/USDT`;
    if (stdSymbol === "USDT/USDT") {
      return {
        stdSymbol: "USDT/USDT",
        bids: [[1, 100000000]],
        asks: [[1, 100000000]],
      };
    }
    const orderbookItem = orderbook.getSpotOrderbook(stdSymbol);
    if (!orderbookItem) {
      logger.error(`获取orderbook失败...`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]] };
    }
    const { bids, asks } = orderbookItem;
    const retBids = bids.map((it) => {
      return [Number(it[0]), Number(it[1])];
    });
    const retAsks = asks.map((it) => {
      return [Number(it[0]), Number(it[1])];
    });
    return { stdSymbol, asks: retAsks, bids: retBids };
  }

  public getABPrice(
    amount: BigNumber,
    A: { bids: any; asks: any } | any,
    B: { bids: any; asks: any } | any
  ) {
    // ETH-AVAX
    const { bids: ABids } = A;
    const [[aPrice]] = ABids;
    const { asks: BAsks } = B;
    const [[bPrice]] = BAsks;
    const bnA = new BigNumber(aPrice);
    const bnB = new BigNumber(bPrice);
    return bnA.div(bnB);
  }
}

const quotationPrice: QuotationPrice = new QuotationPrice();
export { QuotationPrice, quotationPrice };
