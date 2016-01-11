var http = require('http');
var qs = require('querystring');

var data = {
    dirid: '12684307629012874241',
    type:'all',
    _: new Date().getTime()};//这是需要提交的数据


var content = qs.stringify(data);

console.log(content);

var options = {
    hostname: 'disk.yun.uc.cn',
    path: '/netdisk/ajaxnd?' + content,
    method: 'GET',
    headers: {
        'Cookie':'s_uid=D41D8CD98F; mode=list; _UP_F7E_8D_="ENNewQLhj3C/qiEmOD8FSvjdGzlxqy3HGUOU+WEa1/CQ9pt/lxcgspx/7jdZxm88C0IpclYaolOv+Rantbfg1mWGAUpRMP4RqXP78Wvu/CfvkWWGc5NhCTV71tGOIGgDBR3+u6/jj46m8qZLyz8cvkLsWIKP3YLXZ6Vv++WIQKENqkM+G0wgRw=="; _UP_D_=pc; _UP_L_=zh; __ln=bTkwAE7kyeZ0BkI1bfxn%2BP2rGlvd1r3mEFKX; yunsess=uc%40EA1AD193323A989AE17BE80CBE0407C9; netdisk_vip=LTE%3D'
    }
};

var req = http.request(options, function (res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    });
});


req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
});

req.end();
