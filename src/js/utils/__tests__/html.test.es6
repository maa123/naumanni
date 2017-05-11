import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG
} from 'src/constants'

import {parseMastodonHtml} from '../html'


const MENTION_RE = /(?:^|[^\/\w])@([a-z0-9_]+(?:@[a-z0-9\.\-]+[a-z0-9]+)?)/i


describe('parseMastodonHtml', () => {
  it('can parse html status', () => {
    const TEST_CONTENT = '<p>ぶっちゃけ最近は尻も好きです<br />PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [])
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: 'ぶっちゃけ最近は尻も好きです'})
    expect(tokens[1]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[2]).toMatchObject({type: TOKEN_TEXT, text: 'PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1'})
  })

  it('can parse link, tag, mention status', () => {
    const TEST_CONTENT = 'http://www.google.com/ @shn@oppai.tokyo @hogehoge #tagA #日本語tag'

    const tokens = parseMastodonHtml(TEST_CONTENT, null)
    expect(tokens).toHaveLength(9)
    expect(tokens[0]).toMatchObject({type: TOKEN_URL, url: 'http://www.google.com/'})
    expect(tokens[1]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    // mentionsを与えていないのでtextになる
    expect(tokens[2]).toMatchObject({type: TOKEN_TEXT, text: '@shn@oppai.tokyo'})
    expect(tokens[3]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    // mentionsを与えていないのでtextになる
    expect(tokens[4]).toMatchObject({type: TOKEN_TEXT, text: '@hogehoge'})
    expect(tokens[5]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[6]).toMatchObject({type: TOKEN_HASHTAG, tag: 'tagA'})
    expect(tokens[7]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[8]).toMatchObject({type: TOKEN_HASHTAG, tag: '日本語tag'})
  })

  it('can parse real mastodon status', () => {
    const TEST_CONTENT = '<p><span class="h-card"><a href="https://oppai.tokyo/@shn">@<span>shn</span></a></span> <span class="h-card"><a href="https://friends.nico/@shn">@<span>shn</span></a></span> <span class="h-card"><a href="https://mstdn.onosendai.jp/@shn">@<span>shn</span></a></span> どうなんだろこれ</p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [
      {url: "https://oppai.tokyo/@shn", acct: "shn@oppai.tokyo", id: 4182, username: "shn"},
      {url: "https://friends.nico/@shn", acct: "shn@friends.nico", id: 11834, username: "shn"},
      // {url: "https://mstdn.onosendai.jp/@shn", acct: "shn", id: 983, username: "shn"},
    ])

    expect(tokens).toHaveLength(6)
    expect(tokens[0]).toMatchObject({
      type: TOKEN_MENTION,
      acct: "shn@oppai.tokyo",
      source: "<span class=\"h-card\"><a href=\"https://oppai.tokyo/@shn\">@<span>shn</span></a></span>",
    })
    expect(tokens[1]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[2]).toMatchObject({
      type: TOKEN_MENTION,
      acct: "shn@friends.nico",
      source: "<span class=\"h-card\"><a href=\"https://friends.nico/@shn\">@<span>shn</span></a></span>",
    })
    expect(tokens[3]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[4]).toMatchObject({type: TOKEN_TEXT, text: '@shn'})
    expect(tokens[5]).toMatchObject({type: TOKEN_TEXT, text: ' どうなんだろこれ'})
  })

  it('can parse real friends.nico status', () => {
    const TEST_CONTENT = '<p>よかったら<br /><a href="https://nico.ms/lv297979410" rel="nofollow noopener" target="_blank"><span>lv297979410</span></a></p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [])

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: 'よかったら'})
    expect(tokens[1]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[2]).toMatchObject({
      type: TOKEN_URL,
      url: 'https://nico.ms/lv297979410',
      source: '<a href="https://nico.ms/lv297979410" rel="nofollow noopener" target="_blank"><span>lv297979410</span></a>',
    })
  })

  it('can parse real pawoo.net status', () => {
    const TEST_CONTENT = '<p>@shn@mastdn.onosendai.jp <span class="h-card"><a href="https://oppai.tokyo/@shn">@<span>shn</span></a></span> <br>はなげ</p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [
      {url: "https://oppai.tokyo/@shn", acct: "shn@oppai.tokyo", id: 1, username: "shn"}
    ])

    expect(tokens).toHaveLength(5)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: '@shn@mastdn.onosendai.jp '})
    expect(tokens[1]).toMatchObject({
      type: TOKEN_MENTION,
      acct: 'shn@oppai.tokyo',
      source: "<span class=\"h-card\"><a href=\"https://oppai.tokyo/@shn\">@<span>shn</span></a></span>",
    })
    expect(tokens[2]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[3]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[4]).toMatchObject({type: TOKEN_TEXT, text: 'はなげ'})
  })

  it('can parse sample 1', () => {
    let tokens

    tokens = parseMastodonHtml('あぶらあげがすきです．あとジャクリン．JavaScriptとかC++書いてるかも．二回データ飛ばすことになったけど一応インスタンス運用してます: <a href="https://mstdn.jp/"><span class="invisible">https://</span><span class="">mstdn.jp/</span><span class="invisible"></span></a> Twitter: <a href="https://twitter.com/nullkal"><span class="invisible">https://</span><span class="">twitter.com/nullkal</span><span class="invisible"></span></a> 支援はこちら: <a href="https://enty.jp/nullkal"><span class="invisible">https://</span><span class="">enty.jp/nullkal</span><span class="invisible"></span></a>', [])
    expect(tokens).toHaveLength(6)

    tokens = parseMastodonHtml(`<p>若い世代の読書術　<br><a href="http://aikoumasanobu.com/"><span class="invisible">http://</span><span class="">aikoumasanobu.com/</span><span class="invisible"></span></a><br>Faceboo　<a href="https://www.facebook.com/masanobuaiko/"><span class="invisible">https://www.</span><span class="">facebook.com/masanobuaiko/</span><span class="invisible"></span></a><br>pawoo.netアカ：<a href="https://pawoo.net/@masanobu"><span class="invisible">https://</span><span class="">pawoo.net/@masanobu</span><span class="invisible"></span></a></p>`)
    expect(tokens).toHaveLength(9)
  })
})