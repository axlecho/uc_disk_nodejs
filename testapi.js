var api = require('./api.js');

api.getCaptchaId(function (captchaId) {
	captchaId  = captchaId.toString().split(':')[1]
		.replace(')','').replace('}','').replace(new RegExp(/\'/g),'');
	console.log(captchaId);
	api.getCaptcha(captchaId,function(res) {
		console.log(res);
	});
});

