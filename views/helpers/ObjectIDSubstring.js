var ObjectIDSubstring;

ObjectIDSubstring = function (data, length) { 
    var Stringlength = data.toString().length;
    return data.toString().substring(Stringlength - parseInt(length), Stringlength)
};

module.exports = ObjectIDSubstring;
