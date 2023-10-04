const firebaseConnection = require('../config/firebaseConnection');  // reference to our db 
require("firebase/storage"); // must be required for this to work
const { ref, uploadBytesResumable, getDownloadURL } = require("firebase/storage");

global.XMLHttpRequest = require("xhr2"); // must be used to avoid bug

// Add Image to Storage and return the file path
const putStoreImage = async (req, res, next) => {
  if(req.file){
    try {
        const file = req.file;

        const timestamp = Date.now();
        const name = file.originalname.split(".")[0];
        const type = file.originalname.split(".")[1];
        const fileName = `${name}_${timestamp}.${type}`;

        const imageRef = await ref(firebaseConnection, fileName);
        const metatype = { contentType: file.mimetype, name: fileName };
        const uploadTask = await uploadBytesResumable(imageRef, file.buffer, metatype);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        
        req.imageURL = downloadURL;
        next();
     }  catch (error) {
        console.log (error)
        res.status(400).send(error.message);
    }
  } else {
    req.imageURL = null;
    next();
  }
}

module.exports = {
    putStoreImage
}