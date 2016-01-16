var http = require('http');
var qs = require('querystring');  
var fs = require('fs')
var debug = true;
var silent = false;

var cookieManger = {};

function getTimeStamp() {
	return new Date().getTime();
}

function getCaptchaId(cb) {
	var hostname = 'api.open.uc.cn';
	
	var urlparam = {
		captchaId:'',
		callback:'',
		_:getTimeStamp()
	};
	
	var path = '/cas/commonjson/refreshCaptchaByIframe?' + qs.stringify(urlparam);
		
	if (debug) {
		console.log('[getCaptchaId] url:' + hostname + path);
	}
	
	var options = {
		hostname:hostname,
		path:path,
		method:'get'
	};
	
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		
		if(!silent) {
			console.log('[getCaptchaId] status:' + statusCode);
		}
		
		res.on('data', function (chunk) {  
			cb(chunk);
		});
	});

	req.on('error', function (e) {
		console.log('[getCaptchaId] problem with request: ' + e.message);
	});
	
	req.end();
}

function getCaptcha(captchaId,cb) {
	var hostname = 'api.open.uc.cn';
	var urlparam = {
		captchaId:captchaId
	};
	
	var path = '/cas/commonjson/captcha?' +  qs.stringify(urlparam);
	
	if (debug) {
		console.log('[getCaptcha] url:' + hostname + path);
	}
	
	var options = {
		hostname:hostname,
		path:path,
		method:'get'
	};
	
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		
		if(!silent) {
			console.log('[getCaptcha] status:' + statusCode);
		}
		
		var writestream = fs.createWriteStream('temp.png');
        writestream.on('close', function() {
            cb();
        });
        res.pipe(writestream);
	});

	req.on('error', function (e) {
		console.log('[getCaptcha] problem with request:' + e.message);
	});
	
	req.end();
	
}

function login(name,pass,code,codeId,cb) {
	var hostname = 'api.open.uc.cn';
	var urlparam = {
		v:'1.1',
		client_id:'54',
		request_id:getTimeStamp()
	};
	
	var path = '/cas/loginByIframe?' + qs.stringify(urlparam);
	if(debug) {
		console.log('[login] url:' + hostname + path);
	}
	
	var options = {
		hostname: hostname,
		path:path,
		method: 'POST',
		headers: {  
            "Content-Type": 'application/x-www-form-urlencoded'
        }  
	};
	
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		praseCookie(cookies);
		if(!silent) {
			console.log('[login] status:' + statusCode);
		}
		res.on('data', function (chunk) {  
			cb(chunk);
		});
	});
	
	req.on('error', function (e) {
		console.log('[login] problem with request:' + e.message);
	});

	
	var content = {
		login_name:name,
		password:pass,
		captcha_code:code,
		captcha_id:codeId
	};
	var postdata = qs.stringify(content);
	
	if(debug) {
	    console.log('[login] post data:' + postdata);
	}
	req.write(postdata +  '\n');
	req.end();
	
}

function praseCookie(cookies) {
	cookies.forEach(function(cookie) {
		var parts = cookie.split(';')[0].split('=');
		cookieManger[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
	});
	
	if(debug) {
		console.log('======= [praseCookie] cookies =======');
		console.log(cookieManger);
		console.log('=====================================');
	}
}




exports.login = login;
exports.getCaptchaId = getCaptchaId;
exports.getCaptcha = getCaptcha;