import {
  ICexAccount,
  ICexAccountApiType,
  ICexExchangeList,
} from "../../interface/std_difi";
import { IStdExchange } from "../../interface/std_exchange";
import { StdBalance } from "./std_balance";
import { BinanceExchange } from "./cex_exchange/binance/binance";
import { StdOrder } from "./std_order";
import { logger } from "../../sys_lib/logger";
import { StdInfo } from "./std_info";
import { PortfolioExchange } from "./cex_exchange/portfolio/portfolio";

import * as _ from "lodash";
import { AdapterExchange } from "./cex_exchange/adapter/adapter";
class StdAccount {
  private cexExchange: IStdExchange;
  private accountInfo: ICexAccount;
  public balance: StdBalance;
  public order: StdOrder;
  public info: StdInfo;

  constructor(option: ICexAccount) {
    this.accountInfo = option;
  }
  public getCexExchange() {
    return this.cexExchange;
  }

  public getExchangeName() {
    return this.accountInfo.exchangeName;
  }

  /**
   * Initialize account list
   * @date 2023-01-17 20:51:30
   * @public
   * @async
   * @return {Promise<void>} Empty
   */
  public async init(): Promise<void> {
    if (
      this.accountInfo.exchangeName === ICexExchangeList.binance &&
      _.get(this.accountInfo, "apiType", ICexAccountApiType.exchange) ===
        ICexAccountApiType.exchange
    ) {
      // directly connect to binance
      this.cexExchange = new BinanceExchange({
        spotAccount: {
          apiKey: _.get(this.accountInfo, "spotAccount.apiKey", ""),
          apiSecret: _.get(this.accountInfo, "spotAccount.apiSecret", ""),
        },
        usdtFutureAccount: {
          apiKey: _.get(this.accountInfo, "usdtFutureAccount.apiKey", ""),
          apiSecret: _.get(this.accountInfo, "usdtFutureAccount.apiSecret", ""),
        },
        coinFutureAccount: {
          apiKey: _.get(this.accountInfo, "coinFutureAccount.apiKey", ""),
          apiSecret: _.get(this.accountInfo, "coinFutureAccount.apiSecret", ""),
        },
      });
      logger.debug(
        `load exchange spot markets symbols 【${this.accountInfo.accountId}】`
      );
    }
    if (
      this.accountInfo.exchangeName === ICexExchangeList.binance &&
      this.accountInfo.apiType === ICexAccountApiType.portfolio
    ) {
      this.cexExchange = new PortfolioExchange(
        this.accountInfo.accountId,
        this.accountInfo
      );
    }
    if (this.accountInfo.apiType === ICexAccountApiType.exchange_adapter) {
      this.cexExchange = new AdapterExchange(
        this.accountInfo.accountId,
        this.accountInfo
      );
    }
    try {
      await this.cexExchange.exchangeSpot.loadMarkets(); // Initialize trading pairs in the spot market
      await this.cexExchange.exchangeUsdtFuture.loadMarkets(); //  initializes trading pairs
      await this.cexExchange.exchangeCoinFuture.loadMarkets(); // initializes trading pairs
      this.cexExchange.exchangeSpot.refreshMarkets();
      await this.initBalance(this.cexExchange);
      await this.initOrder(this.cexExchange);
      await this.initInfo(this.cexExchange); // init markets
    } catch (e) {
      const err: any = e;
      logger.error(
        `An error occurred in initializing the hedging account....`,
        err.toString()
      );
      throw new Error(
        `An error occurred in initializing the hedging account:${err.toString()}`
      );
    }
    if (!this.cexExchange) {
      throw new Error(
        `Account initialization failed:${JSON.stringify(this.accountInfo)}`
      );
    }
  }

  private async initOrder(cexExchange: IStdExchange) {
    this.order = new StdOrder(cexExchange);
  }

  private async initInfo(cexExchange: IStdExchange) {
    this.info = new StdInfo(cexExchange);
  }

  /**
   * Initialize the balance class
   * @date 1/17/2023 - 8:53:26 PM
   *
   * @private
   * @async
   * @param {IStdExchange} cexExchange "Exchange"
   * @returns {Promise<void>} ""
   */
  private async initBalance(cexExchange: IStdExchange): Promise<void> {
    this.balance = new StdBalance(cexExchange, this.accountInfo);
    await this.balance.syncSpotBalance();
    await this.balance.syncUsdtFutureBalance();
    await this.balance.syncCoinFutureBalance();
    await this.balance.syncUsdtFuturePositionRisk();
  }

  public getSpotStatus() {
    // this.cexExchange.getSpotStatus();
  }
}

export { StdAccount };
