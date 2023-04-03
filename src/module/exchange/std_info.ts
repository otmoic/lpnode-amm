import { IStdExchange } from "../../interface/std_exchange";
class StdInfo {
  private stdExchange: IStdExchange; // cex 所的引用
  public constructor(cexExchange: IStdExchange) {
    this.stdExchange = cexExchange;
  }
  public getSpotMarkets() {
    return this.stdExchange.exchangeSpot.fetchMarkets();
  }
  public getCoinFutureMarkets() {
    return this.stdExchange.exchangeCoinFuture.fetchMarkets();
  }
  public getUsdtFutureMarkets() {
    return this.stdExchange.exchangeUsdtFuture.fetchMarkets();
  }
}
export { StdInfo };
