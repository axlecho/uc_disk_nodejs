var api = require('./api.js');
var mCaptchaId = '';
var zlib = require('zlib');

api.getCaptchaId(function (captchaId) {
	captchaId  = captchaId.toString().split(':')[1]
		.replace(')','').replace('}','').replace(new RegExp(/\'/g),'');
	console.log('captchaId:' + captchaId);
	mCaptchaId = captchaId;
	api.getCaptcha(captchaId,function(res) {
		console.log('get chptcha done');
	});
});

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
	var captcha = process.stdin.read();
	if (captcha == null || captcha == undefined || captcha == '') { 
		return;
	}

	captcha = captcha.replace(/\s+/g, '')
	var user = 'axlecho@126.com';
	var pass = '!me433978029';
	
	api.login(user,pass,captcha,mCaptchaId,function(data) {
		api.praseServiceTicket(decodeURIComponent(data.toString()));
		api.setServiceTicket(function(data) {
			console.log(data.toString());
			api.setLn(function() {
				api.getDirInfo('1',function(data){
					var buffer = Buffer.concat(data);
					zlib.gunzip(buffer, function (err, decoded) {
						console.log(decoded.toString());
					});
				});
			});
		});
	});
	
	process.stdin.resume();
	process.stdin.pause();
	process.stdin.destroy();
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});
