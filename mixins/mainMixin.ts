
import { MetaMaskSDK } from '@metamask/sdk';
import CommonProps from '@/mixins/CommonProps'

import FHEMixin from '../mixins/fhe';
import globalMixin from '../mixins/globalMixin';

//import Web3 from 'web3'
import { ethers } from "ethers";

import ABI from '../assets/erc20.json';
import appConfig from '../config/appConfig.json'

import encryptionOn from '../assets/lottie/encryption-on.json'
import audioFile from '~/assets/audio/encryption-on.mp3'

import { FhenixClient, getPermit } from "fhenixjs";


// They should be non-reactive variables
var browserProvider: ethers.BrowserProvider;
var web3Signer: ethers.JsonRpcSigner;
var mmsdk: MetaMaskSDK;
var metamask: any;

const fromHexString = (hexString: string): Uint8Array => {
  const arr = hexString.replace(/^(0x)/, '').match(/.{1,2}/g);
  if (!arr) return new Uint8Array();
  return Uint8Array.from(arr.map((byte) => parseInt(byte, 16)));
};

type ValidationRule = (value: number) => boolean | string;
 interface iVue3Lottie {
  playSegments(segment: [number, number], forceFlag: boolean): void;
 }

export default defineComponent({
  mixins: [CommonProps, FHEMixin, globalMixin],    
  
  data() {
    const amountRules: ValidationRule[] = [
      value => {
        if (value) return true
        return 'Amount is required.'
      },
      value => {
        if (value > 0) {
          if (value % 1 != 0) {
            return 'Decimal numbers are not allowed'
          }
          return true;
        }
        return 'Amount must be greater than 0.'
      }
    ];

    const recipientRules: ValidationRule[] = [
      value => {
        if (value) return true
        return 'Recipient is required.'
      }
    ];
    
    return {
      mmDeepLink: "https://demo.fhenix.zone",
      enableEncryption: false,
      encryptionOn: encryptionOn,
      showEncryptionAnimation: false,
      showSendTokensScreen: false,
      pageIdx: 0,
      account: "",
      balance: -1 as number,
      walletBalance: 0,
      walletBalanceChecking: false,
      recipientAddress: "",
      loadingContract: false,
      minting: false,
      info: "", 
      showSend: false,
      transferring: false,
      explorer: appConfig.BLOCK_EXPLORER,
      showEncryptionInfo: true,
       
      amountRules,
      recipientRules,
      audioSource: audioFile,
      history: new Map(),
      historyHeaders: [
        { text: 'Transaction', value: 'tx' },
        { text: 'Encrypted', value: 'encrypted' },
        { text: 'Status', value: 'status' }
      ]
    }
  }, 

  created() {
    console.log(`Created!`);
    console.log(appConfig);
  },
  mounted() {
    var self = this;
    const asyncMount = async () => {
      mmsdk = new MetaMaskSDK();
      await mmsdk.init();
      console.log(mmsdk);
      metamask = mmsdk.getProvider(); // You can also access via window.ethereum
  
      var connectedBefore = window.localStorage.getItem('connectedBefore');
      if (connectedBefore) {
        self.connect();
      }
  
      var alreadySawTip = window.localStorage.getItem('alreadySawTip');
      if (alreadySawTip) {
        self.showEncryptionInfo = false;
      }
      self.loadHistory();
  
    }
    asyncMount();
  },

  watch: {
    enableEncryption(state) {
      var self = this;
      this.showEncryptionAnimation = true;
      let bgVideo = document.getElementById("background-video");
      let cssName = "enc-bg";
      if (state === true) {
        setTimeout(() => {
          const lottieAnimation = self.$refs.lottieEncryptionOnAnimation as iVue3Lottie;
          lottieAnimation.playSegments([50, 100], true); //.goToAndPlay(50);
          setTimeout(() => { 
            try {
              (self.$refs.audioPlayer as HTMLAudioElement).play(); 
            } catch {}
            
          }, 300);
        }, 300);
        // let audio = new Audio('../assets/audio/encryption-on.mp3');   
        // audio.play();
        bgVideo!.classList.add(cssName);
      } else {
        bgVideo!.classList.remove(cssName);
      }
      this.toggleTheme();
      this.loadContract();
    }
  },
  computed: {
    
    isMobile() {
      return this.$global.isMobile();
    },

    historyItems() {
      return Array.from(this.history.values()).reverse();
    },

    contractAddress() {
      return this.enableEncryption ? appConfig.ENC_ERC20_CONTRACT : appConfig.NON_ENC_ERC20_CONTRACT;
    },
    colorScheme() {
      return {
        ButtonColor: this.enableEncryption ? "#FC4A1A" : "primary"
        //ButtonTextColor: 
      }
    },

    showProgress() {
      if (this.info === "") {
        return false
      } else if (this.info.indexOf("Error:") !== -1) {
        return false;
      }
      return true;
    },
    
    isConnected() {
      return this.account !== '';
    },

    showLowTokenWarning() {
      return this.walletBalance < 0.01;
    }


  },
  methods: {
    openExplorer(tx: string) {
      window.open(this.explorer + '/tx/' + tx + '/raw-trace', "_blank");
    },
    shortAddress(address: string) {
      if (address !== undefined && address !== "") {
        return address.slice(0, 9) + '…' + address.slice(address.length - 6);
      }
      return "";
    },    
    async connect() {
      let chainId = '0x' + (Number(appConfig.CHAIN_ID)).toString(16);
      //chainId = ethers.utils.hexStripZeros(chainId);
      let accounts = await window.ethereum.request({ method: 'eth_requestAccounts', params: [] });
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain', 
            params: [{ chainId: chainId }] 
          });
        } catch (err) {
          console.log({
            chainId: chainId,
            chainName: 'Fhenix Network New',
            rpcUrls: [appConfig.RPC_DEFAULT_ENDPOINT],
            nativeCurrency: {
              name: "FHE Token",
              symbol: "tFHE",
              decimals: 18
            },
            blockExplorerUrls: [appConfig.BLOCK_EXPLORER]
          })
          await window.ethereum.request({ 
            method: 'wallet_addEthereumChain', 
            params: [
            {
                chainId: chainId,
                chainName: 'Fhenix Network New',
                rpcUrls: [appConfig.RPC_DEFAULT_ENDPOINT],
                nativeCurrency: {
                  name: "FHE Token",
                  symbol: "tFHE",
                  decimals: 18
                },
                blockExplorerUrls: [appConfig.BLOCK_EXPLORER]
              }
            ] 
          }); 
        }
        browserProvider = new ethers.BrowserProvider(window.ethereum!)
        web3Signer = await browserProvider.getSigner();
        this.fheClient = new FhenixClient({ provider: browserProvider });
        window.ethereum.on('accountsChanged', async (accounts: any) => {
          console.log("accountsChanged");
          this.account = accounts[0];
          this.balance = await this.getTokenBalance();
          this.getWalletBalance();
        }); 


        window.localStorage.setItem('connectedBefore', '1');
        this.getWalletBalance();
        this.loadContract();
      }
    },

    hexToBytes(hex: String) {
      for (var bytes = [], c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substring(c, c + 2), 16));
      }
      return bytes;
    },

    saveHistory() {
      const obj = Object.fromEntries(this.history);
      window.localStorage.setItem('transactionHistory', JSON.stringify(obj));
    },

    loadHistory() {
      const obj = JSON.parse(window.localStorage.getItem('transactionHistory') || '{}');
      this.history = new Map(Object.entries(obj));
    },

    clearHistory() {
      this.history.clear();
      this.saveHistory();
    },

    updateStatus(tx: string, newStatus: string) {
      if (this.history.has(tx)) {
        let entry = this.history.get(tx);
        if (entry) {
          entry.status = newStatus;
          this.history.set(tx, entry);
        }
        this.saveHistory();
      }
    },


    async mintToken(amount: number) {
      if (this.activeContract !== null && this.fheClient) {
        this.minting = true;
        try {
          var tx = null as ethers.TransactionResponse | null;
          if (this.enableEncryption) {
            this.info = "Minting; Encrypting amount...";
            console.log("Encrypting...");
            let mintAmount = (await this.fheClient.encrypt_uint32(amount)).data;
            console.log("=== mintAmount ===")
            console.log(typeof mintAmount);
            console.log(mintAmount);
            console.log("=== mintAmount ===")
            this.info = "Minting; Sending transaction...";
            
            const inEuint32Amount = {
              data: `0x${Array.from(mintAmount).map(b => b.toString(16).padStart(2, '0')).join('')}`
            }
            console.log("--- inEuint32Amount ---")
            console.log(inEuint32Amount);
            console.log("--- inEuint32Amount ---")
            tx = await this.activeContract.mintEncrypted(inEuint32Amount);
          } else {
            this.info = "Minting; Sending transaction...";
            tx = await this.activeContract.mint(amount);
          }

          if (tx !== null) {
            console.log(tx);
            this.history.set(tx.hash, {
              tx: tx.hash,
              encrypted: this.enableEncryption,
              status: "Pending",
              action: "Mint"
            });
            this.saveHistory();
            this.info = "Minting; Waiting for confirmation...";
            
            tx.wait().then(async (receipt: null | ethers.TransactionReceipt) => {
              this.updateStatus(tx!.hash, "Success");
              this.minting = false;
              console.log("Mint Successful!")
              console.log(receipt);
              this.balance = await this.getTokenBalance();
              this.info = "";
            }).catch((err) => {
              this.minting = false;
              this.updateStatus(tx!.hash, "Failed");
              console.log("handleClick Error: ", err)
              this.info = "Error: Mint Failed!";
            });
            this.getWalletBalance();            
          }
        } catch (err) {
          this.minting = false;
          this.info = "Error: Mint failed";
          console.log(err);
        }

      }
    },

    async getWalletBalance() {
      console.log("Checking balance...")
      let balance = await browserProvider.getBalance(this.account);
      this.walletBalance = parseFloat(ethers.formatEther(balance));
    },

    async requestCoinsFromFaucet() {
      var self = this;
      this.usingFaucet = true;
      var myCurrentBalance = this.walletBalance;
      let answer = await this.getCoins(this.account);
      if (answer.result === "success") {
        const checkBalance = async () => {
          await self.getWalletBalance();
          if (myCurrentBalance == self.walletBalance) {
            setTimeout(()=> {
              console.log("Checking balance...");
              checkBalance();
            }, 1000);
          } else {
            self.walletBalanceChecking = false;
          }
        }
        self.usingFaucet = false;
        self.walletBalanceChecking = true;
        checkBalance();
      } else {
        self.usingFaucet = false;

        // error here
      }
    },

    async getTokenBalance(): Promise<number> {
      let balance = -1;
      if (this.activeContract === null) {
        console.log("Please load contract");
        return balance;
      }
      this.loadingContract = true;
      
      try {
        this.info = "Querying balance from contract..."
        if (this.enableEncryption) {
          balance = await this.getFHETokenBalance(browserProvider, this.account);
        } else {
          let result = await this.activeContract.balanceOf(this.account);
          balance = parseFloat(result);
        }
      } catch (err) {
        this.info = "Error: Cannot read balance (does account exist?)";
        console.error("Balance error");
        console.error(err);
      }
      this.loadingContract = false;
      this.info = "";
      if (balance > 0) {
        this.pageIdx = 1;
      } else {
        this.pageIdx = 0;
      }

      return balance;
    },

    copyToClipboard(what: string) {
      navigator.clipboard.writeText(what);
    },

    async loadContract() {
      this.loadingContract = true;
      this.info = "Loading contract...";
      this.activeContract = new ethers.Contract(this.contractAddress, ABI.abi, web3Signer);
      try {
        this.balance = await this.getTokenBalance();
      } catch (err) {}
      if (this.balance > 0) {
        this.pageIdx = 1;
      } else {
        this.pageIdx = 0;
      }
      this.loadingContract = false;
    },

    async sendTokens() {
      let recipient = (this.$refs.recipient as HTMLInputElement).value.trim();
      let amount = Number((this.$refs.amount as HTMLInputElement).value);
      
      if (amount <= 0 || recipient === "") {
        return;
      }
      
      if (this.activeContract !== null && this.fheClient) {
        try {
          this.showSend = false;
          this.transferring = true;  
          var tx = null as ethers.TransactionResponse | null;
          if (this.enableEncryption) {
            this.info = "Token Transfer; Encrypting amount...";
            console.log("Encrypting amount...");
            console.log(typeof amount);
            console.log(amount);
            let sendAmount = (await this.fheClient.encrypt_uint32(amount)).data;
            const inEuint32Amount = {
              data: `0x${Array.from(sendAmount).map(b => b.toString(16).padStart(2, '0')).join('')}`
            }
            this.info = "Token Transfer; Sending transaction...";
            console.log("Token Transfer; Sending transaction...");
            tx = await this.activeContract.transferEncrypted(recipient, inEuint32Amount);
          } else {
            this.info = "Token Transfer; Sending transaction...";
            tx = await this.activeContract.transfer(recipient, amount);
          }
          this.info = "Token Transfer; Waiting for confirmation...";
          if (tx) {
            this.history.set(tx.hash, {
              tx: tx.hash,
              encrypted: this.enableEncryption,
              status: "Pending",
              action: "Send Tokens"
            });
            this.saveHistory();
            console.log(tx);            
            tx.wait().then(async (receipt) => {
              this.updateStatus(tx!.hash, "Success");
              this.transferring = false;
              console.log("Transfer Successful!");
              console.log(receipt);
              this.info = "";
              this.balance = await this.getTokenBalance();
            }).catch((err) => {
              this.updateStatus(tx!.hash, "Failed");
              this.transferring = false;
              console.log("handleClick Error: ", err)
              console.log("Transfer Failed!");
              this.info = "Transfer Failed!";
            });
          }
          this.getWalletBalance();    
        } catch (err) {
          console.log(err);
          this.transferring = false;
          this.info = "Error: Transfer failed!";
        }
      }
    },

    async wrapTokens() {
      let amount = Number((this.$refs.wrapAmount as HTMLInputElement).value);
      if (amount <= 0 || amount > this.balance ) {
        return;
      }
      
      let wrappingText = this.enableEncryption ? "Unwrap" : "Wrap";
            
      if (this.activeContract !== null) {
        try {
          this.info = `Token ${wrappingText}ping; Waiting for confirmation...`;
          console.log(`Token ${wrappingText}ping...`);
          
          var tx =  (this.enableEncryption ? await this.activeContract.unwrap(amount) : await this.activeContract.wrap(amount) );
          
          if (tx) {
            this.history.set(tx.hash, {
              tx: tx.hash,
              encrypted: false,
              status: "Pending",
              action: `${wrappingText} Tokens`
            });
            this.saveHistory();
            console.log(tx);            
            tx.wait().then(async (receipt: null | ethers.TransactionReceipt) => {
              this.updateStatus(tx.hash, "Success");
              this.transferring = false;
              console.log(`${wrappingText}ping Successful!`);
              console.log(receipt);
              this.info = "";
              this.balance = await this.getTokenBalance();
            }).catch((err: any) => {
              this.updateStatus(tx.hash, "Failed");
              this.transferring = false;
              console.log("handleClick Error: ", err)
              console.log(`${wrappingText}ping Failed!`);
              this.info = `${wrappingText}ping Failed!`;
            });
          }
          
          var self = this;
          setTimeout(()=> {
            (self.$refs.wrapAmount as HTMLInputElement).value = "";
          }, 300);
          
          this.getWalletBalance();   
        } catch (err) {
          console.log(err);
          this.transferring = false;
          this.info = `Error: ${wrappingText}ping failed!`;
        }
      }

    },

    toggleEncryption() {
      this.enableEncryption = !this.enableEncryption;
      if (this.enableEncryption) {
        let audio = new Audio(require('~/assets/audio/encryption-on.mp3'));   
        audio.play();
      }
    },

    encryptionAnimationComplete() {
      console.log("Animation Complete!")
      this.showEncryptionAnimation = false;
    }
  }  

});


