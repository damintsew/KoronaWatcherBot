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
        return ['Accept: application/vnd.cft-data.v2.94+json',
            'Cookie: qpay-web/3.0_csrf-token-v2=9decd25deaaa314d665489ca3cc70aaf; _gali=changeable-field-input-amount; ROUTEID=95d5465b93cbc125|Y20BZ; _ym_isad=2; _ym_visorc=b; _dc_gtm_UA-100141486-1=1; _dc_gtm_UA-100141486-2=1; _dc_gtm_UA-100141486-25=1; _dc_gtm_UA-100141486-26=1; _ga=GA1.1.2113913942.1667813788; _ga_H68H5PL1N6=GS1.1.1668088153.2.0.1668088153.60.0.0; _gid=GA1.2.2119481893.1668088149; qpay-web/3.0_locale=en-gb; _gat_UA-100141486-25=1; _gat_UA-100141486-33=1; _gcl_au=1.1.472329890.1667813789; _ym_d=1667813789; _ym_uid=1664655105320075748; tmr_reqNum=42; client-id=4b2ada5b-f76d-4bfe-b836-105f21ece7ec',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: 9decd25deaaa314d665489ca3cc70aaf',
            'x-application: Qpay-Web/3.0'];
    }
}
