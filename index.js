var axios = require("axios");
var bitcore = require("bitcore-lib");
var crypto = require("crypto");
const HDMW = require('@oipwg/hdmw')
var bip39 = require('bip39')

// const pKey = new bitcore.PrivateKey("testnet").toWIF();

// console.log("key: ", pKey);

var privateKey = bitcore.PrivateKey.fromWIF(
  "cNwZautGN2zoHrEsnz21549dcbCt6DoLt2DwGmXapcb5z5BtwS2Z"
);

var sender_address = privateKey.toAddress();
console.log("sender address", sender_address.toString());


const sendBitcoin = async (recieverAddress, amountToSend) => {
  const sochain_network = "BTCTEST";
  const sourceAddress = sender_address.toString();
  const satoshiToSend = amountToSend * 100000000;
  let fee = 0;
  let inputCount = 0;
  let outputCount = 2;
  const utxos = await axios.get(
    `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
  );
  const transaction = new bitcore.Transaction();
  let totalAmountAvailable = 0;

  let inputs = [];
  utxos.data.data.txs.forEach(async (element) => {
    let utxo = {};
    utxo.satoshis = Math.floor(Number(element.value) * 100000000);
    utxo.script = element.script_hex;
    utxo.address = utxos.data.data.address;
    utxo.txId = element.txid;
    utxo.outputIndex = element.output_no;
    totalAmountAvailable += utxo.satoshis;
    inputCount += 1;
    inputs.push(utxo);
  });

  transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
  // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

  fee = transactionSize * 20;
  if (totalAmountAvailable - satoshiToSend - fee < 0) {
    throw new Error("Balance is too low for this transaction");
  }

  //Set transaction input
  transaction.from(inputs);

  // set the recieving address and the amount to send
  transaction.to(recieverAddress, Math.ceil(satoshiToSend));

  // Set change address - Address to receive the left over funds after transfer
  transaction.change(sourceAddress);

  //manually set transaction fees: 20 satoshis per byte
  transaction.fee(fee * 20);

  // Sign transaction with your private key
  transaction.sign(privateKey);

  // serialize Transactions
  const serializedTransaction = transaction.serialize();
  // Send transaction
  const result = await axios({
    method: "POST",
    url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
    data: {
      tx_hex: serializedTransaction,
    },
  });

  return result.data.data;
};

var randStr = crypto.randomBytes(6).toString('hex');

var value = Buffer.from(randStr);

var hash = bitcore.crypto.Hash.sha256(value);
var bn = bitcore.crypto.BN.fromBuffer(hash);
var address2 = new bitcore.PrivateKey(bn, "testnet").toAddress();

console.log("receiving address : ", address2.toString());

sendBitcoin(address2.toString(), 0.0003);

//Generate HD Wallet
// const Wallet = HDMW.Wallet;

// const mnemonic = bip39.generateMnemonic()
// console.log(mnemonic)

// const myWallet = new Wallet(mnemonic)

// const bitcoin = myWallet.getCoin('bitcoin')

// const myMainAddress = bitcoin.getMainAddress()

// console.log("My Wallets Bitcoin Main Address: ", myMainAddress.getPublicAddress());