var subtext;

subtext = function (data, length, ext) { 
    if(data=='' || data==null){
        return ''
    }
    return data.toString().substring(0, length) + ext
};

module.exports = subtext;
