(function(){
  'use strict';

  var CONFIG = {
    variantId: '2026-07-11_lp_v1',
    scrollThresholds: [25, 50, 75, 90]
  };

  var sent = {};
  var PENDING_SUBMISSION_KEY = 'kb_pending_submission';
  var PROCESSED_SUBMISSIONS_KEY = 'kb_processed_submissions';

  function getParam(url, names) {
    for (var i = 0; i < names.length; i += 1) {
      var value = url.searchParams.get(names[i]);
      if (value) return value;
    }
    return '';
  }

  function readAttribution() {
    var url = new URL(window.location.href);
    var current = {
      source: getParam(url, ['utm_source']),
      medium: getParam(url, ['utm_medium']),
      campaign: getParam(url, ['utm_campaign']),
      campaign_id: getParam(url, ['utm_id', 'campaign_id', 'campaignid']),
      adgroup: getParam(url, ['adgroup', 'adgroup_id', 'adgroupid', 'utm_content']),
      keyword: getParam(url, ['utm_term', 'keyword']),
      search_term: getParam(url, ['search_term', 'query', 'q'])
    };

    if ((url.searchParams.get('gclid') || url.searchParams.get('gbraid') || url.searchParams.get('wbraid')) && !current.source) {
      current.source = 'google';
      current.medium = 'cpc';
    }

    var hasCampaignParams = Object.keys(current).some(function(key){ return Boolean(current[key]); });
    var stored = {};
    try {
      stored = JSON.parse(window.sessionStorage.getItem('kb_tracking_attribution') || '{}');
    } catch (error) {
      stored = {};
    }

    var merged = hasCampaignParams ? Object.assign({}, stored, current) : stored;
    if (hasCampaignParams) {
      try {
        window.sessionStorage.setItem('kb_tracking_attribution', JSON.stringify(merged));
      } catch (error) {}
    }

    return {
      source: merged.source || current.source || '',
      medium: merged.medium || current.medium || '',
      campaign: merged.campaign || current.campaign || '',
      campaign_id: merged.campaign_id || current.campaign_id || '',
      adgroup: merged.adgroup || current.adgroup || '',
      keyword: merged.keyword || current.keyword || '',
      search_term: merged.search_term || current.search_term || ''
    };
  }

  function getDevice() {
    var width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width <= 767) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  function commonParams() {
    var attribution = readAttribution();
    return Object.assign({
      page_path: window.location.pathname,
      page_title: document.title,
      device: getDevice(),
      screen_width: window.innerWidth || document.documentElement.clientWidth || 0,
      referrer: document.referrer || '',
      variant_id: CONFIG.variantId
    }, attribution);
  }

  function sessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function sessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function sessionRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {}
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(sessionGet(key) || '') || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'submission_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }

  function prepareFormSuccess(formId) {
    var submission = {
      submission_id: createSubmissionId(),
      variant_id: CONFIG.variantId,
      form_id: formId || 'diagnosis-form'
    };
    sessionSet(PENDING_SUBMISSION_KEY, JSON.stringify(submission));
    return submission;
  }

  function processedSubmissions() {
    var items = readJson(PROCESSED_SUBMISSIONS_KEY, []);
    return Array.isArray(items) ? items : [];
  }

  function markSubmissionProcessed(submissionId) {
    var items = processedSubmissions().filter(function(item){
      return item !== submissionId;
    });
    items.unshift(submissionId);
    sessionSet(PROCESSED_SUBMISSIONS_KEY, JSON.stringify(items.slice(0, 20)));
  }

  function consumePendingSubmission() {
    var pending = readJson(PENDING_SUBMISSION_KEY, null);
    if (!pending || !pending.submission_id) {
      return null;
    }

    if (processedSubmissions().indexOf(pending.submission_id) !== -1) {
      sessionRemove(PENDING_SUBMISSION_KEY);
      return null;
    }

    markSubmissionProcessed(pending.submission_id);
    sessionRemove(PENDING_SUBMISSION_KEY);
    return pending;
  }

  function track(eventName, params, options) {
    var opts = options || {};
    var key = opts.onceKey;
    if (key && sent[key]) return;
    if (key) sent[key] = true;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({
      event: eventName
    }, commonParams(), params || {}));
  }

  function scrollPercent() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    var scrollHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight);
    var viewport = window.innerHeight || doc.clientHeight || 0;
    var denominator = Math.max(scrollHeight - viewport, 1);
    return Math.min(100, Math.round((scrollTop / denominator) * 100));
  }

  function bindScroll(eventName, prefix) {
    var fired = {};
    var ticking = false;

    function check() {
      ticking = false;
      var percent = scrollPercent();
      CONFIG.scrollThresholds.forEach(function(threshold){
        if (percent >= threshold && !fired[threshold]) {
          fired[threshold] = true;
          track(eventName, {scroll_percent: threshold}, {onceKey: prefix + '_' + threshold});
        }
      });
    }

    window.addEventListener('scroll', function(){
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(check);
    }, {passive: true});
    check();
  }

  function getCtaId(button) {
    if (button.dataset.ctaId) return button.dataset.ctaId;
    var location = button.dataset.ctaLocation || '';
    if (location === 'hero') return 'hero';
    if (location === 'header' || button.closest('.site-header')) return 'floating';
    if (location === 'footer' || button.closest('#contact') || button.closest('footer')) return 'bottom';
    return 'middle';
  }

  function bindCtas() {
    document.querySelectorAll('.btn-primary[href]').forEach(function(button){
      button.classList.add('js-cta-track');
      if (!button.dataset.ctaLocation) {
        button.dataset.ctaLocation = button.closest('.hero') ? 'hero' : button.closest('.site-header') ? 'header' : 'cta';
      }
      button.addEventListener('click', function(){
        track('cta_click', {
          cta_id: getCtaId(button),
          cta_location: button.dataset.ctaLocation,
          link_url: button.href
        });
      });
    });
  }

  function firstInvalidField(form) {
    return form.querySelector(':invalid');
  }

  function bindForm() {
    var form = document.getElementById('diagnosis-form');
    if (!form) return;

    track('form_view', {form_id: form.id}, {onceKey: 'form_view'});
    bindScroll('form_scroll', 'form_scroll');

    form.addEventListener('focusin', function(event){
      var target = event.target;
      if (!target || target.name === 'website') return;
      if (target.matches('input, textarea, select')) {
        track('form_start', {form_id: form.id, field_name: target.name || target.id || ''}, {onceKey: 'form_start'});
      }
    });

    form.addEventListener('submit', function(){
      track('form_submit', {form_id: form.id});
      window.setTimeout(function(){
        var invalid = firstInvalidField(form);
        if (invalid) {
          track('form_error', {
            form_id: form.id,
            field_name: invalid.name || invalid.id || '',
            error_type: invalid.validity && invalid.validity.typeMismatch ? 'type_mismatch' : 'required'
          });
        }
      }, 0);
    }, true);
  }

  window.KBTracking = {
    config: CONFIG,
    track: track,
    prepareFormSuccess: prepareFormSuccess,
    trackFormError: function(fieldName, errorType) {
      track('form_error', {
        form_id: 'diagnosis-form',
        field_name: fieldName || '',
        error_type: errorType || 'unknown'
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function(){
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    track('page_view', {}, {onceKey: 'page_view_' + path});

    if (path === '/' || path === '/index.html') {
      bindCtas();
      bindScroll('lp_scroll', 'lp_scroll');
    } else if (path === '/form' || path === '/form.html') {
      bindForm();
    } else if (path === '/thanks' || path === '/thanks.html') {
      var submission = consumePendingSubmission();
      if (submission) {
        track('form_success', {
          submission_id: submission.submission_id,
          variant_id: submission.variant_id || CONFIG.variantId,
          form_id: submission.form_id || 'diagnosis-form'
        }, {onceKey: 'form_success_' + submission.submission_id});
      }
    }
  });
})();
