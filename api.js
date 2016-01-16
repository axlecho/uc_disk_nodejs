var http = require('http');
var qs = require('querystring');  
var fs = require('fs')
var debug = false;
var silent = false;

var cookieManger = {
	//'mode':'list',
	//'netdisk_vip':'LTE=',
	//'s_uid':'7200ED8C38'
};

var serviceTicket = "";

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
		
		var chunks = [];
		res.on('data', function (chunk) {  
			  chunks.push(chunk);
		});
		
		res.on('end',function() {
			cb(chunks);
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
		var chunks = [];
		res.on('data', function (chunk) {  
			  chunks.push(chunk);
		});
		
		res.on('end',function() {
			cb(chunks);
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

function praseServiceTicket(webdata) {
	var scriptRep = new RegExp('(response=).*(";)');
	var responseString  = scriptRep.exec(webdata);

	if(debug) {
		console.log('======= [praseServiceTicket] webdata =======');
		console.log(webdata);
		console.log('=============================================');
		console.log('[praseServiceTicket] response:' + responseString[0]);
	}
	
	var response = JSON.parse(responseString[0].split('=')[1]
		.replace(new RegExp(/";/),''));
	if(debug) {
		console.log('======= [praseServiceTicket] responseObject =======');
		console.log(response);
		console.log('=============================================');
	}
	if(response.status == 20000) {
		serviceTicket = response.data.service_ticket;
	}
	if(debug) {
		console.log('[praseServiceTicket] serviceTicket:' + serviceTicket);
	}
}

function getDirInfo(dir,cb) {
	var hostname = 'disk.yun.uc.cn';
	var urlparam = {
		dirid:dir,
		type:'all',
		_:getTimeStamp()
	};
	
	var path = '/netdisk/ajaxnd?' +  qs.stringify(urlparam);
	
	if (debug) {
		console.log('[getDirInfo] url:' + hostname + path);
	}
	
	var cookie = '';
	for ( var field in cookieManger ){
		cookie += field + '=' + cookieManger[field] + ';';
	}
	var options = {
		hostname:hostname,
		path:path,
		method:'get',
		headers: {  
			'Accept':'application/json, text/javascript, */*; q=0.01',
			'Accept-Encoding':'gzip, deflate, sdch',
			'Accept-Language':'zh-CN,zh;q=0.8,en;q=0.6',
			'Cache-Control':'no-cache',
			'Connection':'keep-alive',
            'Content-Type': 'application/json', 
			'Pragma':'no-cache',
			'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
			'X-Requested-With':'XMLHttpRequest',
			"Cookie": cookie
        }
	};
	if(debug) {
		console.log('[getDirInfo] headers cookie:' + cookie);
	}
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		if(debug) {
			console.log('======= [getDirInfo] headers =======');
			console.log(headers);
			console.log('=============================================');
		}
		if(!silent) {
			console.log('[getDirInfo] status:' + statusCode);
		}
		
		var chunks = [];
		res.on('data', function (chunk) {  
			  chunks.push(chunk);
		});
		
		res.on('end',function() {
			cb(chunks);
		});
	});

	req.on('error', function (e) {
		console.log('[getCaptcha] problem with request:' + e.message);
	});
	
	req.end();
	
}

function setServiceTicket(cb) {
	var hostname = 'yun.uc.cn';
	
	var urlparam = {
		service_ticket:serviceTicket
	};
	
	var path = '/exter/basicinfo?' + qs.stringify(urlparam);
		
	if (debug) {
		console.log('[setServiceTicket] url:' + hostname + path);
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
		praseCookie(cookies);
		if(!silent) {
			console.log('[setServiceTicket] status:' + statusCode);
		}
		
		var chunks = [];
		res.on('data', function (chunk) {  
			  chunks.push(chunk);
		});
		
		res.on('end',function() {
			cb(chunks);
		});
	});

	req.on('error', function (e) {
		console.log('[setServiceTicket] problem with request: ' + e.message);
	});
	
	req.end();
}

function setLn(cb) {
	var hostname = 'yun.uc.cn';
	var path = '/index.php/netdisk_service/ajax/setLn';
	if(debug) {
		console.log('[setLn] url:' + hostname + path);
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
			console.log('[setLn] status:' + statusCode);
		}
		cb();
	});
	
	req.on('error', function (e) {
		console.log('[setLn] problem with request:' + e.message);
	});

	
	var content = {
		ln:"axlecho@126.com"
	};
	var postdata = qs.stringify(content);
	
	if(debug) {
	    console.log('[setLn] post data:' + postdata);
	}
	req.write(postdata +  '\n');
	req.end();
}

function getIndex(cb) {
	var hostname = 'disk.yun.uc.cn';
	
	var path = '/';
		
	if (debug) {
		console.log('[getIndex] url:' + hostname + path);
	}
	
	var cookie = '';
	for ( var field in cookieManger ){
		cookie += field + '=' + cookieManger[field] + ';';
	}
	var options = {
		hostname:hostname,
		path:path,
		method:'get',
		headers: {  
			'Accept':'application/json, text/javascript, */*; q=0.01',
			'Accept-Encoding':'gzip, deflate, sdch',
			'Accept-Language':'zh-CN,zh;q=0.8,en;q=0.6',
			'Cache-Control':'no-cache',
			'Connection':'keep-alive',
            'Content-Type': 'application/json', 
			'Pragma':'no-cache',
			'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
			'X-Requested-With':'XMLHttpRequest',
			"Cookie": cookie
        }
	};
	if(debug) {
		console.log('[getIndex] headers cookie:' + cookie);
	}
	
	var req = http.request(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		praseCookie(cookies);
		
		if(debug) {
			console.log('======= [getIndex] headers =======');
			console.log(headers);
			console.log('=============================================');
		}
		
		if(!silent) {
			console.log('[getIndex] status:' + statusCode);
		}
		
		var chunks = [];
		res.on('data', function (chunk) {  
			  chunks.push(chunk);
		});
		
		res.on('end',function() {
			cb(chunks);
		});
	});

	req.on('error', function (e) {
		console.log('[getIndex] problem with request: ' + e.message);
	});
	
	req.end();
}

exports.login = login;
exports.getCaptchaId = getCaptchaId;
exports.getCaptcha = getCaptcha;
exports.praseServiceTicket = praseServiceTicket;
exports.getDirInfo = getDirInfo;
exports.setServiceTicket = setServiceTicket;
exports.setLn = setLn;
exports.getIndex = getIndex;