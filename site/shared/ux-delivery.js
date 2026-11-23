/*
 * Castel UX — shared result delivery for every test page.
 *
 * The site has no server. At the end of a test, the page packs the result into a code (see each test's encode()),
 * and this module shows the tester how to send it to the admin: share the result file (Bale, Telegram, …),
 * download it, or copy the code. The admin panel imports the file or the code.
 *
 * This is the fallback when automatic sending (ux-submit.js) fails.
 *
 * Usage: UXDeliver.render(element, { code, testId, runId })
 */
(function () {
  "use strict";

  // Who receives the results. Shown to the tester when set, e.g. "@castel_ux" in Bale.
  var CONTACT = window.UX_CONTACT || "";

  var CSS =
    ".uxd{max-width:720px;margin:0 auto}" +
    ".uxd h1{font-size:26px;margin:0 0 8px}" +
    ".uxd p{line-height:1.9;margin:0 0 12px}" +
    ".uxd .uxd-row{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}" +
    ".uxd button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:12px 18px;cursor:pointer}" +
    ".uxd .uxd-main{background:#fad08c;color:#1b1b1b}" +
    ".uxd .uxd-sub{background:#343434;color:#fff}" +
    ".uxd textarea{width:100%;box-sizing:border-box;min-height:96px;direction:ltr;font:12px/1.5 monospace;" +
    "background:#141414;color:#d4d3d6;border:1px solid #343434;border-radius:12px;padding:12px;resize:vertical}" +
    ".uxd .uxd-msg{color:#59c56e;min-height:24px;margin:0}" +
    ".uxd details{margin-top:8px;color:#aeaeae}";

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }

  function fileFor(opts) {
    var name = "castel-ux-" + opts.testId + "-" + opts.runId + ".txt";
    return { name: name, blob: new Blob([opts.code], { type: "text/plain" }) };
  }

  function keepCopy(opts) {
    // A copy in this browser, so a closed tab does not lose the result.
    try {
      localStorage.setItem("ux-result:" + opts.testId + ":" + opts.runId, opts.code);
    } catch (e) {}
  }

  function render(root, opts) {
    keepCopy(opts);
    if (!document.getElementById("uxd-css")) {
      var st = el("style", { id: "uxd-css" });
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    var f = fileFor(opts);
    var file = null;
    try {
      file = new File([f.blob], f.name, { type: "text/plain" });
    } catch (e) {}
    var canShareFile = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));

    var box = el("div", { class: "uxd" });
    box.appendChild(el("h1", null, "ممنون! یک قدم مانده"));
    box.appendChild(
      el(
        "p",
        null,
        "جواب‌هایت خودکار ارسال نشدند (احتمالاً به خاطر اینترنت). فایل نتیجه را " +
          (CONTACT ? "در بله برای " + CONTACT : "برای کسی که لینک تست را برایت فرستاد") +
          " بفرست.",
      ),
    );

    var row = el("div", { class: "uxd-row" });
    var msg = el("p", { class: "uxd-msg", "aria-live": "polite" });

    if (canShareFile) {
      var share = el("button", { type: "button", class: "uxd-main" }, "ارسال فایل نتیجه (بله، تلگرام، …)");
      share.onclick = function () {
        navigator.share({ files: [file], title: "نتیجهٔ تست Castel" }).then(
          function () {
            msg.textContent = "ممنون! اگر فایل را فرستادی، کار تمام است.";
          },
          function () {},
        );
      };
      row.appendChild(share);
    }

    var dl = el("button", { type: "button", class: canShareFile ? "uxd-sub" : "uxd-main" }, "دانلود فایل نتیجه");
    dl.onclick = function () {
      var url = URL.createObjectURL(f.blob);
      var a = el("a", { href: url, download: f.name });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
      msg.textContent = "فایل دانلود شد. حالا آن را در بله بفرست.";
    };
    row.appendChild(dl);

    var ta = el("textarea", { readonly: "", "aria-label": "کد نتیجه" });
    ta.value = opts.code;
    ta.addEventListener("focus", function () {
      ta.select();
    });

    var cp = el("button", { type: "button", class: "uxd-sub" }, "کپی کد");
    cp.onclick = function () {
      navigator.clipboard.writeText(opts.code).then(
        function () {
          msg.textContent = "کد کپی شد. آن را در بله بفرست.";
        },
        function () {
          ta.focus();
          ta.select();
          msg.textContent = "کد را انتخاب کردیم. آن را کپی کن.";
        },
      );
    };
    row.appendChild(cp);

    if (window.UXSubmit && UXSubmit.ready) {
      var retry = el("button", { type: "button", class: "uxd-sub" }, "دوباره ارسال کن");
      retry.onclick = function () {
        retry.disabled = true;
        msg.textContent = "در حال ارسال…";
        UXSubmit.flush().then(function (sent) {
          retry.disabled = false;
          if (sent.indexOf(opts.runId) >= 0) thanks(root);
          else msg.textContent = "باز هم ارسال نشد. اتصال اینترنت را بررسی کن، یا فایل را در بله بفرست.";
        });
      };
      row.insertBefore(retry, row.firstChild);
      box.appendChild(
        el("p", null, "اگر الان نفرستی هم اشکالی ندارد: دفعهٔ بعد که این صفحه را باز کنی، خودش دوباره ارسال می‌کند."),
      );
    }
    box.appendChild(row);
    box.appendChild(msg);
    var more = el("details");
    more.appendChild(el("summary", null, "کد نتیجه (اگر فایل کار نکرد، این متن را بفرست)"));
    more.appendChild(ta);
    box.appendChild(more);

    root.innerHTML = "";
    root.appendChild(box);
  }

  // The page after a result is sent.
  function thanks(root) {
    root.innerHTML = "";
    var box = el("div", { class: "uxd", style: "text-align:center" });
    box.appendChild(el("h1", null, "ممنون! جواب‌هایت ثبت شد."));
    box.appendChild(el("p", null, "می‌توانی این صفحه را ببندی."));
    root.appendChild(box);
  }

  window.UXDeliver = { render: render, thanks: thanks };
})();
