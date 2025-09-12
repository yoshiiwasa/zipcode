'use strict';

$(() => {
  const $input = $('input');
  $input.focus();

  //サニタイズ
  // 入力欄からblurしたタイミングで変換
  $('#input').on('blur', function () {
    let val = $(this).val();

    // 1. 全角数字を半角数字に変換
    val = val.replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });

    // 2. 全角空白(\u3000)、半角空白(\s)、ハイフン(-)、全角ハイフンを削除
    val = val.replace(/[\u3000\s-－]/g, '');

    // 変換後の値をセット
    $(this).val(val);
  });

  //ボタンが押されたあとの処理
  const search = document.getElementById('search');
  search.addEventListener('click', async () => {

    const api = 'https://zipcloud.ibsnet.co.jp/api/search?zipcode=';
    const error = document.getElementById('error');
    const provided = document.getElementById('provided');
    const input = document.getElementById('input');
    const param = input.value
    const url = api + param;
    document.querySelector('div').textContent = '';

    // バリデーション
    const value = input.value.trim();
    const is7digits = /^[0-9]{7}$/.test(value);

    if (is7digits) {
      error.textContent = '';
    } else {
      error.textContent = '７桁の数字を入れてください';
      return;
    }

    // タイムアウト用コントローラ
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        error.textContent = `HTTPエラー: ${response.status}`;
        throw new Error(response.statusText);
      }

      error.textContent = '';
      const datas = await response.json();
      showFocusReset()

      if (datas.status === 400) {
        // バリデーション
        error.textContent = datas.message;
      } else if (datas.results === null) {
        error.textContent = '郵便番号から住所が見つかりませんでした。';
      } else {

        //オブジェクトを配列に変換し、データをブラウザに表示する
        const datasEntries = Object.entries(datas);
        const iLength = datasEntries[1][1];
        const mainItems = 6

        for (let i = 0; i < iLength.length; i++) {
          const datasDescendant = datasEntries[1][1][i]
          const datasDescendantEntries = Object.entries(datasDescendant);
          const container = document.getElementById('address-list');
          const ul = document.createElement('ul');
          for (let j = 0; j < mainItems; j++) {
            const li = document.createElement('li');
            li.textContent = datasDescendantEntries[j][1];
            ul.appendChild(li);
          }
          container.appendChild(ul);
        }
      }
    }

    catch (ex) {
      clearTimeout(timeoutId);
      if (ex.name === 'AbortError') {
        error.textContent = 'リクエストがタイムアウトしました';
        controller.abort()
      } else {
        console.log(ex);
      }
    }

    // ---------- 関数定義 ----------
    //入力した数値の表示と、入力欄のフォーカスとリセットをする
    function showFocusReset() {
      provided.textContent = '〒' + param;
      $(() => {
        $input.focus().val('');
      });
    }

  }, false);

});