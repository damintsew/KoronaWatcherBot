import {curly} from "node-libcurl";

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

export class UnistreamDao {

    static async call(countryCode: string): Promise<UnistreamResponse> {
        console.log(`UnistreamDao for country ${countryCode}`)
        try {
            const {
                statusCode,
                data
            } = await curly.get(`https://online.unistream.ru/card2cash/calculate?destination=ISR&amount=1000&currency=USD&accepted_currency=RUB&profile=unistream`,
                {httpHeader: UnistreamDao.getHttpHeader()});
            // let {data} = await curly.get(`https://online.unistream.ru/card2cash/calculate?` +
            //     `destination=${countryCode}&amount=1000&currency=USD&accepted_currency=RUB&profile=unistream/`);
            console.log("Received data: " + data)
            return data as UnistreamResponse
        } catch (err) {
            console.log(err);
            return null
        }
    }

    private static getHttpHeader() {
        return ['Accept: application/json, text/javascript, */*; q=0.01',
            'Origin: https://unistream.ru',
            'Accept-Encoding: gzip, deflate, br',
            'Host: online.unistream.ru',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
            'Accept-Language: ru',
            'Referer: https://unistream.ru/',
            'Connection: keep-alive'];
    }
}