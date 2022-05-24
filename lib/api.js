/**
 * Created by busyhe on 2019/12/15.
 * Email: 525118368@qq.com
 * Description:
 */
const axios = require('axios');
const Config = require('./config');

const instance = axios.create({
    baseURL: Config.BASE_URL,
    timeout: 60000
});

/**
 * 获取作者
 * @param query
 * @param page
 * @param count
 * @returns {Promise<void>}
 */
exports.getAuthor = async (query, page, count) => {
    return instance.get('/rest/3/search/sites', {
        params: {
            query,
            page,
            count
        }
    }).then(res => res.data);
};

/**
 * 搜索标签
 * @param query
 * @param page
 * @param count
 * @returns {Promise<T>}
 */
exports.getTags = async (query, page, count) => {
    return instance.get('/rest/3/search/tags', {
        params: {
            query,
            page,
            count
        }
    }).then(res => res.data);
};

/**
 * 搜索文章
 * @param query
 * @param page
 * @param count
 * @returns {Promise<T>}
 */
exports.getPosts = async (query, page, count) => {
    return instance.get('/rest/3/search/posts', {
        params: {
            query,
            page,
            count
        }
    }).then(res => res.data);
};

/**
 * 获取作者文章列表
 * @param id
 * @returns {Promise<T>}
 */
exports.getAuthorPosts = async (id) => {
    return instance.get(`/rest/3/sites/${id}/posts`, {
        params: {
            page: 1,
            count: 100000000
        }
    }).then(res => res.data);
};

/**
 * 获取标签文章列表
 * @param name
 * @returns {Promise<T>}
 */
exports.getTagPosts = async (name) => {
    return instance.get(`/rest/tags/${encodeURIComponent(name)}/posts`, {
        params: {
            page: 1,
            count: 100,
            order: 'daily'
        }
    }).then(res => res.data);
};

/**
 * 获取文档图片
 * @param id
 * @returns {Promise<T>}
 */
exports.getPostImages = async (id) => {
    return instance.get(`/rest/3/posts/${id}`, {
        params: {
            page: 1,
            count: 100000000
        }
    }).then(res => res.data);
};

/**
 * 获取图片内容
 * @param authorId
 * @param imageId
 * @returns {Promise<T>}
 */
exports.getImage = async (authorId, imageId) => {
    return instance.get(`${Config.DOWNLOAD_URL}/${authorId}/f/${imageId}.jpg`, {
        responseType: 'stream'
    }).then(res => res.data);
};
