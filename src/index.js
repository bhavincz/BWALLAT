var express = require('express');
var app = express();
var bip39 = require('bip39') 
var crypto = require('crypto')
var bitcoin = require('bitcoinjs-lib');
var bitcore = require('bitcore-lib');
const HDKey = require('hdkey');
var Mnemonic = require('bitcore-mnemonic');
const axios = require("axios");
var bodyParser = require('body-parser');
const { getAddressInfo } = require('bitcoin-address-validation');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// var balance = require('balance-crypto')

// const HDNode = require()

// var address = 'mrt1jaMYRqNcLcztTQkso4DmPCtvbMnwsG';
var server = app.listen(9000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})

app.get('/listUsers',  async function (req, res) 
{
   var code = new Mnemonic(Mnemonic.Words.ENGLISH);
   var mnemonic = code.toString();
   // var data = codeToDetails(code);
   console.log(mnemonic);

   var xpriv = code.toHDPrivateKey(bitcore.Networks.livenet);
   console.log(xpriv.toString());
   var derived = xpriv.derive("m/0/0");
   var privateKey = derived.privateKey;

   var pk = new bitcore.PrivateKey(privateKey.toString(), bitcore.Networks.livenet);
   var privateKeyStr = pk.toString();
   var publicKey = new bitcore.PublicKey(pk);
   var publicKeyStr = publicKey.toString();

   
   address = new bitcore.Address(publicKey, bitcore.Networks.testnet);

   console.log('PrivateKey:',privateKeyStr)
   console.log('Publickey:',publicKeyStr)

   res.send({
      privateKeyStr: privateKeyStr,
      publicKeyStr: publicKeyStr,
      address: address.toString()
    })
});

let address = "myXmp8G64idNMJxo4LxS1qQET55tALDSaf";


app.post('/getBalance',  async function (req, res)
{
  const address = req.body.address;
  res.send(`https://chain.so/api/v2/get_address_balance/BTCTEST/${address}`);
});

app.post('/sendBitcoin', async function (req, res)
{
  let recieverAddress = req.body.recieverAddress;
  let amountToSend = req.body.amountToSend;
  const sochain_network = "BTCTEST"; 
  const privateKey = `85b5481723a66495c3ec0c95f8d11a2255f9ae307040ea0f98f4deeaab34bbb5`;

  const sourceAddress = `msFTKeTtnAUBS1YNQhqQt7oycFTZNPR5c8`; 
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

  fee = transactionSize * 20
  if (totalAmountAvailable - satoshiToSend - fee  < 0) {
    throw new Error("Balance is too low for this transaction");
  }

   transaction.from(inputs);
   transaction.to(recieverAddress, satoshiToSend);
   transaction.change(sourceAddress);
   transaction.fee(fee * 20);
   transaction.sign(privateKey);
   const serializedTransaction = transaction.serialize();

   const result = await axios({
     method: "POST",
     url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
     data: {
       tx_hex: serializedTransaction,
     },
   });
  res.send(result.data.data);
});

// sendBitcoin('mv13DaY2BLvdjBUXSZKe749oBBUegGMEk5', 0.00010000);

// "privateKeyStr": "85b5481723a66495c3ec0c95f8d11a2255f9ae307040ea0f98f4deeaab34bbb5",
// "publicKeyStr": "02ab9a2e89894ad6567b71fc62ec88856979a44c4eaf559f81f763de39ae4915d7",
// "address": "msFTKeTtnAUBS1YNQhqQt7oycFTZNPR5c8"
//Have BTC: mqV4kVXKMFzBZsmmf3uKjiLdwzMSnUixDW
//reciever address: mv13DaY2BLvdjBUXSZKe749oBBUegGMEk5


