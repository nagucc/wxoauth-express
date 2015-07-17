/*
 提供给Exrpess/Connect使用的微信OAuth登录中间件
需要提前使用的Express中间件包括：
	- session
*/

var WxOauth = function (corpId, secret) {
	this.corpId = corpId;
	this.secret = secret;

	var OAuth = require('wechat-oauth');
	this.oauth = new OAuth(corpId, secret);
};

/*
重定向到授权页
由req提供的参数：
	- wxoauth
		- redirect 授权后要跳转的地址
*/
WxOauth.prototype.authorize = function() {
	var self = this;
	return function (req, res, next) {
		var state = Math.random().toString();
		req.session.wxoauth_state = state;                                  // 生成随机的state参数

		var redirect = req.wxoauth.redirect;
    	var url = self.oauth.getAuthorizeURL(redirect, req.session.state, 'snsapi_base');        // 生成认证url
    	res.redirect(url);
	}
};

/*
微信认证成功后进行的操作。
调用时提供的参数：
	- db 用于存储AccessToken的数据库的url
由req提供的参数：
	- wxoauth
		- agentId 调用API的应用程序ID

由req返回的值：
	- wxoauth
		- userInfo 认证后返回的用户信息
			- UserId或OpenId 当前用户是企业用户时返回UserId，否则返回OpenId
			- DeviceId 设备的唯一ID

*/
WxOauth.prototype.qyBack = function(db) {
	var self = this;

	
	return function  (req, res, next) {
		var wxapi = require('./lib/wxapi')({
		    corpId: self.corpId,
		    secret: self.secret,
		    agentId: req.wxoauth.agentId,
		    db: db
		});
		wxapi.getUserIdByCode(req.query.code, function(err, result){            // 根据返回的code获取userid
	        if(err){
	            res.wxoauth.err = err;
	        } else {
	        	req.wxoauth.userInfo = result;
	        }
            next();
	    });
	}
};