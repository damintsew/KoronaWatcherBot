import {curly} from "node-libcurl";


export class KoronaDao {

    static async call(countryCode: string): Promise<number> {

        console.log(`Requesting data for country ${countryCode}`)
        const { statusCode, data } = await curly.get(`https://koronapay.com/transfers/online/api/transfers/tariffs?sendingCountryId=RUS&sendingCurrencyId=810&receivingCountryId=${countryCode}&receivingCurrencyId=840&paymentMethod=debitCard&receivingAmount=100000&receivingMethod=cash&paidNotificationEnabled=true`, {
            httpHeader: this.getHttpHeader(),
        })
        console.log("Status code = " + statusCode)
        console.log(data)

        if (data.length > 0) {
            return data[0].exchangeRate;
        }
        return null;
    }

    private static getHttpHeader() {
        return ['Accept: application/vnd.cft-data.v2.86+json',
            'Cookie: qpay-web/3.0_csrf-token-v2=b15aadd1ec7400786bc9e329f7bdddba; ROUTEID=0adc176d99dd23c4|YzifH; _gali=changeable-field-input-amount; _dc_gtm_UA-100141486-2=1; _dc_gtm_UA-100141486-25=1; _ga=GA1.2.368400859.1664655103; _ga_H68H5PL1N6=GS1.1.1664655103.1.1.1664655108.55.0.0; _gid=GA1.2.1989051445.1664655104; _ym_visorc=b; qpay-web/3.0_locale=en-gb; _ym_d=1664655105; _ym_isad=2; _ym_uid=1664655105320075748; _dc_gtm_UA-100141486-1=1; _dc_gtm_UA-100141486-26=1; _gcl_au=1.1.1138320732.1664655103',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: b15aadd1ec7400786bc9e329f7bdddba',
            'x-application: Qpay-Web/3.0'];
    }
}
