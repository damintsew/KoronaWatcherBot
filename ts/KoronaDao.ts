import {curly} from "node-libcurl";


export class KoronaDao {

    static async call(countryCode: string): Promise<number> {

        const { statusCode, data } = await curly.get(`https://koronapay.com/transfers/online/api/transfers/tariffs?sendingCountryId=RUS&sendingCurrencyId=810&receivingCountryId=TUR&receivingCurrencyId=840&paymentMethod=debitCard&receivingAmount=200000&receivingMethod=cash&paidNotificationEnabled=true`, {
            httpHeader: this.getHttpHeader(),
            verbose: true,
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
            'Cookie: _gali=__next; qpay-web/3.0_csrf-token-v2=61c52dec4a7e59b17a1c974b059b5560; _ga=GA1.2.1602319841.1660050275; _gid=GA1.2.408932578.1660673204; ROUTEID=0d07e4c528b299fc|Yvvcw; _dc_gtm_UA-100141486-2=1; _dc_gtm_UA-100141486-25=1; _ga_H68H5PL1N6=GS1.1.1660673203.4.1.1660673208.55; _ym_visorc=b; qpay-web/3.0_locale=en-gb; _ym_d=1660673204; _ym_isad=2; _ym_uid=1660050278214489241; _dc_gtm_UA-100141486-1=1; _dc_gtm_UA-100141486-26=1; _gcl_au=1.1.566421550.1660673204',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: 61c52dec4a7e59b17a1c974b059b5560',
            'x-application: Qpay-Web/3.0'];
    }
}