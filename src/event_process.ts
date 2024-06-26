import { dataConfig } from "./data_config";
import { IEVENT_LOCK_QUOTE, IEVENT_NAME } from "./interface/event";
import { IBridgeTokenConfigItem } from "./interface/interface";
import { business } from "./module/business";
import { lockEventQueue } from "./module/event_process/lock_queue";
import { redisSub } from "./redis_bus";
import { logger } from "./sys_lib/logger";
import * as _ from "lodash";
import { systemRedisBus } from "./system_redis_bus";
import { channelMessageModule } from "./mongo_module/channel_message";

class EventProcess {
  public async process() {
    systemRedisBus.on("bridgeUpdate", () => {
      this.relistenEvent();
    });
    await this.listenEvent();
    await this.startProcessQueue(); // start process
  }

  /**
   * Description listen all bridge channel
   * @date 1/17/2023 - 9:07:19 PM
   * @private
   * @async
   * @returns {*} void
   */
  private async listenEvent(): Promise<void> {
    await this.listenAllBridge();
    redisSub.on("message", async (channel: string, message: string) => {
      try {
        this.saveMessage(message, channel)
          .then(() => {
            //
          })
          .catch((e) => {
            logger.error("write message to database error", e);
          });
        await this.onMessage(message, channel);
      } catch (e) {
        logger.error(`process redis message error`, e);
      }
    });
  }

  private async saveMessage(msg: string, channel: string) {
    const message = JSON.parse(msg);
    if (message["cmd"] === "CMD_UPDATE_QUOTE") {
      return;
    }
    await channelMessageModule.create({
      channelName: channel,
      message: JSON.parse(msg),
    });
  }

  private async relistenEvent(): Promise<void> {
    logger.warn(`resubscribe event,bridgeUpdate`);
    const readySubList = _.get(redisSub, "_subList", []);
    readySubList.forEach((item) => {
      logger.warn("unsubscribe item", item);
      redisSub.unsubscribe(item);
    });
    await this.listenAllBridge();
  }

  private async listenAllBridge() {
    const subList: string[] = [];
    await dataConfig.syncBridgeConfigFromLocalDatabase();
    const itemList: IBridgeTokenConfigItem[] = dataConfig.getBridgeTokenList();
    for (const item of itemList) {
      logger.debug(
        `subscribe bridgeItem channel ${item.msmq_name} ${item.srcToken}/${item.dstToken}`
      );
      await redisSub.subscribe(item.msmq_name);
      subList.push(item.msmq_name);
    }
    _.set(redisSub, "_subList", subList);
  }

  private startProcessQueue() {
    logger.info("consumption queue");
    lockEventQueue.process(async (job, done) => {
      const msg: IEVENT_LOCK_QUOTE = _.get(job, "data", undefined);
      try {
        if (!msg) {
          throw new Error(`no data available`);
        }
        await business.lockQuote(msg);
      } catch (e) {
        const err: any = e;
        logger.error(`execute quote job error:${err.toString()}`);
      } finally {
        done();
      }
    });
  }

  public async onMessage(message: string, channel: any) {
    const msg: any = JSON.parse(message);
    // logger.debug(msg.cmd, IEVENT_NAME.EVENT_LOCK_QUOTE);
    const processCmdList = [
      IEVENT_NAME.CMD_ASK_QUOTE,
      IEVENT_NAME.EVENT_LOCK_QUOTE,
      IEVENT_NAME.EVENT_TRANSFER_OUT,
      IEVENT_NAME.EVENT_TRANSFER_OUT_CONFIRM,
      IEVENT_NAME.EVENT_TRANSFER_OUT_REFUND,
    ];
    if (processCmdList.includes(msg.cmd)) {
      logger.debug(
        "received message",
        `【${msg.cmd}】`,
        JSON.stringify(msg).substring(0, 100)
      );
    } else {
      logger.debug(
        "received message skip",
        `【${msg.cmd}】`,
        JSON.stringify(msg).substring(0, 100)
      );
    }

    try {
      if (msg.cmd === IEVENT_NAME.CMD_ASK_QUOTE) {
        await business.askQuote(msg, channel);
        return;
      }
      if (msg.cmd === IEVENT_NAME.EVENT_LOCK_QUOTE) {
        lockEventQueue.add(msg);
        // await business.lockQuote(msg);
        return;
      }

      if (msg.cmd === IEVENT_NAME.EVENT_TRANSFER_OUT) {
        await business.onTransferOut(msg);
        return;
      }
      if (msg.cmd === IEVENT_NAME.EVENT_TRANSFER_OUT_CONFIRM) {
        await business.onTransferOutConfirm(msg);
        return;
      }
      if (msg.cmd === IEVENT_NAME.EVENT_TRANSFER_OUT_REFUND) {
        await business.onTransferOutRefund(msg);
        return;
      }
    } catch (e) {
      logger.error(`process Event Error Cmd ${msg.cmd}`, e);
    }
  }
}

const eventProcess: EventProcess = new EventProcess();

export { eventProcess };
