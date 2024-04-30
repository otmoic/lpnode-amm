const fs = require("fs");
const path = require("path");
const envFile = fs.existsSync(path.join(__dirname, "../", "env.js"));
if (envFile) {
  require("../env.js");
} else {
  console.log("env file does not exist");
}
// import BigNumber from "bignumber.js";
import { appEnv } from "../app_env";
appEnv.initConfig();
import { dataConfig } from "../data_config";
import { accountManager } from "../module/exchange/account_manager";
import { logger } from "../sys_lib/logger";
import { formatStepSize } from "../module/exchange/utils";
import * as _ from "lodash";
import { ICexAccountApiType } from "../interface/std_difi";
import { portfolioRequestManager } from "../module/exchange/cex_exchange/portfolio/request/portfolio_request";
import { orderbookSymbolManager } from "../module/orderbook/orderbook_symbol_manager";
appEnv.initConfig();

console.log(formatStepSize("0.013884994", "0.01000000"));

async function main() {
  await dataConfig.prepareConfigResource();
  // await accountManager.init();
  logger.info(`init portfolioRequestManager`);

  await portfolioRequestManager.init(); // waiting get access token
  logger.info(`init orderbookSymbolManager`);
  orderbookSymbolManager.init();
  await accountManager.loadAccounts([
    {
      apiType: ICexAccountApiType.portfolio,
      accountId: "001",
      exchangeName: "binance",
      enablePrivateStream: false,
    },
    // {
    //   apiType: ICexAccountApiType.portfolio,
    //   accountId: "a001",
    //   exchangeName: "binance",
    //   enablePrivateStream: false,
    // },
  ]);
  setInterval(() => {
    // logger.debug(`000`);
  }, 1000);
  setTimeout(async () => {
    // balance Test
    // const result = await accountManager
    //   .getAccount("a001")
    //   ?.balance.getAllSpotBalance();
    // logger.info("balance Result:👁️", result);
    //
    // const result_01 = await accountManager
    //   .getAccount("a001")
    //   ?.balance.getSpotBalance("USDT");
    // logger.info(result_01);
    //
    // accountManager.getAccount("a001")?.balance.showSpotBalance();
    //
    // logger.debug(
    //   accountManager
    //     .getAccount("a001")
    //     ?.balance.getUsdtFutureBalance("ETH/USDT")
    // );
    // logger.debug(
    //   accountManager
    //     .getAccount("a001")
    //     ?.balance.getCoinFutureBalance("ETH/USDT")
    // );
    // logger.silly(
    //   await accountManager
    //     .getAccount("a001")
    //     ?.order.spotGetTradeMinNotional("ETH/USDT")
    // );
    // accountManager
    //   .getAccount("a001")
    //   ?.order.spotBuy("0908383", "ETH/USDT", "0.000935", undefined, true);
    // logger.silly(
    //   await accountManager
    //     .getAccount("a001")
    //     ?.order.getSpotTradeMinMax("ETH/USDT", 1800)
    // );
    // logger.silly(
    //   await accountManager
    //     .getAccount("a001")
    //     ?.order.getSpotTradeMinMaxValue("ETH/USDT")
    // );
    const orderResult = await accountManager
      .getAccount("001")
      ?.order.spotBuy(
        "000085802",
        "ETH/USDT",
        "0.02",
        undefined,
        "0.00000000",
        false
      );
    logger.debug(orderResult);
  }, 3000);
  // {
  //   client: 'binance_spot_bt_demo_trader',
  //   exchange: '15',
  //   client_id: 'S_v_1jd_pnv60',
  //   market: 'ETHUSDT',
  //   price: '0.00000000',
  //   side: 'sell',
  //   order_type: 'market',
  //   post_only: false,
  //   size: '0.0100',
  //   lostAmount: '-0.000015'
  // }
}

main()
  .then(() => {
    //
  })
  .catch((e: any) => {
    logger.error("e", e);
  });
