const mysql = require('mysql');
const Web3 = require('web3');
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('config.json'))
const web3 = new Web3(new Web3.providers.HttpProvider(config.infuraurl))
  
function getABI(contractAddress) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "kenniex_token"
        });
        connection.connect((err)=> {
            if (err) return reject(new Error('Connect error!'));
            connection.query(`SELECT abi FROM token WHERE address = '${contractAddress}'`, (err, result)=> {
                if (err) return reject(err);
                else{
                    abi = JSON.parse(result[0].abi)
                    return resolve(web3.eth.contract(abi).at(contractAddress));
                }
            });
            // connection.destroy();
        });
    });
}
module.exports = getABI;