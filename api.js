var http = require('http');
var qs = require('querystring');  
var fs = require('fs')
var debug = true;

var cookieManger = {};

function getTimeStamp() {
	return new Date().getTime();
}

function getCaptchaId(cb) {
	var host = 'api.open.uc.cn';
	var data = {
		captchaId:'',
		callback:'',
		_:getTimeStamp()
	};
	
	var content = qs.stringify(data);  
	var getCaptchaIdPath = '/cas/commonjson/refreshCaptchaByIframe?' + content;
		
	
	if (debug) {
		console.log(getCaptchaIdPath);
	}
	
	var options = {
		hostname:host,
		path:getCaptchaIdPath,
		method:'get'
	};
	
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		console.log(statusCode);
		res.on('data', function (chunk) {  
			cb(chunk);
		});
	});

	req.on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});
	

	req.end();
}

function getCaptcha(captchaId,cb) {
	var host = 'api.open.uc.cn';
	var data = {
		captchaId:captchaId
	};
	
	var content = qs.stringify(data);  
	var getCaptchaPath = '/cas/commonjson/captcha?' + content;
	if (debug) {
		console.log(getCaptchaPath);
	}
	
	var options = {
		hostname:host,
		path:getCaptchaPath,
		method:'get'
	};
	
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		var writestream = fs.createWriteStream('temp.png');
        writestream.on('close', function() {
            cb('get Captcha done');
        });
        res.pipe(writestream);
	});

	req.on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});
	

	req.end();
	
}

function login(name,pass,code,codeId,cb) {
	var post_data = {
		login_name:name,
		password:pass,
		captcha_code:code,
		captcha_id:codeId
	};
	var content = qs.stringify(post_data);
	if(debug) {
	    console.log(content);
	}
	
	var param = {
		v:'1.1',
		client_id:'54',
		request_id:getTimeStamp()
	};
	
	var ucHost = 'api.open.uc.cn';
	var loginPath = '/cas/loginByIframe?';
	var path = loginPath + qs.stringify(param);
	if(debug) {
		console.log(path);
	}
	
	var options = {
		hostname: ucHost,
		path:loginPath + qs.stringify(param),
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
		if(debug) {
			console.log(headers);
		}
		res.on('data', function (chunk) {  
			cb(chunk);
		});
	});
	
	req.on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(content +  '\n');
	req.end();
	
}

function praseCookie(cookies) {
	cookies.forEach(function(cookie) {
		var parts = cookie.split(';')[0].split('=');
		cookieManger[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
	});
	
	if(debug) {
		console.log(cookieManger);
	}
}

exports.login = login;
exports.getCaptchaId = getCaptchaId;
exports.getCaptcha = getCaptcha;