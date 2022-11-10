import axios from "axios";
import * as buffer from "buffer";
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

    static async call(countryCode: string): Promise<UnistreamResponse> {
        console.log(`Requesting data for country ${countryCode}`)
        try {
            let {data} = await axios.get(`https://online.unistream.ru/card2cash/calculate?` +
                `destination=${countryCode}&amount=1000&currency=USD&accepted_currency=RUB&profile=unistream/`);
            console.log("Received data: " + data)
            return data as UnistreamResponse
        } catch (err) {
            console.log(err);
            return null
        }
    }
}
