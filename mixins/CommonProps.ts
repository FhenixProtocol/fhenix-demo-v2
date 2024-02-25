import { defineComponent } from 'vue';
import { FhenixClient } from "fhenixjs";
import { ethers } from "ethers";


export default defineComponent({
  computed: {
  },
  data() {
    return {
      fheClient: null as FhenixClient | null,
      activeContract: null as ethers.Contract | null,

    }
  }
});