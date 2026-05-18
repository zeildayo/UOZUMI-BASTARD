// ==UserScript==
// @name         UOZUMI BASTARD
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  問題演習の答えハイライトと修了証の偽装を行うスクリプト
// @match        https://joho.jun3010.me/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ページの本来の環境（コンテキスト）で直接コードを実行させるための工夫
    // これにより、サイト側のfetchやCanvasを確実に横取りできます。
    const cheatCode = function () {
        // ----------------------------------------------------
        // GUIパネルの追加
        // ----------------------------------------------------
        function initGUI() {
            if (document.getElementById('joholife-cheat-menu')) return;
            if (!document.body) return; // bodyがない場合はまだ追加しない

            // ハイライト用のCSSを注入
            if (!document.getElementById('joholife-cheat-styles')) {
                const style = document.createElement('style');
                style.id = 'joholife-cheat-styles';
                style.textContent = `
                    body[data-cheat-highlight="true"] .option-button[data-cheat-correct="true"] {
                        border: 2px solid #10b981 !important;
                        background-color: rgba(16, 185, 129, 0.1) !important;
                    }
                    .cheat-highlight-text {
                        display: none;
                    }
                    body[data-cheat-highlight="true"] .cheat-highlight-text {
                        display: inline;
                    }
                    body[data-cheat-highlight="true"] .cheat-auto-input-btn {
                        display: block !important;
                    }
                    .cheat-auto-input-btn {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
                document.body.setAttribute('data-cheat-highlight', 'true');
            }

            const gui = document.createElement('div');
            gui.id = 'joholife-cheat-menu';
            // スマホ向けにスタイルを最適化: widthを広げ、パディングを調整、フォントサイズを少し大きく
            gui.style = 'position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.85);color:white;padding:15px;border-radius:10px;z-index:2147483647;font-family:sans-serif;box-shadow: 0 4px 12px rgba(0,0,0,0.6); width: min(300px, 92vw); max-height: 85vh; overflow-y: auto; touch-action: none;';
            gui.innerHTML = `
                <div id="cheat-header" style="cursor:grab; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #444; padding-bottom:10px; margin-bottom:12px;">
                    <h3 style="margin:0; font-size:16px; color:#10b981; user-select:none; font-weight:bold;">🙃UOZUMI BASTARD🙃</h3>
                    <div style="display:flex; gap: 10px; align-items:center;">
                        <button id="cheat-rescan-btn" style="background:#444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">♻️</button>
                        <span id="cheat-toggle-icon" style="font-size:16px; color:#aaa; cursor:pointer; padding:0 5px; user-select:none;">▼</span>
                    </div>
                </div>
                <div id="cheat-content">
                    <div style="margin-bottom:12px;">
                        <label style="display:flex;align-items:center;font-size:14px;cursor:pointer;background:#222;padding:8px;border-radius:6px;border:1px solid #444;">
                            <input type="checkbox" id="cheat-highlight-toggle" checked style="margin-right:10px; width:18px; height:18px; cursor:pointer;">
                            正解ハイライトを表示
                        </label>
                    </div>
                    <div style="margin-bottom:10px; border-top:1px solid #444; padding-top:10px;">
                        <label style="display:block;font-size:12px;margin-bottom:4px;color:#ccc;">名前 (Name):</label>
                        <input type="text" id="cheat-name" placeholder="修了証の名前を上書き" style="width:100%;box-sizing:border-box;background:#111;color:#10b981;border:1px solid #555;padding:8px;border-radius:4px;font-size:14px;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block;font-size:12px;margin-bottom:4px;color:#ccc;">端末 (UserAgent):</label>
                        <input type="text" id="cheat-ua" placeholder="詳しい人以外は値を入力するのを非推奨"  style="width:100%;box-sizing:border-box;background:#111;color:#10b981;border:1px solid #555;padding:8px;border-radius:4px;font-size:14px;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block;font-size:12px;margin-bottom:4px;color:#ccc;">画面 (Screen):</label>
                        <input type="text" id="cheat-screen" placeholder="空欄の場合は自分の画面比率" style="width:100%;box-sizing:border-box;background:#111;color:#10b981;border:1px solid #555;padding:8px;border-radius:4px;font-size:14px;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block;font-size:12px;margin-bottom:4px;color:#ccc;">発行時刻 (Time):</label>
                        <input type="text" id="cheat-time" value="" placeholder="空欄の場合は実際の時刻を使用" style="width:100%;box-sizing:border-box;background:#111;color:#10b981;border:1px solid #555;padding:8px;border-radius:4px;font-size:14px;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block;font-size:12px;margin-bottom:4px;color:#ccc;">アクセス元 (IP):</label>
                        <input type="text" id="cheat-ip" placeholder="空欄の場合は自分のIP" style="width:100%;box-sizing:border-box;background:#111;color:#10b981;border:1px solid #555;padding:8px;border-radius:4px;font-size:14px;">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block;font-size:12px;margin-bottom:4px;color:#ccc;">端末識別 (Device Hash):</label>
                        <input type="text" id="cheat-hash" value="" placeholder="空欄の場合は自動生成の番号" style="width:100%;box-sizing:border-box;background:#111;color:#10b981;border:1px solid #555;padding:8px;border-radius:4px;font-size:14px;">
                    </div>
                    <div style="font-size:11px;color:#777;margin-top:8px;text-align:center;">※修了証生成時に自動適用</div>
                </div>
            `;
            document.body.appendChild(gui);

            // 最小化・展開のイベント
            document.getElementById('cheat-toggle-icon').addEventListener('click', (e) => {
                const content = document.getElementById('cheat-content');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    e.target.innerText = '▼';
                } else {
                    content.style.display = 'none';
                    e.target.innerText = '▲';
                }
            });

            // 手動再スキャンボタンのイベント
            document.getElementById('cheat-rescan-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // ドラッグイベントの発火を防ぐ
                scanHighlights();
            });

            // ドラッグ機能の実装 (マウス & タッチ)
            const header = document.getElementById('cheat-header');
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;

            function dragStart(e) {
                // ボタン類をクリックした場合はドラッグを開始しない
                if (e.target.id === 'cheat-toggle-icon' || e.target.id === 'cheat-rescan-btn') return;

                const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

                initialX = clientX - xOffset;
                initialY = clientY - yOffset;
                isDragging = true;
                header.style.cursor = 'grabbing';
            }

            function drag(e) {
                if (isDragging) {
                    if (e.type === 'touchmove') {
                        // タッチ中の画面スクロールを完全に防止（スマホでの操作性向上のため）
                        e.preventDefault();
                    }

                    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

                    currentX = clientX - initialX;
                    currentY = clientY - initialY;
                    xOffset = currentX;
                    yOffset = currentY;
                    gui.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
            }

            function dragEnd(e) {
                if (!isDragging) return;
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                header.style.cursor = 'grab';
            }

            header.addEventListener('mousedown', dragStart);
            header.addEventListener('touchstart', dragStart, { passive: false });
            // document 全体でイベントを監視することで、ドラッグが速すぎて要素から外れても追従する
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchend', dragEnd);


            // ハイライトのリアルタイム切り替えイベント
            document.getElementById('cheat-highlight-toggle').addEventListener('change', (e) => {
                document.body.setAttribute('data-cheat-highlight', e.target.checked ? 'true' : 'false');
            });

            console.log("script injected...");
        }

        // 画面の再描画対策（1秒に1回監視して必要なら復活させる）
        setInterval(() => {
            if (!document.getElementById('joholife-cheat-menu')) {
                initGUI();
            }
        }, 1000);

        // ----------------------------------------------------
        // Canvas描画のフック (修了証の偽装)
        // ----------------------------------------------------
        const originalFillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
            if (typeof text === 'string') {
                const nameInput = document.getElementById('cheat-name')?.value;
                const timeInput = document.getElementById('cheat-time')?.value;
                const ipInput = document.getElementById('cheat-ip')?.value;
                const uaInput = document.getElementById('cheat-ua')?.value;
                const screenInput = document.getElementById('cheat-screen')?.value;
                const hashInput = document.getElementById('cheat-hash')?.value;

                // y === 240 は修了証で名前が描画されるY座標
                if (y === 240 && nameInput && nameInput.trim() !== '') {
                    text = nameInput;
                }

                if (text.startsWith('発行時刻: ') && timeInput && timeInput.trim() !== '') {
                    text = `発行時刻: ${timeInput}`;
                }
                if (text.startsWith('アクセス元: ') && ipInput && ipInput.trim() !== '') {
                    text = `アクセス元: ${ipInput}`;
                }
                if (text.startsWith('端末: ') && uaInput && uaInput.trim() !== '') {
                    text = `端末: ${uaInput}`;
                }
                if (text.startsWith('画面: ') && screenInput && screenInput.trim() !== '') {
                    text = `画面: ${screenInput}`;
                }
                if (text.startsWith('端末識別: ') && hashInput && hashInput.trim() !== '') {
                    text = `端末識別: ${hashInput}`;
                }
            }
            return originalFillText.apply(this, arguments);
        };

        // ----------------------------------------------------
        // 問題データの自動取得と解析
        // ----------------------------------------------------
        let correctAnswersMap = {};

        function fetchAndParseQuestions() {
            // URLから問題の識別子（例: binary_conversion）を取得
            const match = location.pathname.match(/\/quiz\/([^\/]+)/);
            if (match && match[1]) {
                const quizId = match[1];
                const yamlUrl = `/questions/${quizId}/questions.yaml`;
                console.log("[Debug] 問題データを自動取得します:", yamlUrl);

                fetch(yamlUrl)
                    .then(res => {
                        if (!res.ok) throw new Error("Network response was not ok");
                        return res.text();
                    })
                    .then(yamlText => {
                        correctAnswersMap = {};
                        const lines = yamlText.split('\n');
                        let currentQuestionId = null;
                        let currentOptionId = null;

                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            const trimmed = line.trim();

                            if (trimmed.startsWith('- id:')) {
                                const id = trimmed.substring(5).trim().replace(/['"]/g, '');
                                const indent = line.search(/\S/);
                                if (indent === 2 || indent === 4) {
                                    currentQuestionId = id;
                                    correctAnswersMap[currentQuestionId] = [];
                                } else if (indent === 6 || indent === 8) {
                                    currentOptionId = id;
                                }
                            }
                            else if (trimmed.startsWith('answer:')) {
                                if (currentQuestionId) {
                                    correctAnswersMap[currentQuestionId].push(trimmed.substring(7).trim().replace(/['"]/g, ''));
                                }
                            }
                            else if (trimmed.startsWith('isCorrect:')) {
                                const isCorrect = trimmed.includes('true');
                                if (isCorrect && currentQuestionId && currentOptionId) {
                                    correctAnswersMap[currentQuestionId].push(currentOptionId);
                                }
                            }
                        }
                        console.log("[Debug] 問題データの正解を解析しました:", correctAnswersMap);
                        scanHighlights();
                    })
                    .catch(err => {
                        console.error("[Debug] 問題データの自動取得に失敗しました:", err);
                    });
            }
        }

        // ページ遷移時にも対応できるようURL変更を検知
        let lastUrl = location.href;
        setInterval(() => {
            if (lastUrl !== location.href) {
                lastUrl = location.href;
                fetchAndParseQuestions();
            }
        }, 1000);

        // 初回実行
        fetchAndParseQuestions();

        // ----------------------------------------------------
        // ハイライト処理の実体
        // ----------------------------------------------------
        function scanHighlights() {
            // 選択肢問題
            const buttons = document.querySelectorAll('.option-button');
            buttons.forEach(btn => {
                const qId = btn.getAttribute('data-question-id');
                const oId = btn.getAttribute('data-option-id');

                // 正解データがある場合のみ処理
                if (qId && oId && correctAnswersMap[qId]) {
                    if (correctAnswersMap[qId].includes(oId)) {
                        btn.setAttribute('data-cheat-correct', 'true'); // CSS用属性

                        if (!btn.querySelector('.cheat-highlight-text')) {
                            const span = document.createElement('span');
                            span.className = 'cheat-highlight-text'; // CSSで表示切替
                            span.innerHTML = ' <strong style="color:#10b981;">[✓正解]</strong>';
                            const textContainer = btn.querySelector('span');
                            if (textContainer) {
                                textContainer.appendChild(span);
                            }
                        }
                    }
                    btn.setAttribute('data-cheated', 'true'); // 処理済みマーク
                }
            });

            // テキスト入力問題
            const textInput = document.getElementById('text-input-answer');
            if (textInput) {
                const qId = textInput.getAttribute('data-question-id');
                if (qId && correctAnswersMap[qId] && correctAnswersMap[qId].length > 0 && !textInput.nextSibling?.classList?.contains('cheat-auto-input-btn')) {
                    const answer = correctAnswersMap[qId][0];
                    const helperBtn = document.createElement('button');
                    helperBtn.className = 'cheat-auto-input-btn'; // CSSで表示切替
                    helperBtn.innerText = `💡 正解を自動入力: ${answer}`;
                    helperBtn.style = 'margin-top: 8px; background: #10b981; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 13px; display: block;';
                    helperBtn.onclick = (e) => {
                        e.preventDefault();
                        textInput.value = answer;
                        textInput.dispatchEvent(new Event('input', { bubbles: true }));
                    };
                    textInput.parentNode.insertBefore(helperBtn, textInput.nextSibling);
                }
            }
        }

        // ----------------------------------------------------
        // DOM監視 (正解のハイライト処理)
        // ----------------------------------------------------
        const observer = new MutationObserver((mutations) => {
            scanHighlights();
        });

        // 監視開始
        function startObserver() {
            if (document.documentElement) {
                observer.observe(document.documentElement, { childList: true, subtree: true });
                scanHighlights(); // 初回スキャン
            } else {
                setTimeout(startObserver, 100);
            }
        }
        startObserver();

    };

    // 実際のページ（コンテキスト）にスクリプトを注入して実行する
    const script = document.createElement('script');
    script.textContent = '(' + cheatCode.toString() + ')();';

    function inject() {
        if (document.head || document.documentElement) {
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } else {
            setTimeout(inject, 10);
        }
    }
    inject();

})();

