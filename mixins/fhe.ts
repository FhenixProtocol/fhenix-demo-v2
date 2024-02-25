import appConfig from "../config/appConfig.json";
import { getPermit } from "fhenixjs";
import { defineComponent } from 'vue';
import CommonProps from '@/mixins/CommonProps'
import { ethers } from "ethers";


const fromHexString = (hexString: string): Uint8Array => {
  const arr = hexString.replace(/^(0x)/, '').match(/.{1,2}/g);
  if (!arr) return new Uint8Array();
  return Uint8Array.from(arr.map((byte) => parseInt(byte, 16)));
};

export default defineComponent({
  mixins: [ CommonProps ],
  created() {

  },
  data() {
    return {
      usingFaucet: false,
    };
  },
  methods: {
    async getFHETokenBalance(provider: ethers.BrowserProvider, address: string) : Promise<number> {
      try {
        if (this.fheClient !== null && this.activeContract !== null) {
          let permit = await getPermit(appConfig.ENC_ERC20_CONTRACT, provider);
          this.fheClient.storePermit(permit);
         
          const encryptedBalance = await this.activeContract.balanceOfEncrypted(this.fheClient.extractPermitPermission(permit));
          const balance = this.fheClient.unseal(appConfig.ENC_ERC20_CONTRACT, encryptedBalance).toString();
          return Number(balance);
  
        }
      } catch (err) {
        console.log(err);
      }
      return 0;
    }, 

    async getCoins(address: string): Promise<any> {
      try {
        const result = await this.$axios.get(`${appConfig.FAUCET_ENDPOINT}?address=${address}`);
        console.log(result);

        if (result.status !== 200) {
          throw new Error(`Failed to get coins from faucet`);
        }
        return result;
      } catch (err) {
        console.log(err);
      }
      return "";
    },
  },
});
