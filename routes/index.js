const router = require('express').Router();
const multer = require('multer');
const upload = multer();
const jwt = require('jsonwebtoken');
const mongodb = require('mongodb');
const {GridFSBucket} = require('mongodb');

/**
 * req.query
 * filename: [required]
 */
router.get('/token', (req, res)=>{
    jwt.sign({filename: req.query.filename},"thebestsecretever", {expiresIn: 600}, (err, token)=>{
        return res.json({token});
    });
});


router.post('/upload',upload.single('photo') , (req, res)=>{
    mongodb.connect('mongodb://localhost:27017', (err, client)=>{
        if(err){
            //db connection error
            return res.json({sucess: false, msg: "cannot connect to DB"});
        }else{
            let test = client.db('test');
            let photoBucket = new GridFSBucket(test, {bucketName: "photoBucket"});
            let writeStream = photoBucket.openUploadStream(req.file.originalname);
            writeStream.write(req.file.buffer);
            writeStream.end();
            writeStream.on('finish', ()=>{
                client.close();
                return res.json({sucess: true});
            });
        }
        
    });  
});

router.get('/download', (req, res)=>{
    jwt.verify(req.query.token, 'thebestsecretever', (tokenErr, decoded)=>{
        if(tokenErr){
            //invalid token
            res.json({sucess: false, msg: "Invalid token"});
        }else{
            mongodb.connect('mongodb://localhost:27017', (err, client)=>{
                if(err){
                    //db connection error
                    res.json({sucess: false, msg: "cannot connect to DB"});
                }else{
                    let test = client.db('test');
                    let photoBucket = new GridFSBucket(test, {bucketName: "photoBucket"});
                    let readStream = photoBucket.openDownloadStreamByName(req.query.filename);
                    readStream.pipe(res);
                    readStream.end();
                    client.close();
                }
            });
        }
    });  
});


module.exports = router;