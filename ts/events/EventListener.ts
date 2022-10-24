import {ExchangeHistory} from "../entity/ExchangeHistory";

export interface EventListener {

    onEvent(exchangeValue: ExchangeHistory)
}
