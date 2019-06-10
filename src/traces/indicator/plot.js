/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var cn = require('./constants');
var svgTextUtils = require('../../lib/svg_text_utils');
// var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var handleAxisDefaults = require('../../plots/cartesian/axis_defaults');
var handleAxisPositionDefaults = require('../../plots/cartesian/position_defaults');
var axisLayoutAttrs = require('../../plots/cartesian/layout_attributes');
//
// // arc cotangent
// function arcctg(x) { return Math.PI / 2 - Math.atan(x); }
// var barPlot = require('../bar/plot').plot;

module.exports = function plot(gd, cdModule, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var hasTransition = transitionOpts && transitionOpts.duration > 0;

    if(hasTransition) {
        if(makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }
    }

    // Compute aspect ratio
    // var aspectratio = fullLayout._size.w / fullLayout._size.h;
    // var theta = arcctg(aspectratio / 2);

    Lib.makeTraceGroups(fullLayout._indicatorlayer, cdModule, 'trace').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        // Domain size
        var domain = trace.domain;
        var size = Lib.extendFlat({}, fullLayout._size, {
            w: fullLayout._size.w * (domain.x[1] - domain.x[0]),
            h: fullLayout._size.h * (domain.y[1] - domain.y[0]),
            l: fullLayout._size.l + fullLayout._size.w * domain.x[0],
            r: fullLayout._size.r + fullLayout._size.w * (1 - domain.x[1]),
            t: fullLayout._size.t + fullLayout._size.h * (1 - domain.y[1]),
            b: fullLayout._size.b + fullLayout._size.h * (domain.y[0])
        });

        // title
        var hasTitle = trace.title.text;

        // bignumber
        var hasBigNumber = trace.mode.indexOf('bignumber') !== -1;
        var fmt = d3.format(trace.valueformat);

        // delta
        var hasDelta = trace.mode.indexOf('delta') !== -1;
        var deltaFmt = d3.format(trace.delta.valueformat);
        var deltaText = function(d) {
            if(d.delta === 0) return '-';
            var value = trace.delta.showpercentage ? deltaFmt(d.relativeDelta) : deltaFmt(d.delta);
            return (d.delta > 0 ? cn.DIRSYMBOL.increasing : cn.DIRSYMBOL.decreasing) + value;
        };
        var deltaFill = function(d) {
            return d.delta >= 0 ? trace.delta.increasing.color : trace.delta.decreasing.color;
        };

        // gauge related
        var hasGauge = trace.mode.indexOf('gauge') !== -1;

        // circular gauge
        var isAngular = hasGauge && trace.gauge.shape === 'angular';
        var theta = Math.PI / 2;
        var radius = Math.min(size.w / 2, size.h * 0.65);
        var isWide = (size.w / 2 > size.h * 0.65);
        var innerRadius = cn.innerRadius * radius;
        function valueToAngle(v) {
            var angle = (v - trace.min) / (trace.max - trace.min) * Math.PI - Math.PI / 2;
            if(angle < -theta) return -theta;
            if(angle > theta) return theta;
            return angle;
        }

        // bullet gauge
        var isBullet = hasGauge && trace.gauge.shape === 'bullet';

        // TODO: Move the following to defaults
        // Position elements
        var bignumberX, bignumberY, bignumberFontSize, bignumberBaseline;
        var bignumberAnchor = 'middle';
        var deltaX, deltaY, deltaFontSize, deltaBaseline;
        var deltaAnchor = 'middle';
        var titleX, titleY, titleFontSize;

        var bulletHeight = Math.min(cn.bulletHeight, size.h / 2);
        var gaugeFontSize;

        // Center everything
        var centerX = size.l + size.w / 2;
        bignumberX = centerX;
        deltaX = centerX;
        titleX = centerX;

        bignumberBaseline = hasGauge && isAngular ? 'bottom' : 'central';
        titleX = isBullet ? size.l + 0.23 * size.w : centerX;

        if(!hasGauge) {
            // when no gauge, we are only constrained by figure size
            bignumberFontSize = Math.min(size.w / (fmt(trace.max).length), size.h / 3);
            if(hasBigNumber) {
                // Center the text vertically
                deltaFontSize = 0.5 * bignumberFontSize;
                bignumberY = size.t + size.h / 2;
                deltaY = Math.min(size.t + size.h / 2 + bignumberFontSize / 2 + deltaFontSize / 2);
                if(trace.number.align === 'left') {
                    bignumberX = size.l;
                    deltaX = bignumberX;
                    bignumberAnchor = 'start';
                    deltaAnchor = 'start';
                }
                if(trace.number.align === 'right') {
                    bignumberX = size.l + size.w;
                    deltaX = bignumberX;
                    bignumberAnchor = 'end';
                    deltaAnchor = 'end';
                }
            } else {
                deltaFontSize = bignumberFontSize;
                deltaY = size.t + size.h / 2;
            }
            titleFontSize = 0.35 * bignumberFontSize;
            titleY = size.t + Math.max(titleFontSize / 2, size.h / 5);
        } else {
            if(isAngular) {
                bignumberY = size.t + size.h - (0.15 * size.h);
                // if(!isWide) bignumberY -= (size.h - radius) / 2;
                if(!isWide) bignumberY = size.t + size.h / 2;
                bignumberFontSize = Math.min(2 * innerRadius / (fmt(trace.max).length));
                deltaFontSize = 0.35 * bignumberFontSize;
                gaugeFontSize = Math.max(0.25 * bignumberFontSize, (radius - innerRadius) / 4);
                titleFontSize = 0.35 * bignumberFontSize;
                deltaY = bignumberY + deltaFontSize;
                if(!hasBigNumber) deltaBaseline = 'bottom';
                if(isWide) {
                    titleY = size.t + (0.25 / 2) * size.h - titleFontSize / 2;
                } else {
                    titleY = ((bignumberY - radius) + size.t) / 2;
                }
            }
            if(isBullet) {
                // Center the text
                var p = 0.75;
                bignumberFontSize = Math.min(0.2 * size.w / (fmt(trace.max).length), bulletHeight);
                bignumberY = size.t + size.h / 2;
                bignumberX = size.l + (p + (1 - p) / 2) * size.w;
                deltaX = bignumberX;
                deltaFontSize = 0.5 * bignumberFontSize;
                deltaY = bignumberY + bignumberFontSize / 2 + deltaFontSize;
                titleFontSize = 0.4 * bignumberFontSize;
                titleY = bignumberY;
            }

            if(!hasBigNumber) {
                deltaFontSize = 0.75 * bignumberFontSize;
                deltaY = bignumberY;
            }
        }

        plotGroup.each(function() {
            // Title
            var title = d3.select(this).selectAll('text.title').data(cd);
            title.enter().append('text').classed('title', true);
            title.attr({
                x: titleX,
                y: titleY,
                'text-anchor': isBullet ? 'end' : 'middle',
                'alignment-baseline': 'central'
            })
            .text(trace.title.text)
            .call(Drawing.font, trace.title.font)
            .style('font-size', titleFontSize)
            .call(svgTextUtils.convertToTspans, gd);
            title.exit().remove();

            // bignumber
            var data = cd.filter(function() {return hasBigNumber;});
            var number = d3.select(this).selectAll('text.number').data(data);
            number.enter().append('text').classed('number', true);
            number.attr({
                x: bignumberX,
                y: bignumberY,
                'text-anchor': bignumberAnchor,
                'alignment-baseline': bignumberBaseline
            })
            .call(Drawing.font, trace.number.font)
            .style('font-size', bignumberFontSize);

            if(hasTransition) {
                number
                    .transition()
                    .duration(transitionOpts.duration)
                    .ease(transitionOpts.easing)
                    .each('end', function() { onComplete && onComplete(); })
                    .each('interrupt', function() { onComplete && onComplete(); })
                    .attrTween('text', function() {
                        var that = d3.select(this);
                        var interpolator = d3.interpolateNumber(cd[0].lastY, cd[0].y);
                        return function(t) {
                            that.text(fmt(interpolator(t)));
                        };
                    });
            } else {
                number.text(fmt(cd[0].y));
            }
            number.exit().remove();

            // delta
            // TODO: text animation for delta
            data = cd.filter(function() {return hasDelta;});
            var delta = d3.select(this).selectAll('text.delta').data(data);
            delta.enter().append('text').classed('delta', true);
            delta.attr({
                x: deltaX,
                y: deltaY,
                'text-anchor': deltaAnchor,
                'alignment-baseline': deltaBaseline || 'central'
            })
            .call(Drawing.font, trace.delta.font)
            .style('font-size', deltaFontSize)
            .style('fill', deltaFill)
            .text(deltaText);
            delta.exit().remove();

            // Draw circular gauge
            data = cd.filter(function() {return isAngular;});
            var gauge = d3.select(this).selectAll('g.gauge').data(data);
            gauge.enter().append('g').classed('gauge', true);
            gauge.attr('transform', 'translate(' + centerX + ',' + (bignumberY) + ')');

            // Draw gauge's min and max in text
            var minText = gauge.selectAll('text.min').data(cd);
            minText.enter().append('text').classed('min', true);
            minText
                  .call(Drawing.font, trace.number.font)
                  .style('font-size', gaugeFontSize)
                  .attr({
                      x: - (innerRadius + radius) / 2,
                      y: gaugeFontSize,
                      'text-anchor': 'middle'
                  })
                  .text(fmt(trace.min));

            var maxText = gauge.selectAll('text.max').data(cd);
            maxText.enter().append('text').classed('max', true);
            maxText
                  .call(Drawing.font, trace.number.font)
                  .style('font-size', gaugeFontSize)
                  .attr({
                      x: (innerRadius + radius) / 2,
                      y: gaugeFontSize,
                      'text-anchor': 'middle'
                  })
                  .text(fmt(trace.max));

            function arcPathGenerator(size) {
                return d3.svg.arc()
                      .innerRadius((innerRadius + radius) / 2 - size / 2 * (radius - innerRadius))
                      .outerRadius((innerRadius + radius) / 2 + size / 2 * (radius - innerRadius))
                      .startAngle(-theta);
            }

            // Reexpress our background attributes for drawing
            var bg = {
                range: [trace.min, trace.max],
                color: trace.gauge.bgcolor,
                line: {
                    color: trace.gauge.bordercolor,
                    width: trace.gauge.borderwidth
                },
                size: 1
            };

            // Draw backgrond + steps
            var targetArc = gauge.selectAll('g.targetArc').data([bg].concat(trace.gauge.steps));
            targetArc.enter().append('g').classed('targetArc', true).append('path');
            targetArc.select('path')
                  .attr('d', function(d) {
                      return arcPathGenerator(d.size)
                        .startAngle(valueToAngle(d.range[0]))
                        .endAngle(valueToAngle(d.range[1]))();
                  })
                  .style('fill', function(d) { return d.color;})
                  .style('stroke', function(d) { return d.line.color;})
                  .style('stroke-width', function(d) { return d.line.width;});
            targetArc.exit().remove();

            // Draw foreground with transition
            var valueArcPath = arcPathGenerator(trace.gauge.value.size);
            var fgArc = gauge.selectAll('g.fgArc').data(cd);
            fgArc.enter().append('g').classed('fgArc', true).append('path');

            var fgArcPath = fgArc.select('path');
            if(hasTransition) {
                fgArcPath
                      .transition()
                      .duration(transitionOpts.duration)
                      .ease(transitionOpts.easing)
                      .each('end', function() { onComplete && onComplete(); })
                      .each('interrupt', function() { onComplete && onComplete(); })
                      .attrTween('d', arcTween(valueArcPath, valueToAngle(cd[0].lastY), valueToAngle(cd[0].y)));
            } else {
                fgArcPath
                      .attr('d', valueArcPath.endAngle(valueToAngle(cd[0].y)));
            }
            fgArcPath
                  .style('fill', trace.gauge.value.color)
                  .style('stroke', trace.gauge.value.line.color)
                  .style('stroke-width', trace.gauge.value.line.width);
            fgArc.exit().remove();

            // TODO: threshold reuse arc path with very small range
            // TODO: add hover on threshold
            data = cd.filter(function() {return trace.gauge.threshold.value;});
            var threshold = gauge.selectAll('g.threshold').data(data);
            threshold.enter().append('g').classed('threshold', true).append('line');
            threshold.select('line')
                .attr('x1', Math.sin(valueToAngle(trace.gauge.threshold.value)) * innerRadius)
                .attr('x2', Math.sin(valueToAngle(trace.gauge.threshold.value)) * radius)
                .attr('y1', -Math.cos(valueToAngle(trace.gauge.threshold.value)) * innerRadius)
                .attr('y2', -Math.cos(valueToAngle(trace.gauge.threshold.value)) * radius)
                .style('stroke', trace.gauge.threshold.color)
                .style('stroke-width', trace.gauge.threshold.width);
            threshold.exit().remove();

            // Draw bullet
            var bulletLeft = hasTitle ? 0.25 : 0;
            var bulletRight = (hasBigNumber || hasDelta) ? 0.75 : 1.0;

            data = cd.filter(function() {return isBullet;});
            var innerBulletHeight = trace.gauge.value.size * bulletHeight;
            var bulletVerticalMargin = bignumberY - bulletHeight / 2;
            var bullet = d3.select(this).selectAll('g.bullet').data(data);
            bullet.enter().append('g').classed('bullet', true);
            bullet.attr('transform', 'translate(' + (size.l + (bulletLeft * size.w)) + ',' + bulletVerticalMargin + ')');

            // Draw axis
            // force full redraw of labels and ticks
            var opts = {
                ticks: 'outside'
            }; // TODO: use attribute gauge.axis
            var range = [trace.min, trace.max];
            var ax = mockAxis(gd, opts, range);
            ax.position = 0;
            ax.domain = [
                bulletLeft,
                bulletRight
            ];
            ax.setScale();

            // var g = d3.select(this);
            // var axLayer = Lib.ensureSingle(g, 'g', 'gaugeaxis', function(s) { s.classed('crisp', true); });
            var axLayer = d3.select(this).selectAll('g.gaugeaxis').data(data);
            axLayer.enter().append('g')
              .classed('gaugeaxis', true)
              .classed('crisp', true);
            axLayer.selectAll('g.' + ax._id + 'tick,path').remove();

            var shift = bulletHeight + bulletVerticalMargin;

            var vals = Axes.calcTicks(ax);
            var transFn = Axes.makeTransFn(ax);
            var tickSign = Axes.getTickSigns(ax)[2];

            Axes.drawTicks(gd, ax, {
                vals: ax.ticks === 'inside' ? Axes.clipEnds(ax, vals) : vals,
                layer: axLayer,
                path: Axes.makeTickPath(ax, shift, tickSign),
                transFn: transFn
            });

            Axes.drawLabels(gd, ax, {
                vals: vals,
                layer: axLayer,
                transFn: transFn,
                labelFns: Axes.makeLabelFns(ax, shift)
            });

            // TODO: prevent rect width from being negative or overflowing
            var targetBullet = bullet.selectAll('g.targetBullet').data([bg].concat(trace.gauge.steps));
            targetBullet.enter().append('g').classed('targetBullet', true).append('rect');
            targetBullet.select('rect')
                  .attr('width', function(d) { return ax.c2p(d.range[1] - d.range[0]);})
                  .attr('x', function(d) { return ax.c2p(d.range[0]);})
                  .attr('height', bulletHeight)
                  .style('fill', function(d) { return d.color;})
                  .style('stroke', function(d) { return d.line.color;})
                  .style('stroke-width', function(d) { return d.line.width;});
            targetBullet.exit().remove();

            // Draw value bar with transitions
            var fgBullet = bullet.selectAll('g.fgBullet').data(cd);
            fgBullet.enter().append('g').classed('fgBullet', true).append('rect');
            fgBullet.select('rect')
                  .attr('height', innerBulletHeight)
                  .attr('y', (bulletHeight - innerBulletHeight) / 2)
                  .style('fill', trace.gauge.value.color)
                  .style('stroke', trace.gauge.value.line.color)
                  .style('stroke-width', trace.gauge.value.line.width);
            if(hasTransition) {
                fgBullet.select('rect')
                  .transition()
                  .duration(transitionOpts.duration)
                  .ease(transitionOpts.easing)
                  .each('end', function() { onComplete && onComplete(); })
                  .each('interrupt', function() { onComplete && onComplete(); })
                  .attr('width', ax.c2p(Math.min(trace.max, cd[0].y)));
            } else {
                fgBullet.select('rect')
                  .attr('width', ax.c2p(Math.min(trace.max, cd[0].y)));
            }
            fgBullet.exit().remove();

            data = cd.filter(function() {return trace.gauge.threshold.value;});
            threshold = bullet.selectAll('g.threshold').data(data);
            threshold.enter().append('g').classed('threshold', true).append('line');
            threshold.select('line')
                .attr('x1', ax.c2p(trace.gauge.threshold.value))
                .attr('x2', ax.c2p(trace.gauge.threshold.value))
                .attr('y1', (1 - trace.gauge.threshold.size) / 2 * bulletHeight)
                .attr('y2', (1 - (1 - trace.gauge.threshold.size) / 2) * bulletHeight)
                .style('stroke', trace.gauge.threshold.color)
                .style('stroke-width', trace.gauge.threshold.width);
            threshold.exit().remove();
        });
    });
};

