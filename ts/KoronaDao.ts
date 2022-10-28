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
            'Cookie: qpay-web/3.0_csrf-token-v2=2e00ee89c030cf05c91a6b569dbfa2aa; _gali=changeable-field-input-amount; ROUTEID=29f5eaf1148ee63a|Y1vSm; _ga=GA1.1.235614836.1666956485; _gid=GA1.2.1858527757.1666956485; _ym_visorc=w; qpay-web/3.0_locale=en-gb; tmr_reqNum=35; tmr_detect=0%7C1666956491879; tmr_lvid=b277599e0794e482a6bd9147efbc372e; tmr_lvidTS=1665165306717; _ym_isad=2; CookieControl={"necessaryCookies":[],"optionalCookies":{"Google":"accepted"},"statement":{"shown":true,"updated":"01/01/2021"},"consentDate":1666784566769,"consentExpiry":90,"interactedWith":true,"user":"36975655-254F-4D28-A8D2-A168675D07E9"}; _ym_d=1666784565; _ym_uid=1664655105320075748; client-id=4b2ada5b-f76d-4bfe-b836-105f21ece7ec',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: 2e00ee89c030cf05c91a6b569dbfa2aa',
            'x-application: Qpay-Web/3.0'];
    }
}
