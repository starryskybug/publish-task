import { ACCESS_TOKEN_KEY, API_BASE_URL, ACCOUNT_INFO_KEY } from ".";

// 基础配置
const BASE_URL = API_BASE_URL;
const TIMEOUT = 30000 // 请求超时时间，单位毫秒
const SUCCESS_CODE = 200
// 添加刷新token的标志和队列
let isRefreshing = false;
let requests = [];

// 请求拦截器
const requestInterceptor = (config) => {
    // 获取token（如果有）
    const token = uni.getStorageSync(ACCESS_TOKEN_KEY);
    if (token) {
        config.header = {
            ...config.header,
            'Authorization': token
        };
    }

    if (config.method !== 'GET' && config.method !== 'DELETE') {
        config.header = {
            ...config.header,
            'Content-Type': 'application/json',
        };
    }
    return config;
};

// 响应拦截器
const responseInterceptor = (response) => {
    const { data } = response;

    // 如果不是标准响应格式，直接返回
    if (!data || typeof data !== 'object' || !('code' in data)) {
        return Promise.reject(new Error('接口返回格式错误'));
    }

    // 业务逻辑成功
    if (data.code === SUCCESS_CODE) {
        return Promise.resolve(data);
    }

    // 处理特定的业务错误码
    if (data.code === 401) {
        // 处理token过期情况
        if (!isRefreshing) {
            isRefreshing = true;
            
            // 尝试刷新token
            return refreshToken()
                .then(newToken => {
                    // 更新存储的token
                    uni.setStorageSync(ACCESS_TOKEN_KEY, newToken);
                    
                    // 重新发起队列中的请求
                    requests.forEach(cb => cb(newToken));
                    requests = [];
                    
                    // 重新发起当前请求
                    const config = response.config;
                    config.header.Authorization = newToken;
                    return request(config);
                })
                .catch(error => {
                    console.log('刷新token失败', error);
                    // 刷新失败，清除token并跳转登录页
                    uni.clearStorageSync();
                    uni.showToast({
                        title: '登录已过期，请重新登录',
                        icon: 'none'
                    });
                    
                    // 不再自动跳转，让用户手动刷新
                    // 在微信小程序环境下，自动重新登录可能会导致更多问题
                    return Promise.reject(data);
                })
                .finally(() => {
                    isRefreshing = false;
                });
        } else {
            // 将请求加入队列
            return new Promise((resolve) => {
                requests.push((token) => {
                    const config = response.config;
                    config.header.Authorization = token;
                    resolve(request(config));
                });
            });
        }
    }

    // 其他业务错误
    uni.showToast({
        title: data.msg || '请求失败',
        icon: 'none'
    });

    return Promise.reject(data);
};

/**
 * 刷新token
 * @returns {Promise} - 返回Promise，成功时返回新token
 */
const refreshToken = () => {
    return new Promise((resolve, reject) => {
        // 使用微信登录重新获取token
        uni.login({
            provider: 'weixin',
            success: async (loginRes) => {
                try {
                    // 使用微信登录获取新token
                    const tokenResp = await request({
                        url: '/api/wx/login',
                        method: 'POST',
                        data: { code: loginRes.code },
                        // 这个请求不需要带token
                        header: { 'Content-Type': 'application/json' }
                    });
                    
                    if (tokenResp && tokenResp.data) {
                        // 返回新token
                        resolve(tokenResp.data);
                        
                        // 同时更新用户信息
                        try {
                            const userInfoResp = await request({
                                url: '/api/wx/getUserInfo',
                                method: 'GET',
                                header: { 'Authorization': tokenResp.data }
                            });
                            
                            if (userInfoResp && userInfoResp.data) {
                                uni.setStorageSync('ACCOUNT_INFO_KEY', userInfoResp.data);
                            }
                        } catch (userInfoError) {
                            console.error('获取用户信息失败', userInfoError);
                            // 不影响主流程，继续执行
                        }
                    } else {
                        reject(new Error('获取新token失败'));
                    }
                } catch (error) {
                    console.error('刷新token失败', error);
                    reject(error);
                }
            },
            fail: (err) => {
                console.error('微信登录失败', err);
                reject(err);
            }
        });
    });
};