// Returns a tween for a transition’s "d" attribute, transitioning any selected
// arcs from their current angle to the specified new angle.
function arcTween(arc, endAngle, newAngle) {
    return function() {
        var interpolate = d3.interpolate(endAngle, newAngle);
        return function(t) {
            return arc.endAngle(interpolate(t))();
        };
    };
}

// mocks our axis
function mockAxis(gd, opts, zrange) {
    var fullLayout = gd._fullLayout;

    var cbAxisIn = {
        type: 'linear',
        range: zrange,
        tickmode: opts.tickmode,
        nticks: opts.nticks,
        tick0: opts.tick0,
        dtick: opts.dtick,
        tickvals: opts.tickvals,
        ticktext: opts.ticktext,
        ticks: 'outside',
        ticklen: opts.ticklen,
        tickwidth: opts.tickwidth,
        tickcolor: opts.tickcolor,
        showticklabels: opts.showticklabels,
        tickfont: opts.tickfont,
        tickangle: opts.tickangle,
        tickformat: opts.tickformat,
        exponentformat: opts.exponentformat,
        separatethousands: opts.separatethousands,
        showexponent: opts.showexponent,
        showtickprefix: opts.showtickprefix,
        tickprefix: opts.tickprefix,
        showticksuffix: opts.showticksuffix,
        ticksuffix: opts.ticksuffix,
        title: opts.title,
        showline: true,
        anchor: 'free',
        side: 'right',
        position: 1
    };

    var cbAxisOut = {
        type: 'linear',
        _id: 'x' + opts._id
    };

    var axisOptions = {
        letter: 'x',
        font: fullLayout.font,
        noHover: true,
        noTickson: true,
        calendar: fullLayout.calendar  // not really necessary (yet?)
    };

    function coerce(attr, dflt) {
        return Lib.coerce(cbAxisIn, cbAxisOut, axisLayoutAttrs, attr, dflt);
    }

    handleAxisDefaults(cbAxisIn, cbAxisOut, coerce, axisOptions, fullLayout);
    handleAxisPositionDefaults(cbAxisIn, cbAxisOut, coerce, axisOptions);

    return cbAxisOut;
}

