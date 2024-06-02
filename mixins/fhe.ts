//import appConfig from "../config/appConfig.json";
import { getPermit } from "fhenixjs";
import { defineComponent } from 'vue';
import CommonProps from '@/mixins/CommonProps'
import { ethers } from "ethers";

const config = useRuntimeConfig();


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
          let permit = await getPermit(config.public.ENC_ERC20_CONTRACT, provider);
          this.fheClient.storePermit(permit);
         
          const encryptedBalance = await this.activeContract.balanceOfEncrypted(address, this.fheClient.extractPermitPermission(permit));
          const balance = this.fheClient.unseal(config.public.ENC_ERC20_CONTRACT, encryptedBalance).toString();
          return Number(balance);
  
        }
      } catch (err) {
        console.log(err);
      }
      return 0;
    }, 

    async getCoins(address: string): Promise<any> {
      try {
        const result = await this.$axios.get(`${config.public.FAUCET_ENDPOINT}/get-funds?address=${address}`);
        console.log(result);

        if (result.status !== 200) {
          throw new Error(`Failed to get coins from faucet`);
        }
        return result.data;
      } catch (err) {
        console.log(err);
      }
      return "";
    },
  },
});
