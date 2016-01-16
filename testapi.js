var api = require('./api.js');
var mCaptchaId = '';
var zlib = require('zlib');

api.getCaptcha()
.then(function() {
		setRead();
	},function(error) {
		console.log(error) ;
	});


function setRead() {
	process.stdin.setEncoding('utf8');

	process.stdin.on('readable', function() {
		var captcha = process.stdin.read();
		if (captcha == null || captcha == undefined || captcha == '') { 
			return;
		}

		captcha = captcha.replace(/\s+/g, '')
		var user = 'axlecho@126.com';
		var pass = '!me433978029';
		api.login(user,pass,captcha).then(
			function() { return api.setServiceTicket();},
			function(error) { console.log(error); }
		).then(
			function() { return api.setLn();},
			function(error) { console.log(error.toString()); }
		).then(
			function() { return api.getDirInfo('1');},
			function(error) { console.log(error.toString()); }
		).then(
			function(result) { 
				result = decodeURIComponent(result);
				o = JSON.parse(result);
				//console.log(o);
				return api.downloadFile(o.filelist[1]);
			},
			function(error)  { console.log(error.toString()); }
		).then(
			function() { console.log('download succeed');},
			function(error) { console.log(error.toString()); }
		);
		
		process.stdin.resume();
		process.stdin.pause();
		process.stdin.destroy();
	});

	process.stdin.on('end', function() {
	  process.stdout.write('end');
	});
}
