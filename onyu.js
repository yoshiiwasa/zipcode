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

  // バリデーション
  const input = document.getElementById('input');
  const keikoku = document.getElementById('keikoku');

  input.addEventListener('blur', () => {
    const value = input.value.trim();
    const is7digits = /^[0-9]{7}$/.test(value);
    const submitBtn = document.getElementById('search');

    // サニタイズとバリデーションが済んでいなければボタンが押せない処理
    submitBtn.disabled = true;

    if (is7digits) {
      keikoku.textContent = '';
      submitBtn.disabled = false;
    } else {
      keikoku.textContent = '７桁の数字を入れてください';
    }
  });

  //ボタンが押されたあとの処理
  const search = document.getElementById('search');
  search.addEventListener('click', async () => {

    // タイムアウト用コントローラ
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const api = 'https://zipcloud.ibsnet.co.jp/api/search?zipcode=';
    const error = document.getElementById('error');
    const provided = document.getElementById('provided');
    const input = document.getElementById('input');
    const param = input.value
    const url = api + param;
    document.querySelector('div').textContent = '';

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        error.textContent = `HTTPエラー: ${response.status}`;
        throw new Error(response.statusText);
      }

      error.textContent = '';
      const datas = await response.json();

      if (datas.status === 400) {
        error.textContent = datas.message;
      } else if (datas.results === null) {
        error.textContent = '郵便番号から住所が見つかりませんでした。';
        showFocusReset()
      } else {
        showFocusReset()

        //オブジェクトを配列に変換し、データをブラウザに表示する
        const datasEntries = Object.entries(datas);
        const iLength = datasEntries[1][1];

        for (let i = 0; i < iLength.length; i++) {
          const datasDescendant = datasEntries[1][1][i]
          const datasDescendantEntries = Object.entries(datasDescendant);
          const container = document.getElementById('address-list');
          const ul = document.createElement('ul');
          for (let j = 0; j < 6; j++) {
            const li = document.createElement('li');
            li.textContent = datasDescendantEntries[j][1];
            ul.appendChild(li);
          }
          container.appendChild(ul);
        }
        clearTimeout(timeoutId);
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

  //入力した数値の表示と、入力欄のフォーカスとリセットをする関数
  function showFocusReset() {
    provided.textContent = '〒' + param;
    $(() => {
      $input.focus().val('');
    });
  }

  }, false);

});