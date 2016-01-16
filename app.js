var api = require('./api.js');

api.getCaptcha();
api.login();
api.setServiceTicket();
api.setLn();
api.getDirInfo('1');


var fsReadFile_deferd = function(file,encoding){
  var deferred = Q.defer();
  FS.readFile(file,encoding,function(error,result){
  if(error){
    deferred.reject(error.toString().red);
  }
  deferred.resolve(result);
});

return deferred.promise;
};

fsReadFile_deferd(file).then(function(result){
  console.log("invoke in deferd".red);
  console.log(result.toString().green);
},function(error){
  console.log("invoke in deferd".red);
  console.log(error.toString().red);
}
);