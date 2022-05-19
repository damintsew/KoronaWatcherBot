import {curly} from "node-libcurl";


export class KoronaDao {

    static async call(countryCode: string): Promise<number> {
        const { data } = await curly.get(`https://koronapay.com/transfers/online/api/transfers/tariffs?sendingCountryId=RUS&sendingCurrencyId=810&receivingCountryId=${countryCode}&receivingCurrencyId=840&paymentMethod=debitCard&receivingAmount=200000&receivingMethod=cash&paidNotificationEnabled=true`, {
            httpHeader: this.getHttpHeader()
        })
        console.log(data)

        if (data.length > 0) {
            return data[0].exchangeRate;
        }
        return null;
    }

    private static getHttpHeader() {
        return ['Accept: application/vnd.cft-data.v2.82+json',
            'Cookie: qpay-web/3.0_csrf-token-v2=7940550c96d16293b5f265e3902823de; tmr_reqNum=70; ROUTEID=43782fc947ec82fa|YoJVb; tmr_detect=0%7C1652703607065; _fbp=fb.1.1651760537007.461054619; tmr_lvid=456fce975f02e5a7c260ceefc66d7246; tmr_lvidTS=1650530168519;qpay-web/3.0_locale=en-gb',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: 7940550c96d16293b5f265e3902823de',
            'x-application: Qpay-Web/3.0'];
    }
}
