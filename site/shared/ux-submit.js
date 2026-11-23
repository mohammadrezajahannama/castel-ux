/*
 * Castel UX — automatic result submission.
 *
 * A finished test's result code is encrypted with the admin's public key (RSA-OAEP-256 wraps an AES-256-GCM key)
 * and posted as an issue in the private results repo. Only the admin's private key, kept in the admin's browser,
 * opens it: the token in this page can create issues, but what it reads there is ciphertext.
 *
 * Results wait in a queue in localStorage until GitHub accepts them, so a dropped connection or a closed tab
 * loses nothing: every page that loads this file sends what is still waiting.
 *
 * Usage: await UXSubmit.submit({ code, testId, runId, variant })  → true when sent.
 *        await UXSubmit.counts(testId)  → { a: 4, b: 3, … } runs so far per variant, or null.
 */
(function () {
  "use strict";

  var REPO = window.UX_RESULTS_REPO || "";
  var KEY = window.UX_PUBLIC_KEY || null;
  var TOKEN = (function () {
    // submit-token.js (written at build time, not in the repo) sets it reversed and base64-encoded.
    try {
      return window.UX_SUBMIT_TOKEN ? atob(window.UX_SUBMIT_TOKEN).split("").reverse().join("") : "";
    } catch {
      return "";
    }
  })();
  var QUEUE_KEY = "ux-queue";
  var MAX_BODY = 60000; // GitHub's issue body limit is 65,536 characters.

  var ready = !!(REPO && KEY && TOKEN && window.crypto && crypto.subtle && window.fetch);

  function b64url(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function encrypt(text) {
    var enc = new TextEncoder();
    return Promise.all([
      crypto.subtle.importKey("jwk", KEY, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]),
      crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]),
    ]).then(function (keys) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return Promise.all([
        crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, keys[1], enc.encode(text)),
        crypto.subtle.exportKey("raw", keys[1]).then(function (raw) {
          return crypto.subtle.encrypt({ name: "RSA-OAEP" }, keys[0], raw);
        }),
      ]).then(function (parts) {
        var box = {
          v: 1,
          kid: KEY.kid || "",
          ek: b64url(new Uint8Array(parts[1])),
          iv: b64url(iv),
          ct: b64url(new Uint8Array(parts[0])),
        };
        return "CASTELENC1:" + b64url(enc.encode(JSON.stringify(box)));
      });
    });
  }

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeQueue(q) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch {}
  }

  function post(item) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctl) ctl.abort();
    }, 20000);
    return fetch("https://api.github.com/repos/" + REPO + "/issues", {
      method: "POST",
      signal: ctl ? ctl.signal : undefined,
      headers: {
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // The variant (e.g. the scenario) is in the title, so pages can balance groups without opening results.
        title: "ux:" + item.testId + ":" + item.runId + (item.variant ? ":" + item.variant : ""),
        body: "```\n" + item.payload + "\n```",
      }),
    })
      .then(function (r) {
        return r.status === 201;
      })
      .catch(function () {
        return false;
      })
      .finally(function () {
        clearTimeout(timer);
      });
  }

  var flushing = null;
  // Sends every waiting result, oldest first. Resolves with the run ids that were sent.
  function flush() {
    if (!ready) return Promise.resolve([]);
    if (flushing) return flushing;
    flushing = (async function () {
      var sent = [];
      for (var item of readQueue()) {
        if (await post(item)) {
          sent.push(item.runId);
          writeQueue(
            readQueue().filter(function (q) {
              return q.runId !== item.runId;
            }),
          );
        }
      }
      return sent;
    })().finally(function () {
      flushing = null;
    });
    return flushing;
  }

  function wait(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  // Queues one result and tries to send it: now, then after 3 and 8 seconds.
  async function submit(opts) {
    if (!ready) return false;
    var payload;
    try {
      payload = await encrypt(opts.code);
    } catch {
      return false;
    }
    if (payload.length > MAX_BODY) return false;
    var q = readQueue().filter(function (x) {
      return x.runId !== opts.runId;
    });
    q.push({ testId: opts.testId, runId: opts.runId, variant: opts.variant || "", payload: payload, at: Date.now() });
    writeQueue(q);
    for (var delay of [0, 3000, 8000]) {
      if (delay) await wait(delay);
      if ((await flush()).indexOf(opts.runId) >= 0) return true;
      if (
        !readQueue().some(function (x) {
          return x.runId === opts.runId;
        })
      )
        return true;
    }
    return false;
  }

  function pending() {
    return readQueue().length;
  }

  // How many runs of a test each variant has so far (one per run, partial or whole), from the issue titles.
  // Resolves null when GitHub can't be reached within `timeout` ms.
  function counts(testId, timeout) {
    if (!ready) return Promise.resolve(null);
    var prefix = "ux:" + testId + ":";
    var seen = {};
    var result = {};
    var work = (async function () {
      for (var page = 1; page <= 5; page++) {
        var r = await fetch(
          "https://api.github.com/repos/" + REPO + "/issues?state=all&per_page=100&page=" + page,
          { headers: { Authorization: "Bearer " + TOKEN, Accept: "application/vnd.github+json" } },
        );
        if (!r.ok) return null;
        var batch = await r.json();
        for (var issue of batch) {
          if (issue.pull_request || issue.title.indexOf(prefix) !== 0) continue;
          var parts = issue.title.slice(prefix.length).split(":");
          if (!parts[1] || seen[parts[0]]) continue;
          seen[parts[0]] = true;
          result[parts[1]] = (result[parts[1]] || 0) + 1;
        }
        if (batch.length < 100) break;
      }
      return result;
    })().catch(function () {
      return null;
    });
    return Promise.race([work, wait(timeout || 2500).then(function () { return null; })]);
  }

  window.UXSubmit = { ready: ready, submit: submit, flush: flush, pending: pending, counts: counts };

  // Results left from an earlier visit: send them now, and again when the connection comes back.
  if (ready) {
    setTimeout(flush, 1500);
    window.addEventListener("online", function () {
      flush();
    });
  }
})();
