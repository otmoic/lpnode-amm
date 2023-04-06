interface AmmContext {
  systemInfo: {
    msmqName: string;
  };
  walletInfo: {
    walletName: string;
  };
  AskInfo: {
    cid: string;
  };
  baseInfo: {
    srcToken: {
      precision: number;
      cexPrecision: number;
      address: string;
      coinType: string;
      symbol: string;
      chainId: number;
    };
    dstToken: {
      precision: number;
      cexPrecision: number;
      address: string;
      coinType: string;
      symbol: string;
      chainId: number;
    };
  };
  swapInfo: {
    inputAmount: string; //  前端输入的量
    inputAmountNumber: number;
    srcAmount: string; // 实际收到的量
    srcAmountNumber: number;
    dstAmount: string; // 实际转出的量
    dstAmountNumber: number;
  };
  chainOptInfo: {
    srcChainReceiveAmount: string // A 链实际 tr in 的量
    srcChainReceiveAmountNumber: number // A 链实际 tr in 的量
    dstChainPayAmount: string // B 链实际付款金额
    dstChainPayAmountNumber: number // B链实际付款的number
    dstChainPayNativeTokenAmount: string
    dstChainPayNativeTokenAmountNumber: number
  },
  quoteInfo: {
    quote_hash: string;
    mode: string;
    origPrice: string;
    price: string; // 1 的报价
  };
  lockInfo: {
    price: string;
    time: number;
  };
  askTime: number;
  systemOrder: {
    orderId: number;
    balanceLockedId: string; // 锁的mongoid
    bridgeConfig: any;
  };
}

export { AmmContext };
