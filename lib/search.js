/**
 * Created by busyhe on 2019/12/15.
 * Email: 525118368@qq.com
 * Description:
 */
const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const sequence = require('@lvchengbin/sequence');
const fs = require('fs');
const path = require('path');
const {getAuthor, getAuthorPosts, getImage, getTags, getPosts, getTagPosts} = require('./api');

const spinner = ora('');
const TYPES = [
    {value: 'author', name: '作者'},
    {value: 'tags', name: '标签'},
    {value: 'posts', name: '作品'}
];

let global_posts = []; // 所有的文章
let select_images = []; // 所选图片列表

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('search-checkbox', require('inquirer-search-checkbox'));

module.exports = async (options) => {
    global_posts = [];
    select_images = [];
    const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: '选择搜索类型',
                choices: TYPES
            },
            {
                type: 'autocomplete',
                name: 'typeResult',
                message: (answers) => {
                    const result = TYPES.filter(item => item.value === answers.type);
                    return `输入${result[0].name}名称`;
                },
                source: async (answers, input) => searchStates(answers.type, input, options)
            },
            {
                when: downloadAllWhen,
                type: 'confirm',
                name: 'downloadAll',
                message: '是否下载所有作品？',
                default: false
            },
            {
                when: (answers) => {
                    return !answers.downloadAll && answers.type !== 'posts';
                },
                type: 'search-checkbox',
                name: 'selectPosts',
                message: '选择要下载的作品',
                choices: postStates
            },
            {
                type: 'confirm',
                name: 'end',
                message: endHandle
            }
        ]
    );
    if (answers.end) {
        await saveImages(select_images);
        spinner.succeed('下载完成');
    } else {
        spinner.succeed('end');
    }
};

function downloadAllWhen(answers) {
    switch (answers.type) {
        case 'author': {
            const {typeResult} = answers;
            console.log(chalk.blue('※ ') + chalk.gray(`${typeResult.name} ${typeResult.recommend_reason} ${typeResult.url}`));
            break;
        }
        case 'tags': {
            const {typeResult} = answers;
            console.log(chalk.blue('※ ') + chalk.gray(`${typeResult.tag_name} ${typeResult.url}`));
            break;
        }
        case 'posts': {
            return false;
        }
    }
    return true;
}

/**
 * 结果询问
 * @param answers
 * @returns {Promise<string>}
 */
async function endHandle(answers) {
    let result = null;
    if (answers.type === 'posts') {
        result = await getAllImages([answers.typeResult]);
    } else {
        if (answers.downloadAll) {
            await postStates(answers, null);
            result = await getAllImages(global_posts.map(item => item.value));
        } else {
            result = await getAllImages(answers.selectPosts);
        }
    }
    select_images = result;
    return `预计要下载 [${result.length}] 张照片，是否下载？`;
}

/**
 * 查询作者、标签、帖子
 * @param type
 * @param input
 * @param options
 * @returns {Promise<[]>}
 */
async function searchStates(type, input, options) {
    let result = [];
    switch (type) {
        case 'author': {
            const res = await getAuthor(input, options.page, options.count);
            if (res.result === 'SUCCESS') {
                result = res.data.site_list.map(item => {
                    return {
                        name: item.name,
                        value: item
                    };
                });
            }
            break;
        }
        case 'tags': {
            const res = await getTags(input, options.page, options.count);
            if (res.result === 'SUCCESS') {
                result = res.data.tag_list.map(item => {
                    return {
                        name: item.tag_name,
                        value: item
                    };
                });
            }
            break;
        }
        case 'posts': {
            const res = await getPosts(input, options.page, options.count);
            if (res.result === 'SUCCESS') {
                result = res.data.post_list.map(item => {
                    return {
                        name: `${getPostName(item)} (${item.image_count}张)`,
                        value: item
                    };
                });
            }
            break;
        }
    }
    return result;
}

/**
 * 查询作者所有帖子
 * @param answers
 * @param input
 * @returns {Promise<[]>}
 */
async function postStates(answers, input) {
    if (global_posts.length) return global_posts;
    switch (answers.type) {
        case 'author': {
            const res = await getAuthorPosts(answers.typeResult.site_id);
            if (res.result === 'SUCCESS') {
                global_posts = res.post_list.map(item => {
                    let name = getPostName(item);
                    return {
                        name: `${name} (${item.image_count})张`,
                        value: item
                    };
                });
            }
            break;
        }
        case 'tags': {
            const res = await getTagPosts(answers.typeResult.tag_name);
            if (res.result === 'SUCCESS') {
                global_posts = res.postList.map(item => {
                    let name = getPostName(item);
                    return {
                        name: `${name} (${item.image_count})张`,
                        value: item
                    };
                });
            }
            break;
        }
        case 'posts': {
            break;
        }
    }
    return global_posts;
}

async function getAllImages(posts) {
    let list = [];
    if (posts.length === 0) return [];
    posts.forEach(item => {
        item.images.forEach(image => Object.assign(image, {postTitle: getPostName(item)}));
        list = list.concat(item.images);
    });
    return list;
}

async function saveImages(images) {
    spinner.start('开始下载图片');
    let steps = [];
    let total = images.length;
    let progress = 0;
    if (!fs.existsSync(path.resolve('./images'))) {
        fs.mkdirSync(path.resolve('./images'));
    }
    images.forEach(item => {
        let imageName = getImageName(item);
        let imagePath = `./images/${item.postTitle}/`;
        if (!fs.existsSync(path.resolve(imagePath))) {
            fs.mkdirSync(path.resolve(imagePath));
        }
        let filePath = path.resolve(imagePath, `${imageName}.jpg`);
        steps.push(() => saveImage(item.user_id, item, filePath).then(() => {
            progress++;
            spinner.text = `success ${progress}/${total} ${imageName}.jpg`;
        }).catch(err => {
            progress++;
            spinner.text = `error ${progress}/${total} ${imageName}.jpg`;
        }));
    });
    return sequence.chain(steps);
}

function saveImage(authorId, image, filePath) {
    return new Promise((resolve, reject) => {
        getImage(authorId, image.img_id).then(data => {
            let writeStream = data.pipe(fs.createWriteStream(filePath));
            writeStream.on('error', (err) => {
                reject(err);
            });
            writeStream.on('finish', () => {
                resolve();
            });
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 获取文章名称
 * @param post
 * @returns {string | *}
 */
function getPostName(post) {
    let name = post.title || post.excerpt || post.post_id;
    return name.toString().replace(/\n/g, '');
}

/**
 * 获取图片名称
 * @param image
 * @returns {string | *}
 */
function getImageName(image) {
    let name = image.title || image.excerpt || image.img_id;
    return name.toString().replace(/\n/g, '');
}
