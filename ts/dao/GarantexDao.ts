import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Buffer } from 'buffer';

export class GarantexDao {

    private host = "garantex.io"; // для тестового сервера используйте stage.garantex.biz
    private privateKey = "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcFFJQkFBS0NBUUVBcWxDR1VyU2FFU1NQMzZXbmxhenFoYTFzWjJldWdwMGIxTE1JYVNvMXcvRTY5ZFVKCnNRRi9UN1VCYUdTallNamZRV01KOUhQYkd6bU5WTnpha3dmQ2lFbFFJNkVIUkhpb1VjaWx6UVVpaGZMcVc5QVEKdHJJMTI5cWs2RW8vbzFkdnBMRUVwVWZ6WmpHVVp1SXR1ZG5hZDlQWng4ckVWVnN2UytaVm1QRnp2cUdndHZTawpyanFxYzhPU0g1QVlyQTNrUmIzTUZrU3BKT1hVRVJCemlVSDdhNDA1dEkxanRWOTkxSVc5bDdVeWpjK1lqdnVpCkdpMGxwaEJIVWlzZG9SVGdvd1duUXU0eUdjYUhMUkdJcDN1QUN1TzhaUkpJWFpSMy9odmhsRmVEbDRQQ3lkVy8KVldyTFBsLzlqQzVXMXJoZHZFbDlvYy9mbDBlcHVmeEIrYklpSVFJREFRQUJBb0lCQVFDZE9OYTI5SmVoS2FKVApMK1lEYXV2WVdWN1FHa3Rqc2NybVVCdDhrWVd1aXpzRmd4TitQa2FiZXhtQW1CNm1FdWpkd0tLSThvYWFuRWRXCnhzWlRvbjgzTm81dlJaQ2k2Y3RnTEJ5NnBYbllNNFdiR2ZqRDNzR1BZa2lIVXp0cCt5WkozMHZObEIwaUFyVGYKUVA0N0tkdmVjRWdEZ3JBNXA0S0N5Mi9MVDJHczRKOHZIMUdNSTgxZHZMbi9SblFhVkdjYkxSdDh6ZXVhKzJucgphVnBacjZYMDF6OG1veGRwOGZ3STRrT0QvVTk2bFFOTzQ4dm5OMWUzQ1N2OHBERXNMQitEL0wyQkkycUNmVFcyCkpQbnJBdG9kUENqbVlhQjhIMUNucGVFeWI3U1QvZnhhVmw0bmZtSmlPcTMyTU5NNVljdnJwRVMzMnBjZC9KR2QKeDVBRkVTcVJBb0dCQU9CQjFkM3d4S1NIRnZvbVloMWdKOUNYSHFsYnFPMjBPRGVvbDBueU1NdzFMdHZGV0E2ZQpiakJMRG1nQ1YrMkFTVTQ1WE13VnZLNDNZMGJxZXFISUN4OWxOM2NKWVRuRWVxckFDemkvdWdNOTVyd1F2bFhZCjAyRENCRkNzcjZtVkxqM3RvYm9PSHdScm1TVmFhc0hUQ0REMFpNSzR2M2xMTCsyaGFZZTBDRjBWQW9HQkFNSnMKQjJVRU5zdFhlTlRGYkN1R0JTZThvcWRIdjFqR2Q0M21MQjNrNXFBeDVqb1lKSURyU09jb01SWDk1U3VIYm1pTQpMMVE4Nm5Cb0R1akxVSUdaMzZZVlZyZ1V2L2NOTEFvY2txeVRIRUNLT1JFR1JyRFJTUnFmMGtqbGhPbUpJajZuCmh0bURVQjVnNEx0YmdSRFcxSW40QUJTeWt2VW9hUGE5RUFGcHltdmRBb0dBQi9udmZHeGk0aU0zNnYvUWY1RDYKK1kxV2R0bWV3WTJtYmp4ZDNUQnpFZUJXWVZTOGxCQ0loTWsyb3ZacVlEVXU1a3hlQTVoR1ZMLzlsUGtrRVhzSApBai9jWUN5Q084YkVRaXlBZWExQUZYdHZLSU5EOGRPN2VQYU5wcnp0cG85NnpKTVdMSUx5RVhzdVFFamVBVFRiClZycHFsdzV4S1FSR21TSWptY01LaFIwQ2dZRUFuTHAzVDVDUkYyVEJURXlHQWFQOVBlWkwvS3ZTN1o2NE85U2sKRmNrenZVbmNmVkovQXNvcEwrYnZndm4wcHgxNi9KNmRmTHZLaGFqczgrOEtUQitkOGdYYnJYTlV1TFNPbnV3Zgp0U3kySnJVR2dkbmNYS2VwMWVPbW9nc2NGU0x1VHpHL2ZGTGw0RWRhZ3M2bUFjd2M4OGZQVU9BUHBiL1l0YWI5Cll4WkVEcVVDZ1lFQXVuOUFaYWgwU1ZMbTBXaWJ0SlFiMUR0WkUxZGRRVWZVb1YxSWNLeDErdThiMk9uOWJ6VEEKMFRHbTg3SkNSY1hidWpBcFpuemhrQ0VJSU9reHhZUk9wVXVXWVBhdkpvMnpCRzNUNEVRREVGblRVVFpRTmJpYgozcWpWYWFqMGFPNGxhbjBPR1dhQnh1MUhtNlJ2Z0dreDZTd2hpSEtTYVhxRGFBaW9lWkRvV2VjPQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo="; // приватный ключ, полученный на этапе создания API ключей
    private uid = "a8e11b25-42a8-44ed-ace5-edf8ff796e50"; // UID, полученный на этапе создания API ключей

    async test() {
        try {
            let { data } = await axios.get(
              // "https://" + this.host + "/api/v2/depth?market=usdtrub",
              "https://" + this.host + "/api/v2/trades?market=usdtrub&order_by=desc&limit=250",
              {
                headers: {
                  Authorization: `Bearer ${await this.getToken()}`,
                },
              }
            );
            console.log(data);
          } catch (e) {
            console.error(e.message, e.response.data.error);
          }
    }

    private async getToken() {
        try {
          let { data } = await axios.post(
            "https://dauth." + this.host + "/api/v1/sessions/generate_jwt",
            {
              kid: this.uid,
              jwt_token: jwt.sign(
                {
                  exp: Math.round(Date.now() / 1000) + 30 * 60, // JWT Request TTL: 30 minutes
                  jti: crypto.randomBytes(12).toString("hex"),
                },
                  Buffer.from(this.privateKey, "base64").toString("ascii"),
                { algorithm: "RS256" }
              ),
            }
          );
          return data.token;
        } catch (e) {
          console.error(e);
          return false;
        }
      };
}