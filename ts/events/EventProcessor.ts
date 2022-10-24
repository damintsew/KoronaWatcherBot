import {EventListener} from "./EventListener";
import {ExchangeHistory} from "../entity/ExchangeHistory";


export class EventProcessor {

    private eventListeners: EventListener[] = [];

    subscribe(listener: EventListener) {
        this.eventListeners.push(listener)
    }

    onEvent(exchangeHistory: ExchangeHistory) {
        this.eventListeners.forEach((e) => e.onEvent(exchangeHistory))
    }
}
