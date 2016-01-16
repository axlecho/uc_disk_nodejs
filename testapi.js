var api = require('./api.js');
var mCaptchaId = '';

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
		console.log(decodeURIComponent(data.toString()));
	});
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});
