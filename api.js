var http = require('http');
var qs = require('querystring');  
var fs = require('fs')
var debug = true;

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
		var writestream = fs.createWriteStream('temp');
        writestream.on('close', function() {
            cb('ok');
        });
        res.pipe(writestream);
	});

	req.on('error', function (e) {
		console.log('problem with request: ' + e.message);
	});
	

	req.end();
	
}
exports.getCaptchaId = getCaptchaId;
exports.getCaptcha = getCaptcha;