const qiniu = require('qiniu')
const fs = require('fs')
const axios = require('axios')

const ZoneMap = {
  '华东':	qiniu.zone.Zone_z0,
  '华北':	qiniu.zone.Zone_z1,
  '华南':	qiniu.zone.Zone_z2,
  '北美':	qiniu.zone.Zone_na0
}

class QiniuManager {
  /**
   * constructor
   * @param {String} accessKey 七牛云公钥
   * @param {String} secretKey 七牛云私钥
   * @param {String} bucket 空间
   * @param {String} zone zone对象和机房的关系
   */
  constructor(accessKey, secretKey, bucket, zone = '华南') {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    this.bucket = bucket
    this.config = new qiniu.conf.Config()
    this.config.zone = ZoneMap[zone]
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
    this.publicDomain = ''
  }
  /**
   * 上传文件
   * @param {String} key 文件在云空间里面的名字
   * @param {String} localFilePath 文件本地地址
   */
  uploadFile(key, localFilePath) {
    // generate uptoekn
    const options = {
      // scope: this.bucket + ':' + key // 如果有相同的就替换
      scope: `${this.bucket}:${key}` // 如果有相同的就替换
    }
    const putPloicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPloicy.uploadToken(this.mac)
    const formUploader = new qiniu.form_up.FormUploader(this.config)
    const putExtra = new qiniu.form_up.PutExtra()
    // 文件上传
    return new Promise((resolve, reject) => {
      formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCb(resolve, reject))
    })
  }

  /**
   * 删除文件
   * @param {String} key 文件在云空间里面的名字
   */
  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.bucket, key, this._handleCb(resolve, reject))
    })
  }

  /**
   * 获取bucket下的public存储链接🔗
   */
  getBucketDomain() {
    const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
    const token = qiniu.util.generateAccessToken(this.mac, reqURL)
    return new Promise((resolve, reject) => {
      qiniu.rpc.postWithoutForm(reqURL, token, this._handleCb(resolve, reject))
    })
  }

  /**
   * 生成需要下载文件的链接🔗
   * @param {String} key 需要下载文件的名字
   */
  getDownLoadLink(key) {
    const domainPromise = this.publicDomain ? Promise.resolve([this.publicDomain]) : this.getBucketDomain()
    return domainPromise.then(res => {
      if (Array.isArray(res) && res.length > 0) {
        // const reg = /^http?/
        this.publicDomain = res[0].includes('http') ? res[0] : `http://${res[0]}`
        return this.bucketManager.publicDownloadUrl(this.publicDomain, key)
      } else {
        throw new Error('错误❌！！！')
      }
    })
  }

  /**
   * 从云空间下载文件
   * @param {String} key 云空间上的文件名称
   * @param {String} localPath 保存的本地地址
   */
  downLoadFile(key, localPath) {
    return this.getDownLoadLink(key).then(link => {
      const timeStamp = Date.now()
      const url = `${link}?time=${timeStamp}`
      return axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {'Cache-Control': 'no-cache'}
      }).then(res => {
        const writeable = fs.createWriteStream(localPath)
        res.data.pipe(writeable)
        return new Promise((resolve, reject) => {
          writeable.on('finish', resolve)
          writeable.on('error', reject)
        })
      })
    }).catch(err => {
      return Promise.reject({err})
    })
  }

  /**
   * 修改云空间文件名字，目前只支持在同一个bucket下修改
   * @param {String} key 文件原来的名字
   * @param {String} destKey 文件新的名字
   * @param {Object} options 配置文件
   */
  moveFile(key, destKey, options = {force: true}) {
    // 强制覆盖同名文件
    // const options = {
    //   force: true
    // }
    const bucket = this.bucket
    return new Promise((resolve, reject) => {
      this.bucketManager.move(bucket, key, bucket, destKey, options, this._handleCb(resolve, reject))
    })
  }

  /**
   * 查看云空间是否存在该文件
   * @param {String} key 文件在云空间的名字
   */
  getState(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(this.bucket, key, this._handleCb(resolve, reject))
    })
  }

  /**
   * callback处理统一函数
   * @param {Function} resolve promise resolve
   * @param {Function} reject promise reject
   */
  _handleCb(resolve, reject) {
    return (err, respBody, respInfo) => {
      if (err) {
        reject(err)
      } else {
        if (respInfo.statusCode === 200) {
          resolve(respBody)
        } else {
          reject({
            statusCode: respInfo.statusCode,
            respBody: respBody
          })
        }
      }
    }
  }
}

module.exports = QiniuManager