// Draw bullet
// if(isBullet) {
//     var mockFigure = {
//         data: [],
//         layout: {
//             xaxis: {
//                 type: 'linear',
//                 domain: [0, 1],
//                 range: [trace.min, trace.max],
//             },
//             yaxis: {
//                 type: 'linear',
//                 range: [-0.5, 0.5]
//             },
//             width: fullLayout.width,
//             height: 25,
//             margin: { t: 0, b: 0, l: size.l, r: size.r },
//             paper_bgcolor: 'rgba(0, 0, 0, 0)'
//         },
//         _context: gd._context
//     };
//
//     Plots.supplyDefaults(mockFigure);
//
//     var xa = mockFigure._fullLayout.xaxis;
//     var ya = mockFigure._fullLayout.yaxis;
//
//     xa.clearCalc();
//     xa.setScale();
//     ya.clearCalc();
//     ya.setScale();
//
//     var plotinfo = {
//         xaxis: xa,
//         yaxis: ya
//     };
//     var opts = {
//         mode: 'overlay'
//     };
//     var barWidth = -0.5;
//     var cdBarModule = [[{
//         i: 0,
//         text: 'max',
//         mlw: 1,
//         s: 0,
//         p: 0,
//         p0: -barWidth,
//         p1: barWidth,
//         s0: 0,
//         s1: trace.max,
//         trace: {orientation: 'h', marker: {color: 'red'}}
//     }, {
//         i: 0,
//         text: 'value',
//         mlw: 1,
//         p: 0,
//         s: trace.target,
//         p0: -barWidth,
//         p1: barWidth,
//         s0: 0,
//         s1: trace.target,
//         trace: {orientation: 'h', marker: {color: 'red'}}
//     }, {
//         i: 0,
//         text: 'value',
//         mlw: 1,
//         p: 0,
//         s: cd0.y,
//         p0: -0.75 * barWidth,
//         p1: 0.75 * barWidth,
//         s0: 0,
//         s1: cd0.y,
//         trace: {orientation: 'h', marker: {color: 'red'}}
//     }]];
//     barPlot(gd, plotinfo, cdBarModule, fullLayout._cartesianlayer, opts);
//
//     var bars = fullLayout._cartesianlayer.select('.bars');
//     bars.attr('transform', 'translate(' + size.l + ',' + 0.95 * size.h + ')');
//     bars.selectAll('path').each(function(d, i) {
//         var colors = {2: 'green', 1: 'rgba(255, 255, 0, 0.5)', 0: 'rgba(255, 255, 255, 0.25)'};
//         d3.select(this).style('fill', colors[i]);
//     });
//
//     Axes.drawOne(gd, xa);
//     Axes.drawOne(gd, ya);
// }
