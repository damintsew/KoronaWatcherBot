import axios from "axios";
import {Service} from "typedi";

interface UnistreamResponse {
    "message": null,
    "fees": [
        {
            "name": string,
            "acceptedAmount": number,
            "acceptedCurrency": string,
            "withdrawAmount": number,
            "withdrawCurrency": string,
            "rate": number,
            "acceptedTotalFee": number,
            "acceptedTotalFeeCurrency": number
        }]
}

@Service()
export class UnistreamDao {

    private url = "https://api.binance.com/api/v3/depth?symbol=USDTRUB"

    async getLatestTrades(country: string, currency = "USD" ): Promise<UnistreamResponse> {
        try {
            let {data} = await axios.get(`https://online.unistream.ru/card2cash/calculate?destination=${country}&amount=1000&currency=${currency}&accepted_currency=RUB&profile=unistream`);
            return data as UnistreamResponse
        } catch (e) {
            console.error(e.message, e.response.data.error);
            return null
        }
    }
}
