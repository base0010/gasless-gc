import 'dotenv/config'
const accessToken = process.env.ACCESS_TOKEN
const url = process.env.ENGINE_URL

const backendWallet = "0x2289351FBE9310ab9291B3D416d0241A8b2de07B"
const chainId = "1"
const contractAddress = process.env.ERC20PERMIT_ADDRESS

const balance = await fetch(
    `${url}/contract/80002/0xc8be6265C06aC376876b4F62670adB3c4d72EABA/read?functionName=balanceOf`,
    {
        headers:{
            authorization: `Bearer ${accessToken}`,
        },
    },
)

const resp = await fetch(
   `${url}/backend-wallet/get-all`, 
   {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
   }
);


const walletBalance = await fetch(
    `${url}/backend-wallet/80002/0x2289351fbe9310ab9291b3d416d0241a8b2de07b/get-balance`,
    {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: `application/json`
        },
    }

)

const getAllRelayers = await fetch(
    `${url}/relayer/get-all`,
    {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: `application/json`
        },
    }

)

// const {result} = await resp.json();
// console.log(result)

// const wb = await walletBalance.json();
// console.log(wb)

const getRelayers = await getAllRelayers.json();
// console.log(getRelayers)

//get first relay
//todo: no scale
const relayerId = getRelayers.result[0].id

console.log(`relayer id: ${relayerId}`)

const postMetaTxFromBackend = await fetch(
    `${url}/relayer${relayerId}`,
    {
        method: "POST",
        body: JSON.stringify({
            "type": "forward",
            "request": {
                "from": "string",
                "to": "string",
                "value": "string",
                "gas": "string",
                "nonce": "string",
                "data": "string",
                "chainid": "string"
            },
            "signature": "string",
            "forwarderAddress": "string"

        })

    }
)
