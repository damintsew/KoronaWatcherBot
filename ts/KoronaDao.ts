import axios from "axios";

interface KoronaResponse {
    country: string,
    value: number
}

export class KoronaDao {

    static async call(countryCode: string): Promise<number> {
        console.log(`Requesting data for country ${countryCode}`)
        try {
            let {data} = await axios.get(`http://localhost:3333/korona/${countryCode}`);
            console.log("Received data: " + data)
            return data.value

        } catch (err) {
            console.log(err);
            return null
        }
    }
}
