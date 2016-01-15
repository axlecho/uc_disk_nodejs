var api = require('./api.js');
var mCaptchaId = '';

api.getCaptchaId(function (captchaId) {
	captchaId  = captchaId.toString().split(':')[1]
		.replace(')','').replace('}','').replace(new RegExp(/\'/g),'');
	console.log(captchaId);
	mCaptchaId = captchaId;
	api.getCaptcha(captchaId,function(res) {
		console.log(res);
	});
});

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
	var captcha = process.stdin.read();
	//captcha = captcha.replace('\n','');
	console.log(captcha);
	
	var user = 'axlecho@126.com';
	var pass = '!me433978029';
	
	api.login(user,pass,captcha,mCaptchaId,function() {});
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});
