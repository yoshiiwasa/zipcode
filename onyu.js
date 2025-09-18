'use strict';

{
  const search = document.getElementById('search');
  const error = document.getElementById('error');
  const provided = document.getElementById('provided');
  const $zipcode = $('#zipcode');
  const api = 'https://zipcloud.ibsnet.co.jp/api/search?zipcode=';

  //サイトを開いた時に入力欄にフォーカスされた状態にする
  $(() => {
    $zipcode.focus();
  });

  // blurまたはEnterキー押下時にサニタイズを行う
  $zipcode.on('blur keydown', function (event) {
    if (event.type === 'blur' || event.key === 'Enter') {
      const clean = sanitizeValue($(this).val());
      $(this).val(clean);
    }
  });

  // 入力欄でEnterキーが押されたら検索する
  document.getElementById("zipcode").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      document.getElementById("search").click();
    }
  });

  //ボタンが押されたあとの処理
  search.addEventListener('click', async () => {
    error.textContent = '';
    provided.textContent = '';
    document.querySelector('#address-list').textContent = '';

    // バリデーション
    const zipcodeInput = zipcode.value;
    const is7digits = /^[0-9]{7}$/.test(zipcodeInput);
    if (!is7digits) {
      error.textContent = '７桁の数字を入れてください';
      return;
    }

    try {
      const response = await fetch(api + zipcodeInput, { signal: AbortSignal.timeout(10000) });
      const datas = await response.json();
      showFocusReset(zipcodeInput)

      if (datas.results === null) {
        error.textContent = '郵便番号から住所が見つかりませんでした。';
      } else {
        //検索が成功したとき、結果を表示する
        showResult(datas.results)
      }

    } catch (ex) {
      if (ex.name === 'TimeoutError') {
        error.textContent = 'リクエストがタイムアウトしました。';
      }
      error.textContent = `エラー : ${ex.message}`;
      console.log(ex);
    }

  }, false);

  // ---------- 関数定義 ----------
  //入力した数値の表示と、入力欄のフォーカスとリセットをする関数
  function showFocusReset(zipcode) {
    provided.textContent = '〒' + zipcode;
    $(() => {
      $zipcode.focus().val('');
    });
  }

  //オブジェクトを配列に変換し、データをブラウザに表示する関数
  function showResult(datasResults) {
    //mainItems = address1, address2, address3, kana1, kana2, kana3 の６つ
    const mainItems = 6;
    for (let i = 0; i < datasResults.length; i++) {
      const datasEntries = Object.entries(datasResults[i]);
      const container = document.getElementById('address-list');
      const ul = document.createElement('ul');
      for (let j = 0; j < mainItems; j++) {
        const li = document.createElement('li');
        li.textContent = datasEntries[j][1];
        ul.appendChild(li);
      }
      container.appendChild(ul);
    }
  }

  // サニタイズ関数
  function sanitizeValue(zipcode) {
    let val = zipcode.replace(/[０-９]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );
    val = val.replace(/[\u3000\s\-–−－]/g, '');
    return val;
  }
}