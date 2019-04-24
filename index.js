const bip39 = require('bip39')
const HDWallet = require('ethereum-hdwallet')
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const util = require('ethereumjs-util'); 
const bodyParser = require("body-parser");
const express = require('express')
const app = express()
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('config.json'))
  
const web3 = new Web3(new Web3.providers.HttpProvider(config.infuraurl))
const contract = web3.eth.contract(config.abi).at(config.smaddr)

function saveLog(json){
    fs.readFile('log.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } 
        else {
            var datetime = new Date().toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_chi_minh'
            });
            obj = JSON.parse(data); 
            obj.data.push({time:datetime, data:json});
            json = JSON.stringify(obj);
            fs.writeFile('log.json', json, 'utf8', (err,data)=>{
                if (err){
                    console.log(err);
                } 
                else{
                    console.log('Saved to log file')
                }
            });
        }
    })
}
function sendSigned(txData, privateKey, cb) {
    const privateKeyHex = Buffer.from(privateKey, 'hex')
    const transaction = new Tx(txData)
    transaction.sign(privateKeyHex)
    const serializedTx = transaction.serialize().toString('hex')
    web3.eth.sendRawTransaction('0x' + serializedTx, cb)
    
}
function getTransactionByHash(txHash){
    try{
        var transactionInfo= web3.eth.getTransaction(txHash)
        if(transactionInfo!=null){
            transactionInfo.gasPrice = transactionInfo.gasPrice.toNumber()
            transactionInfo.value = transactionInfo.value.toNumber()
            return {
                code:true,
                message:'Success',
                data: transactionInfo
            }
        }
        else{
            return {
                code:false,
                message:'Can not find transaction by tx ',
                data: ''
            }
        }
    }
    catch(err){
        return {
            code:false,
            message:'Can not find transaction',
            data: err.message
        }
    }
}

app.post('/send-token',urlencodedParser, function (req, res) {
    var prv = req.body.privatekey
    var amount = parseFloat(req.body.amount)*1e18
    var from = req.body.from
    var to = req.body.to
    var gasPrice = req.body.gas*1e9;
    var txCount = web3.eth.getTransactionCount(from)
    var data = contract.transfer.getData(to, amount, {from: config.smaddr}) 
    const txData = {
        nonce: util.bufferToHex(util.setLengthLeft(txCount, 0)),
        gasLimit: util.bufferToHex(util.setLengthLeft(config.gasLimit, 0)),
        gasPrice: gasPrice,//util.bufferToHex(util.setLengthLeft(config.gasPrice, 0)),
        from:from,
        to: config.smaddr,
        data: data,
        value: 0
    }
    console.log(txData)
    sendSigned(txData, prv, function (err, result) {
        if (err) {
            saveLog(result)
            return res.send({
                code:false,
                message:'error',
                data:''
            })
        }
        else{
            var data = getTransactionByHash(result)
            // saveLog(data)
            return res.send({
                code:true,
                message:'success',
                data:{
                    detail:data
                }
            })
        }
        
    })

});


app.post('/balance',urlencodedParser, function (req, res) {
    try{
        var address = req.body.address
        var data = contract.balanceOf(address)
        res.send({
            code:true,
            message:'success',
            data : {
                balance:data.toNumber()/Math.pow(10,18)
            }
        })
    }
    catch(err){
        res.send({
            code:false,
            message:'Error',
            data: err.message
        })
    }
});

app.post('/eth-balance',urlencodedParser, function (req, res) {
    try{
        var address = req.body.address
        var balance = web3.eth.getBalance(address); 
        res.send({
            code:true,
            message:'success',
            data : {balance:balance.toNumber()/Math.pow(10,18)}
        })
    }
    catch(err){
        res.send({
            code:false,
            message:'Error',
            data: err.message
        })
    }
});
app.post('/get-address',urlencodedParser, function (req, res) {
    const mnemonic = bip39.generateMnemonic(256)
    const hdwallet = HDWallet.fromMnemonic(mnemonic)
    const derivationPath = "m/44'/60'/0'/0/0";
    const address = '0x' + hdwallet.derive(derivationPath).getAddress().toString('hex');
    const publickey = '0x'+hdwallet.derive(derivationPath).getPublicKey().toString('hex')
    const privatedkey = '0x'+hdwallet.derive(derivationPath).getPrivateKey().toString('hex')
    res.send({
        code:true,
        message:'success',
        data:{
            mnemonic,
            derivationPath,
            address,
            publickey,
            privatedkey
        }
    })
})


app.post('/get-more-address',urlencodedParser, function (req, res) {
    const mnemonic = bip39.generateMnemonic(256)
    const hdwallet = HDWallet.fromMnemonic(mnemonic)
    const derivationPath = "m/44'/60'/0'/0";

    const mywallet = hdwallet.derive(derivationPath)
    var arrayAddress = [];

    for(var i= 1; i<=10000; i++){
        var path = mywallet.derive(i).hdpath()
        var address = '0x'+mywallet.derive(i).getAddress().toString('hex') 
        var publickey = mywallet.derive(i).getPublicKey().toString('hex')
        var privatedkey = mywallet.derive(i).getPrivateKey().toString('hex')

        arrayAddress.push({
            path,
            address,
            publickey,
            privatedkey
        })
    }
    

    res.send({
        code:true,
        message:'success',
        data:{
            mnemonic,
            arrayAddress
        }
    })
})


// var json = JSON.stringify({sd:1,gf:3})
// fs.appendFile('log.json', json+'\r\n', function (err) {
//     if (err) throw err;
//     console.log('Saved!');
// });

// var prv = ''
// var amount = parseFloat(1000)*1e18
// var from = '0xA380328631F8DF2Cd4A2bd23aD12689790181224'
// var to = '0x81c2c661b27c83993c53bdd7407afddf90419194'
// var gasPrice = 5*1e9;
// var txCount = web3.eth.getTransactionCount(from)
// var data = contract.transfer.getData(to, amount, {from: config.smaddr}) 
// const txData = {
//     nonce: util.bufferToHex(util.setLengthLeft(txCount, 0)),
//     gasLimit: util.bufferToHex(util.setLengthLeft(config.gasLimit, 0)),
//     gasPrice: gasPrice,//util.bufferToHex(util.setLengthLeft(config.gasPrice, 0)),
//     from:from,
//     to: config.smaddr,
//     data: data,
//     value: 0
// }
// console.log(txData)
// sendSigned(txData, prv, function (err, result) {
//     if (err) {
//         saveLog(result)
//         return res.send({
//             code:false,
//             message:'error',
//             data:''
//         })
//     }
//     else{
//         var data = getTransactionByHash(result)
//         // saveLog(data)
//         return res.send({
//             code:true,
//             message:'success',
//             data:{
//                 detail:data
//             }
//         })
//     }
    
// })



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Running on port 3000')
})


// const Wallet = require('ethereumjs-wallet');
// const EthUtil = require('ethereumjs-util');
// const privateKeyBuffer = EthUtil.toBuffer(privatedkey);
// const walletRecovery = Wallet.fromPrivateKey(privateKeyBuffer);
// const publicKeyFromPrivatedKey = walletRecovery.getPublicKeyString();
// const addressFromPrivatedKey = walletRecovery.getAddressString();


