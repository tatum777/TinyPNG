/**
 * 压缩项目中的图片
 */
const glob = require('glob'),
    chalk = require('chalk'),
    tinify = require('tinify'),
    tinifyKeys = [ //TinyPNG注册的key，每个每月能压缩500个图片
       // 需要填写自己的key
    ],
    src = './images/'; //源目录

let tinifyKeyIndex = 0; //当前使用的key下标

process.on('unhandledRejection', function () {}); //避免抛出UnhandledPromiseRejectionWarning警告

(async function () {
    //校验
    await validate();
    //压缩
    const allImages = glob.sync(src + '/*.png'), //所有png
        allCount = allImages.length;
    let hasCompressed = 0; //已压缩数量
    allImages.forEach(imgPath => {
        doCompress(imgPath, tinifyKeyIndex).then(() => {
            if (++hasCompressed == allCount) {
                console.log(chalk.green(`成功压缩${allCount}张图片！\n`));
            }
        });
    });
})();

//校验环境和TinyPNG注册的key
async function validate(keyIndex = 0) {
    let err;
    for (let i = keyIndex; i < tinifyKeys.length; i++) {
        tinify.key = tinifyKeys[i]; //TinyPNG注册的key
        try {
            await tinify.validate();
            tinifyKeyIndex = i;
            return;
        } catch (e) {
            err = e;
            if (e.status == 401) { //没权限
            } else break;
        }
    }
    if (err) {
        console.log(chalk.red(`错误：连接TinyPNG失败！\n${err}\n`));
        throw '';
    } else {
        console.log(chalk.red('错误：所有TinyPNG注册的key都不合法或次数已使用完\n'));
        throw '';
    }
}
//执行压缩
async function doCompress(imgPath, keyIndex) {
    const source = tinify.fromFile(imgPath);
    try {
        await source.toFile(imgPath);
        return;
    } catch (e) {
        if (e.status == 429) { //次数用完
            try {
                await validate(++keyIndex); //使用新的key
                return doCompress(imgPath, keyIndex);
            } catch (e) {
                process.exit();
            }
        }
    }
}