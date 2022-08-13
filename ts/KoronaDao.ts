import {curly} from "node-libcurl";


export class KoronaDao {

    static async call(countryCode: string): Promise<number> {
        const { data } = await curly.get(`https://koronapay.com/transfers/online/api/transfers/tariffs?sendingCountryId=RUS&sendingCurrencyId=810&receivingCountryId=${countryCode}&receivingCurrencyId=840&paymentMethod=debitCard&receivingAmount=100000&receivingMethod=cash&paidNotificationEnabled=false`, {
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
            'Cookie: qpay-web/3.0_csrf-token-v2=79ea421da8647d7cc5dced73c8e7d6be; _gali=changeable-field-input-amount; _ga=GA1.2.1602319841.1660050275; _gid=GA1.2.1877508256.1660420189; ROUTEID=3b2b4419bcd50e42|YvgAc; _dc_gtm_UA-100141486-2=1; _dc_gtm_UA-100141486-25=1; _ga_H68H5PL1N6=GS1.1.1660420189.2.1.1660420199.50; _ym_visorc=b; qpay-web/3.0_locale=en-gb; _dc_gtm_UA-100141486-1=1; _dc_gtm_UA-100141486-26=1; _ym_isad=2; _ym_d=1660050278; _ym_uid=1660050278214489241; _gcl_au=1.1.560615056.1660050274',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: 79ea421da8647d7cc5dced73c8e7d6be',
            'x-application: Qpay-Web/3.0'];
    }
}