/**
 * 请求函数
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回Promise
 */
const request = (options) => {
    // 合并请求配置
    const config = {
        url: options.url.startsWith('http') ? options.url : BASE_URL + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: options.header || {},
        timeout: options.timeout || TIMEOUT,
        dataType: options.dataType || 'json',
    };

    // 应用请求拦截器
    const finalConfig = requestInterceptor(config);

    // 返回Promise
    return new Promise((resolve, reject) => {
        uni.request({
            ...finalConfig,
            success: (res) => {
                // 保存请求配置用于重试
                res.config = finalConfig;
                
                // HTTP状态码处理
                if (res.statusCode === 200) {
                    try {
                        // 直接使用响应拦截器返回的Promise
                        responseInterceptor(res)
                            .then(data => resolve(data))
                            .catch(error => reject(error));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    // 处理非200状态码
                    uni.showToast({
                        title: `网络错误(${res.statusCode})`,
                        icon: 'none'
                    });
                    reject(res);
                }
            },
            fail: (err) => {
                // 网络错误、超时等
                uni.showToast({
                    title: '网络请求失败，请检查网络连接',
                    icon: 'none'
                });
                reject(err);
            }
        });
    });
};

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置
 * @returns {Promise} - 返回Promise
 */
const GET = (url, data = {}, options = {}) => {
    return request({
        url,
        method: 'GET',
        data,
        ...options
    });
};

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置
 * @returns {Promise} - 返回Promise
 */
const POST = (url, data = {}, options = {}) => {
    return request({
        url,
        method: 'POST',
        data,
        ...options
    });
};

/**
 * PUT请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置
 * @returns {Promise} - 返回Promise
 */
const PUT = (url, data = {}, options = {}) => {
    return request({
        url,
        method: 'PUT',
        data,
        ...options
    });
};

/**
 * DELETE请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置
 * @returns {Promise} - 返回Promise
 */
const DELETE = (url, data = {}, options = {}) => {
    return request({
        url,
        method: 'DELETE',
        data,
        ...options
    });
};

/**
 * 上传图片
 * @param {Object} options - 上传配置
 * @param {string} options.url - 上传地址
 * @param {string} options.filePath - 本地文件路径
 * @param {string} options.name - 文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容
 * @param {Object} options.formData - HTTP 请求中其他额外的 form 数据
 * @param {Object} options.header - 请求的 header
 * @returns {Promise} - 返回Promise
 */
const uploadImage = (options) => {
    if (!options.url || !options.filePath || !options.name) {
        return Promise.reject(new Error('缺少必要参数'));
    }

    // 获取token
    const token = uni.getStorageSync(ACCESS_TOKEN_KEY);
    const header = { ...options.header };
    
    // 添加token到header
    if (token) {
        header.Authorization = token;
    }

    // 返回Promise
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: options.url.startsWith('http') ? options.url : BASE_URL + options.url,
            filePath: options.filePath,
            name: options.name,
            formData: options.formData || {},
            header: header,
            success: (res) => {
                // 上传成功后处理响应
                if (res.statusCode === 200) {
                    try {
                        // 解析返回的数据
                        const data = JSON.parse(res.data);
                        
                        // 使用相同的响应处理逻辑
                        if (data.code === SUCCESS_CODE) {
                            resolve(data);
                        } else {
                            // 处理业务错误
                            uni.showToast({
                                title: data.msg || '上传失败',
                                icon: 'none'
                            });
                            reject(data);
                        }
                    } catch (error) {
                        reject(new Error('解析响应数据失败'));
                    }
                } else {
                    // 处理非200状态码
                    uni.showToast({
                        title: `上传失败(${res.statusCode})`,
                        icon: 'none'
                    });
                    reject(res);
                }
            },
            fail: (err) => {
                uni.showToast({
                    title: '图片上传失败，请检查网络连接',
                    icon: 'none'
                });
                reject(err);
            }
        });
    });
};

// 导出API方法
export default {
    request,
    GET,
    POST,
    PUT,
    DELETE,
    uploadImage
};
