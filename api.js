var http = require('http');
var qs = require('querystring');  
var fs = require('fs');
var Q = require('q');
var zlib = require('zlib');

var debug = true;
var silent = false;
var cookieManger = {
	//'mode':'list',
	//'netdisk_vip':'LTE=',
	//'s_uid':'7200ED8C38'
};

var mServiceTicket = '';
var mCaptchaId = ''
function getTimeStamp() {
	return new Date().getTime();
}

function getCaptchaId() {

    var deferred = Q.defer();
	
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
			deferred.resolve(chunks);
		});
	});

	req.on('error', function (e) {
		deferred.reject('[getCaptchaId] problem with request: ' + e.message);
	});
	req.end();
	
	return deferred.promise;
}

function getCaptchaImage(captchaId) {
    var deferred = Q.defer();
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
			deferred.resolve();
        });
        res.pipe(writestream);
	});

	req.on('error', function (e) {
		deferred.reject('[getCaptcha] problem with request:' + e.message);
	});
	
	req.end();
	return deferred.promise;
}

function getCaptcha () {
    var deferred = Q.defer();
	getCaptchaId().then(
		function(result){
			mCaptchaId  = result.toString().split(':')[1]
				.replace(')','').replace('}','').replace(new RegExp(/\'/g),'');
			return getCaptchaImage(mCaptchaId);
		},function(error){
		  console.log(error.toString());
		}
	).then(
		function(){
			deferred.resolve();
		},function(error){
		  console.log(error.toString());
		}
	);
	
	return deferred.promise;
}

function login(name,pass,code) {
    var deferred = Q.defer();
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
            'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent':'Mozilla/5.0 (Linux; U; Android 5.1.1; zh-CN; N1 Build/A5CNB19) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 UCBrowser/10.8.5.689 U3/0.8.0 Mobile Safari/534.30'
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
			var ret = praseServiceTicket(decodeURIComponent(chunks));
			if(ret.status == 20000) {
				deferred.resolve();
			}
			console.log('[login] login failed:' + ret[',message']);
			deferred.reject(ret[',message']);
			return;
		});
	});
	
	req.on('error', function (e) {
		deferred.reject('[login] problem with request:' + e.message);
	});

	
	var content = {
		login_name:name,
		password:pass,
		captcha_code:code,
		captcha_id:mCaptchaId
	};
	var postdata = qs.stringify(content);
	
	if(debug) {
	    console.log('[login] post data:' + postdata);
	}
	req.write(postdata +  '\n');
	req.end();
	return deferred.promise;
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
		mServiceTicket = response.data.service_ticket;
		if(debug) {
			console.log('[praseServiceTicket] mServiceTicket:' + mServiceTicket);
		}
	}
	
	return response;
}

function getDirInfo(dir) {
    var deferred = Q.defer();
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
			'User-Agent':'Mozilla/5.0 (Linux; U; Android 5.1.1; zh-CN; N1 Build/A5CNB19) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 UCBrowser/10.8.5.689 U3/0.8.0 Mobile Safari/534.30',
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
			console.log('====================================');
		}
		if(!silent) {
			console.log('[getDirInfo] status:' + statusCode);
		}
		
		var chunks = [];
		res.on('data', function (chunk) {  
			  chunks.push(chunk);
		});
		
		res.on('end',function() {
			var buffer = Buffer.concat(chunks);
			switch (headers['content-encoding']) {
			case 'gzip':
				zlib.gunzip(buffer, function (err, decoded) {
					var result = decoded.toString();
					if(debug) {
						console.log('======= [getDirInfo] result =======');
						console.log(result);
						console.log('===================================');
					}
					deferred.resolve(result);
				});
				break;
			default:
				if(debug) {
					console.log('======= [getDirInfo] result =======');
					console.log(chunks.toString());
					console.log('===================================');
				}
				deferred.resolve(chunks.toString());
			}

		});
	});

	req.on('error', function (e) {
		deferred.reject('[getDirInfo] problem with request:' + e.message);
	});
	
	req.end();
	return deferred.promise;
}

