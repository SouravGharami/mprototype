/* Msafiri — lightweight SVG charts (no dependencies). Each function returns an HTML string. */
(function (global) {
  'use strict';
  var M = (global.Msafiri = global.Msafiri || {});
  var esc = M.esc;

  function niceMax(v) {
    var raw = (v || 1) / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    var m = steps.filter(function (x) { return x >= n - 1e-9; })[0] || 10;
    return m * p * 4;
  }
  function fmt(n) { return n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); }

  function axes(labels, max, H, pad, W) {
    var out = '', ticks = 4;
    for (var i = 0; i <= ticks; i++) {
      var y = pad.t + (H - pad.t - pad.b) * (1 - i / ticks);
      out += '<line class="grid-line" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(Math.round(max * i / ticks)) + '</text>';
    }
    var step = (W - pad.l - pad.r) / labels.length;
    labels.forEach(function (l, i) {
      if (labels.length > 10 && i % 2) return;
      out += '<text x="' + (pad.l + step * i + step / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>';
    });
    return out;
  }

  /* barChart({ labels, series:[{name, values, color}], height, ariaLabel }) — grouped bars */
  M.barChart = function (o) {
    var W = o.width || 640, H = o.height || 260, pad = { l: 40, r: 8, t: 12, b: 28 };
    var all = [].concat.apply([], o.series.map(function (s) { return s.values; }));
    var max = niceMax(Math.max.apply(null, all));
    var step = (W - pad.l - pad.r) / o.labels.length;
    var gw = step * 0.62, bw = gw / o.series.length - 2;
    var bars = '';
    o.labels.forEach(function (l, i) {
      o.series.forEach(function (s, j) {
        var v = s.values[i], h = (H - pad.t - pad.b) * (v / max);
        var x = pad.l + step * i + (step - gw) / 2 + j * (bw + 2);
        bars += '<rect class="bar" x="' + x + '" y="' + (H - pad.b - h) + '" width="' + bw + '" height="' + h + '" rx="3" fill="' + (s.color || 'var(--chart-' + (j + 1) + ')') + '"><title>' + esc(l + ' — ' + s.name + ': ' + v) + '</title></rect>';
      });
    });
    var legend = o.series.length > 1 ? '<div class="legend">' + o.series.map(function (s, j) { return '<span><i style="background:' + (s.color || 'var(--chart-' + (j + 1) + ')') + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    return '<figure class="chart" style="margin:0"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.ariaLabel || 'Bar chart') + '">' + axes(o.labels, max, H, pad, W) + bars + '</svg>' + legend + '</figure>';
  };

  /* lineChart({ labels, series:[{name, values, color}], height, area, ariaLabel }) */
  M.lineChart = function (o) {
    var W = o.width || 640, H = o.height || 260, pad = { l: 40, r: 12, t: 12, b: 28 };
    var all = [].concat.apply([], o.series.map(function (s) { return s.values; }));
    var max = niceMax(Math.max.apply(null, all));
    var step = (W - pad.l - pad.r) / o.labels.length;
    var out = axes(o.labels, max, H, pad, W);
    o.series.forEach(function (s, j) {
      var color = s.color || 'var(--chart-' + (j + 1) + ')';
      var pts = s.values.map(function (v, i) { return [pad.l + step * i + step / 2, pad.t + (H - pad.t - pad.b) * (1 - v / max)]; });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      if (o.area) out += '<path d="' + d + ' L' + pts[pts.length - 1][0] + ' ' + (H - pad.b) + ' L' + pts[0][0] + ' ' + (H - pad.b) + ' Z" fill="' + color + '" opacity="0.10"/>';
      out += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      pts.forEach(function (p, i) {
        out += '<circle class="pt" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="#fff" stroke="' + color + '" stroke-width="2"><title>' + esc(o.labels[i] + ' — ' + s.name + ': ' + s.values[i].toLocaleString()) + '</title></circle>';
      });
    });
    var legend = o.series.length > 1 ? '<div class="legend">' + o.series.map(function (s, j) { return '<span><i style="background:' + (s.color || 'var(--chart-' + (j + 1) + ')') + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    return '<figure class="chart" style="margin:0"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.ariaLabel || 'Line chart') + '">' + out + '</svg>' + legend + '</figure>';
  };

  /* donutChart({ segments:[{label,value,color}], centerValue, centerLabel, ariaLabel }) */
  M.donutChart = function (o) {
    var total = o.segments.reduce(function (a, s) { return a + s.value; }, 0);
    var r = 54, c = 2 * Math.PI * r, off = 0, arcs = '';
    o.segments.forEach(function (s) {
      var len = c * s.value / total;
      arcs += '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 80 80)"><title>' + esc(s.label + ': ' + s.value) + '</title></circle>';
      off += len;
    });
    var svg = '<svg class="donut" viewBox="0 0 160 160" role="img" aria-label="' + esc(o.ariaLabel || 'Donut chart') + '">' + '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="var(--navy-50)" stroke-width="22"/>' + arcs +
      '<text class="c-value" x="80" y="82" text-anchor="middle">' + esc(o.centerValue != null ? o.centerValue : total.toLocaleString()) + '</text><text class="c-label" x="80" y="98" text-anchor="middle">' + esc(o.centerLabel || 'Total') + '</text></svg>';
    var legend = '<ul class="donut-legend">' + o.segments.map(function (s) {
      return '<li><i style="background:' + s.color + '"></i>' + esc(s.label) + '<b>' + s.value.toLocaleString() + '</b></li>';
    }).join('') + '</ul>';
    return '<div class="donut-wrap">' + svg + legend + '</div>';
  };

  /* hBars({ rows:[{label,value}], color }) — simple labelled horizontal bars */
  M.hBars = function (o) {
    var max = Math.max.apply(null, o.rows.map(function (r) { return r.value; }));
    return '<div class="hbar">' + o.rows.map(function (r) {
      return '<div class="hbar-row"><span>' + esc(r.label) + '</span><div class="track" role="presentation"><span style="width:' + (r.value / max * 100).toFixed(1) + '%' + (o.color ? ';background:' + o.color : '') + '"></span></div><b>' + r.value.toLocaleString() + '</b></div>';
    }).join('') + '</div>';
  };
})(window);
