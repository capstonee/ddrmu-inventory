const fs = require("fs")

const routes = []
const mainDirectory = fs.readdirSync(__dirname + '/')

mainDirectory.forEach(function(file) {
    if(!file.includes(".")){
        retrieveSubDirectory(file)
    }
});



function retrieveSubDirectory(path){
    let subDirectory = fs.readdirSync(__dirname+"/"+path)

    subDirectory.forEach(file => {
        if(file.match(/\.js$/)!==null && file.includes("endpoints"))
            routes.push(require(`./${path}/endpoints.js`).endpoints)

        else if(!file.includes("."))
            retrieveSubDirectory(`${path}/${file}`)
    })
}


module.exports = routes