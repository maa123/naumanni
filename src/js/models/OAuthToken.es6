import moment from 'moment'
import {Record} from 'immutable'
import {key as openpgpKey} from 'openpgp'


const OAuthTokenRecord = Record({  // eslint-disable-line new-cap
  host: '',

  access_token: null,
  refresh_tokend: null,
  created_at: null,
  scope: '',
  token_type: '',
})


/**
 * OAuthTokenを表す
 */
export default class OAuthToken extends OAuthTokenRecord {
  static storeName = 'oauth_tokens'
  static keyPath = 'address'
  static indexes = [
    ['access_token', ['host', 'access_token'], {unique: true}],
  ]

  /**
   * @constructor
   * @param {Objet} token
   */
  constructor(...args) {
    super(...args)
  }

  toJS() {
    const js = super.toJS()

    js.address = this.address
    return js
  }

  isEqual(other) {
    return this.access_token === other.access_token &&
      this.scope === other.scope &&
      this.token_type === other.token_type
  }

  isAlive() {
    return !this._failed && this._account
  }

  /**
   * tokenの初期化に失敗した事を設定する
   */
  markFailed() {
    this._failed = true
  }

  get accessToken() {
    return this.access_token
  }

  get address() {
    return `${this.host}::${this.access_token}`
  }

  get expiresAt() {
    // Mastodonでは使わん
    throw new Error('not implemented')
  }

  /**
   * APIRequesterを作る
   * TODO: 場所を考える
   */
  get requester() {
    if(!this._requester) {
      const {makeOAuthAPIRequester} = require('src/api/APIRequester')
      const MastodonAPISpec = require('src/api/MastodonAPISpec').default

      this._requester = makeOAuthAPIRequester(
        MastodonAPISpec, {
          token: this,
          endpoint: `https://${this.host}/api/v1`,
        })
      this._requester.extendTokenHandler = () => {}
    }
    return this._requester
  }

  /**
   * TokenがexpireしていたらTrueを返す
   * @return {bool}
   */
  isExpired() {
    // refresh_tokenが無い場合はexpiresしないと考える?
    if(!this.refresh_token)
      return false

    return this.expires.isBefore(moment())
  }

  //
  attachAccount(newAccount) {
    this._account = newAccount
  }

  attachInstance(newInstance) {
    this._instance = newInstance
  }

  get account() {
    return this._account
  }

  get acct() {
    return this._account ? this._account.acct : null
  }

  get instance() {
    return this._instance
  }

  toString() {
    return `<OAuthToken ${this.acct || this.host}:${this.accessToken}>`
  }

  // privacy
  get hasKeyPair() {
    return this.hasPrivateKey && this.account.hasPublicKey
  }

  get hasPrivateKey() {
    return this.privateKeyArmored ? true : false
  }

  get privateKeyArmored() {
    const keydata = localStorage.getItem(`pgp::privateKey::${this.acct}`)
    return keydata
  }

  get privateKey() {
    if(!this._privateKey) {
      const data = this.privateKeyArmored
      if(!data)
        return null
      this._privateKey = openpgpKey.readArmored(this.privateKeyArmored).keys[0]
    }
    return this._privateKey
  }
}
