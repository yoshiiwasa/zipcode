'use strict';

{
const error = document.querySelector('#error');
const search = document.querySelector('#search');
const input = document.querySelector('#zipcode');
const reset = document.querySelector('#reset');
const addr = document.querySelector('#addr');
const nowzip = document.querySelectorAll('.nowzip');

reset.addEventListener('click', () => {
  input.value = '';
  input.focus();
});

// addEventListener(event type: ex. 'click', callback関数: ()=> {}, option: default = false)
search.addEventListener('click', async () => {
  // 郵便番号API endpoint
  const url = 'https://zipcloud.ibsnet.co.jp/api/search?zipcode=';

  //入力値のサニタイズ
  let param = getSanitize(input.value);
  console.log(param);

  //エラーメッセージクリア
  error.textContent = '';

  //zipcode表示クリア
  editContents(nowzip, '');

  //既存の検索結果を削除
  while ( addr.firstChild ) {
     addr.removeChild( addr.firstChild);
  }

  //入力された郵便番号の検証
  if ( ! validZipcode(param) )
  {
    error.textContent = '郵便番号が不正です。' + input.value;
    // input.value = '';
    input.focus();
    return;
  }


  try
  {
    const response = await fetch(url + param, { signal: AbortSignal.timeout(10000) } );
    const zipData = await response.json();

    if ( zipData.status === 200)
    {
      //zipcode表示
      editContents(nowzip, `郵便番号 : ${param}`);
      setHtml('#addr', zipData.results);
    }
    else
    {
      error.textContent = '郵便番号から住所が見つかりませんでした。';
    }
  }
  catch (ex)
  {
    if (ex.name === 'TimeoutError') {
      console.error("タイムアウトしました");
    }

    console.log(ex.name);
    error.textContent = `エラーが発生しました: ${ex.message}`;
  }

}, false);

// ---------- 関数定義 -------------------

/** 
 * classなどで指定された複数の要素の内容を書き換える　
 *  ex. <p class="xxxx"></p>
 *
 * edit(elemensts, '文字列')
 */
function editContents(elemensts, str)
{
  elemensts.forEach((el, index) => {
    el.textContent = `${str}`;
  });
}

//動的に結果を表示
function setHtml(selector, arrAddreses)
{
  let tr = {};
  let td = {};
  const dom = document.querySelector(selector);
  console.log(dom.className); 
  arrAddreses.forEach( (address) => {
    tr = document.createElement('tr');
    td = {};

    for (const key in address)
    {
      console.log(`${key} ${address[key]}`);
      td = document.createElement('td');
      td.textContent = address[key];
      tr.appendChild(td);
    }

    dom.appendChild(tr);
  } );
}

// 全角英数字を半角に変換する
function toHalfWidth(str) {
  str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  return str;
}

//サニタイズされた値を取得する
function getSanitize(str)
{
	const converted = toHalfWidth(str.trim());
	console.log(converted);
	return  converted.replace(/[ー\-　 ]/g, '');
}

//郵便番号を検証する
function validZipcode(str)
{
	const pattern = /^[0-9]{3}-?[0-9]{4}$/;
	console.log(str);
	console.log(pattern.test(`${str}`));
	return pattern.test(`${str}`);
}

}
