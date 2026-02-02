const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User } = require('../models');
const config = require('../config');

const router = express.Router();

/**
 * 微信小程序登录
 */
router.post('/wechat', async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Code is required'
            });
        }

        // 调用微信API获取openid
        // NOTE: In a real environment, these keys should be set in .env
        // config.wechat.appId and config.wechat.appSecret
        // If testing without real keys, this call will fail or we mock it.

        // For development/mocking purposes:
        let openid, unionid;
        if (code === 'mock_code' || !config.wechat.appId) {
            // Fallback for testing/mock mode
            openid = 'mock_openid_' + code;
        } else {
            const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
                params: {
                    appid: config.wechat.appId,
                    secret: config.wechat.appSecret,
                    js_code: code,
                    grant_type: 'authorization_code'
                }
            });

            if (wxRes.data.errcode) {
                return res.status(400).json({
                    success: false,
                    error: wxRes.data.errmsg
                });
            }

            openid = wxRes.data.openid;
            unionid = wxRes.data.unionid;
        }

        // 查找或创建用户
        const user = await User.findOrCreateByOpenId(openid, { unionId: unionid });

        // 生成JWT
        const token = jwt.sign(
            { userId: user.id, openId: openid },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            success: true,
            token,
            expiresIn: 7 * 24 * 60 * 60, // 7天(秒)
            user: {
                id: user.id,
                nickname: user.nickname,
                avatarUrl: user.avatarUrl
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
