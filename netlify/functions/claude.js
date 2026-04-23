const https = require("https");
exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {statusCode:200,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"},body:""};
  }
  if (event.httpMethod !== "POST") {
    return {statusCode:405,body:"Method Not Allowed"};
  }
  const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Content-Type":"application/json"};
  try {
    const body = JSON.parse(event.body);
    const payload = JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:body.max_tokens||1000,system:body.system,messages:body.messages});
    const data = await new Promise((resolve,reject) => {
      const req = https.request({hostname:"api.anthropic.com",path:"/v1/messages",method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(payload),"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"}},(res) => {
        let raw = "";
        res.on("data",(chunk) => (raw += chunk));
        res.on("end",() => {
          try {resolve({status:res.statusCode,body:JSON.parse(raw)});}
          catch(e){reject(new Error("Failed to parse: "+raw));}
        });
      });
      req.on("error",reject);
      req.write(payload);
      req.end();
    });
    if (data.status !== 200) {
      return {statusCode:data.status,headers,body:JSON.stringify({error:data.body})};
    }
    return {statusCode:200,headers,body:JSON.stringify(data.body)};
  } catch(err) {
    return {statusCode:500,headers,body:JSON.stringify({error:err.message})};
  }
};
