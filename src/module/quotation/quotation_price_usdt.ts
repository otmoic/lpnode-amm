/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable arrow-parens */
import BigNumber from "bignumber.js";
import { dataConfig } from "../../data_config";
import { logger } from "../../sys_lib/logger";
import { orderbook } from "../orderbook";
import * as _ from "lodash";
import { AmmContext } from "../../interface/context";
import { SystemMath } from "../../utils/system_math";

class QuotationPrice {
  public getCoinStableCoinOrderBook(
    token: string,
    chainId: number
  ): {
    stdSymbol: string | null;
    bids: number[][];
    asks: number[][];
    timestamp: number
  } {
    const { symbol: stdCoinSymbol } = dataConfig.getStdCoinSymbolInfoByToken(
      token,
      chainId
    );
    if (!stdCoinSymbol) {
      logger.error(`获取Token对应的StdCoinSymbol失败，请检查基础配置${token}`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]], timestamp: new Date().getTime() };
    }
    const stdSymbol = `${stdCoinSymbol}/USDT`;
    if (stdSymbol === "USDT/USDT" || stdSymbol === "USDC/USDT") {
      return {
        stdSymbol,
        bids: [[1, 100000000]],
        asks: [[1, 100000000]],
        timestamp: new Date().getTime()
      };
    }
    if (stdSymbol === "T/USDT") {
      return {
        stdSymbol,
        bids: [[1, 100000000]],
        asks: [[1, 100000000]],
        timestamp: new Date().getTime()
      };
    }
    const orderbookItem = orderbook.getSpotOrderbook(stdSymbol);
    if (!orderbookItem) {
      logger.error(`获取orderbook失败...`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]], timestamp: new Date().getTime() };
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
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]], timestamp: new Date().getTime() };
    }
    return { stdSymbol, asks: retAsks, bids: retBids, timestamp: orderbookItem.timestamp };
  }

  public getCoinUsdtExecuteOrderbook(
    token: string,
    chainId: number,
    amount: number
  ): { stdSymbol: string | null; bids: number[][]; asks: number[][], timestamp: number } {
    const { symbol: stdCoinSymbol } = dataConfig.getStdCoinSymbolInfoByToken(
      token,
      chainId
    );
    if (!stdCoinSymbol) {
      logger.error(`获取Token对应的StdCoinSymbol失败，请检查基础配置${token}`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]], timestamp: new Date().getTime() };
    }
    const stdSymbol = `${stdCoinSymbol}/USDT`;
    if (stdSymbol === "USDT/USDT" || stdSymbol === "USDC/USDT") {
      return {
        stdSymbol,
        bids: [[1, 100000000]],
        asks: [[1, 100000000]],
        timestamp: new Date().getTime()
      };
    }
    if (stdSymbol === "T/USDT") {
      return {
        stdSymbol,
        bids: [[1, 100000000]],
        asks: [[1, 100000000]],
        timestamp: new Date().getTime()
      };
    }
    const orderbookItem = orderbook.getSpotOrderbook(stdSymbol);
    if (!orderbookItem) {
      logger.error(`获取orderbook失败...`);
      return { stdSymbol: null, bids: [[0, 0]], asks: [[0, 0]], timestamp: new Date().getTime() };
    }
    const { bids: orderbook_bids, asks: orderbook_asks } = orderbookItem;
    const level_1_asks = (inputAmount: number): number[][] => {
      const total_amount = inputAmount;
      let left_amount = inputAmount;
      const execResult: any = [];
      orderbook_asks.map((it) => {
        const orderbook_amount = Number(it[1]);
        if (left_amount === 0) {
          return;
        }
        if (orderbook_amount >= left_amount) {
          execResult.push({ price: it[0], executeAmount: left_amount });
          left_amount = left_amount - left_amount;
        } else {
          execResult.push({ price: it[0], executeAmount: orderbook_amount });
          left_amount = left_amount - orderbook_amount;
        }
        //
      });

      let cost = 0;
      execResult.map((it) => {
        cost = SystemMath.execNumber(
          `${cost} +${it.executeAmount} * ${it.price}`,
          "",
          false
        );
      });
      // console.log(execResult, orderbook_asks);
      if (left_amount > 0) {
        throw "orderbook 无法满足报价";
      }
      return [
        [
          SystemMath.execNumber(`${cost} / ${total_amount}`, "", false),
          inputAmount,
        ],
      ];
    };
    const level_1_bids = (inputAmount: number): number[][] => {
      const total_amount = inputAmount;
      let left_amount = inputAmount;
      const execResult: any = [];
      orderbook_bids.map((it) => {
        const orderbook_amount = Number(it[1]);
        if (left_amount === 0) {
          return;
        }
        if (orderbook_amount >= left_amount) {
          execResult.push({ price: it[0], executeAmount: left_amount });
          left_amount = left_amount - left_amount;
        } else {
          execResult.push({ price: it[0], executeAmount: orderbook_amount });
          left_amount = left_amount - orderbook_amount;
        }
        //
      });

      let cost = 0;
      execResult.map((it) => {
        cost = SystemMath.execNumber(
          `${cost} +${it.executeAmount} * ${it.price}`,
          "",
          false
        );
      });
      // console.log(execResult, orderbook_bids);
      if (left_amount > 0) {
        throw "orderbook 无法满足报价";
      }
      return [
        [
          SystemMath.execNumber(`${cost} / ${total_amount}`, "", false),
          inputAmount,
        ],
      ];
    };
    return {
      stdSymbol,
      asks: level_1_asks(amount),
      bids: level_1_bids(amount),
      timestamp: orderbookItem.timestamp
    };
  }

  public getCoinStableCoinOrderBookByCoinName(stdCoinSymbol: string): {
    stdSymbol: string | null;
    bids: number[][];
    asks: number[][];
  } {
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
      logger.error(`获取orderbook失败...${stdSymbol}`);
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

  public getNativeTokenBidPrice(chainId: number) {
    const gasSymbol = dataConfig.getChainTokenName(chainId);
    if (!gasSymbol) {
      throw new Error(`No coins found for the target chain 【${chainId}】`);
    }
    const {
      asks: [[tokenUsdtPrice]],
    } = this.getCoinStableCoinOrderBookByCoinName(gasSymbol);
    if (!_.isFinite(tokenUsdtPrice) || tokenUsdtPrice === 0) {
      logger.error(`没有找到U价，报价失败 ${gasSymbol}`);
      throw new Error(`目标链Gas币Usdt 价值获取失败，无法报价${gasSymbol}`);
    }
    return tokenUsdtPrice;
  }


  public getSrcTokenBidPrice(ammContext: AmmContext) {
    const { stdSymbol, asks } = this.getCoinStableCoinOrderBook(
      ammContext.baseInfo.srcToken.address,
      ammContext.baseInfo.srcToken.chainId
    );
    if (stdSymbol === null) {
      throw new Error(
        `no orderbook found,bridge ${ammContext.bridgeItem.msmq_name}`
      );
    }
    const [[price]] = asks;
    return price;
  }

  public getDstTokenBidPrice(ammContext: AmmContext) {
    const { stdSymbol, asks } = this.getCoinStableCoinOrderBook(
      ammContext.baseInfo.dstToken.address,
      ammContext.baseInfo.dstToken.chainId
    );
    if (stdSymbol === null) {
      throw new Error(
        `no orderbook found,bridge ${ammContext.bridgeItem.msmq_name}`
      );
    }
    const [[price]] = asks;
    return price;
  }
}

const quotationPrice: QuotationPrice = new QuotationPrice();
export { QuotationPrice, quotationPrice };