function setServiceTicket() {
    var deferred = Q.defer();
	var hostname = 'yun.uc.cn';
	
	var urlparam = {
		service_ticket:mServiceTicket
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
			deferred.resolve();
		});
	});

	req.on('error', function (e) {
		deferred.reject('[setServiceTicket] problem with request: ' + e.message);
	});
	
	req.end();
	return deferred.promise;
}

function setLn() {
    var deferred = Q.defer();
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
		deferred.resolve();
	});
	
	req.on('error', function (e) {
		deferred.reject('[setLn] problem with request:' + e.message);
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
	return deferred.promise;
}

function downloadFile(info) {

    var deferred = Q.defer();
	//var url = info.download;
	var url = 'http://uc.dl.django.t.taobao.com/rest/1.0/file?token=fwxJfSMqrRZ8Lt25MGMrLwABUYAAAAFTlHAizwAAABcAAQED&link-type=download-pc-low&fileIds=RjPXOrwjSri0eNTozyNnAwAAABcAAQID&timestamp=1458485775&uID=869193934&name=IB-IBW-351.jpg&r=pic&imei=&fr=&acl=2be62feb9469f2587ea17c9c213c1fc9'
	var name = info.shortname;
	
	if (debug) {
		console.log('====== [downloadFile] info ======');
		console.log(info);
		console.log('=================================');
	}
	
	var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var result = parse_url.exec(url);
	if(debug) {
		console.log(result);
	}
	var options = {
		hostname: result[3],
		path: '/' + result[5] + '?' + result[6],
		headers: {  
            "Pragma": "no-cache" ,
			"Accept-Encoding": "gzip, deflate, sdch" ,
			"Accept-Language": "zh-CN,zh;q=0.8" ,
			"Upgrade-Insecure-Requests": "1" ,
			"User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36" ,
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" ,
			"Referer":" http://disk.yun.uc.cn/" ,
			"Cookie": "thw=cn; cna=58grD0AU32QCAbcLsaq1uFXC; miid=7921626627275384669; uc3=sg2=UU3mAG65ttnxYwFbGeuXKm9oB6uCCgGDOtYTwa8igXs"%"3D&nk2=BvBeG3MGNwoN"%"2Bw"%"3D"%"3D&id2=Vyh5TiHQvWei&vt3=F8dASmw5E62LifRXScs"%"3D&lg2=V32FPkk"%"2Fw0dUvg"%"3D"%"3D; uss=Bqa1OpqxBD7VhAkJdfX953dPzHrY0FqdUUSg1G71D88PeSBpic5t"%"2BS6qAQ"%"3D"%"3D; lgc=echo000001; tracknick=echo000001; t=1f3f6f26aa16962f0b592296fd00bb95; _cc_=WqG3DMC9EA"%"3D"%"3D; tg=0; x=e"%"3D1"%"26p"%"3D*"%"26s"%"3D0"%"26c"%"3D0"%"26f"%"3D0"%"26g"%"3D0"%"26t"%"3D0"%"26__ll"%"3D-1"%"26_ato"%"3D0; l=Avv7iedWAQprLlbv3ggRT2LzC9VrFQ8y; UC_DJANGO_UID=d358f3594e01820bae3efca6a47a2675; UC_DJANGO_ACL=",
			"Connection": "keep-alive" 
        }
	};
	
	var req = http.get(options,function(res) {
		var statusCode = res.statusCode;
		var headers = JSON.parse(JSON.stringify(res.headers));
		var cookies = headers['set-cookie'];
		
		if(!silent) {
			console.log('[downloadFile] status:' + statusCode);
		}
		
		var writestream = fs.createWriteStream(name);
        writestream.on('close', function() {
			deferred.resolve();
        });
        res.pipe(writestream);
	});

	req.on('error', function (e) {
		deferred.reject('[downloadFile] problem with request: ' + e.message);
	});
	req.end();
	
	return deferred.promise;	
}

exports.login = login;
exports.getCaptcha = getCaptcha;
exports.getDirInfo = getDirInfo;
exports.setServiceTicket = setServiceTicket;
exports.setLn = setLn;
exports.downloadFile = downloadFile;
