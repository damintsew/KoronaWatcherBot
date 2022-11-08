import axios from "axios";
import {Service} from "typedi";

interface Response {
    lastUpdateId: number,
    bids: string[][],
    asks: string[][]
}

@Service()
export class BinanceDao {

    private url = "https://api.binance.com/api/v3/depth?symbol=USDTRUB"

    async getLatestTrades(market = "USDTRUB"): Promise<Response> {
        try {
            let {data} = await axios.get(`https://api.binance.com/api/v3/depth?symbol=USDTRUB`);
            return data as Response
        } catch (e) {
            console.error(e.message, e.response.data.error);
            return null
        }
    }
}
