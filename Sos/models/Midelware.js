const jwt = require('jsonwebtoken');

module.exports = async function authentification(req,res,next){
    try{
        // Extract the token from the authentification header
        const token = req.headers.authorization.split(" ")[1];
        // Verify the token has the secreat key
        jwt.verify(token , "sahara" , (err,userData)=>{
            if(err){
                // IF token is not valid send authentication failed response
                res.status(401).json({message : "Authentication failed"}); 
            }else{
                req.user = userData;
                next();
            }
        })
    }catch(err){
        res.status(401).json({message : "Authentication failed"});
    }

}