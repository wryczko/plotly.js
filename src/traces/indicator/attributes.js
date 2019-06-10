/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// var plotAttrs = require('../../plots/attributes');
// var domainAttrs = require('../../plots/domain').attributes;

var extendFlat = require('../../lib/extend').extendFlat;
var extendDeep = require('../../lib/extend').extendDeep;
var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../../components/color/attributes');
var domainAttrs = require('../../plots/domain').attributes;
// var axisAttrs = require('../../plots/cartesian/layout_attributes');
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var cn = require('./constants.js');

var textFontAttrs = fontAttrs({
    editType: 'plot',
    colorEditType: 'plot'
});
delete(textFontAttrs.size); // TODO: relative size?

// TODO: choose appropriate editType
var gaugeBarAttrs = {
    color: {
        valType: 'color',
        editType: 'style',
        role: 'style',
        description: [
            'Sets the background color of the arc.'
        ].join(' ')
    },
    line: {
        color: {
            valType: 'color',
            role: 'style',
            dflt: colorAttrs.defaultLine,
            editType: 'style',
            description: [
                'Sets the color of the line enclosing each sector.'
            ].join(' ')
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 0,
            dflt: 0,
            editType: 'style',
            description: [
                'Sets the width (in px) of the line enclosing each sector.'
            ].join(' ')
        },
        editType: 'calc'
    },
    size: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 1,
        editType: 'style',
        description: [
            'Sets the size of the bar as a fraction of total size.'
        ].join(' ')
    },
    editType: 'calc'
};

var stepsAttrs = templatedArray('target', extendDeep({}, gaugeBarAttrs, {
    range: {
        valType: 'info_array',
        role: 'info',
        items: [
            {valType: 'number', editType: 'axrange'},
            {valType: 'number', editType: 'axrange'}
        ],
        editType: 'axrange',
        // impliedEdits: {'autorange': false},
        description: [
            'Sets the range of this axis.',
            'If the axis `type` is *log*, then you must take the log of your',
            'desired range (e.g. to set the range from 1 to 100,',
            'set the range from 0 to 2).',
            'If the axis `type` is *date*, it should be date strings,',
            'like date data, though Date objects and unix milliseconds',
            'will be accepted and converted to strings.',
            'If the axis `type` is *category*, it should be numbers,',
            'using the scale where each category is assigned a serial',
            'number from zero in the order it appears.'
        ].join(' ')
    }
}));

module.exports = {
    mode: {
        valType: 'flaglist',
        editType: 'calc',
        role: 'info',
        flags: ['bignumber', 'delta', 'gauge'],
        dflt: 'bignumber'
    },
    value: {
        valType: 'number',
        editType: 'calc',
        role: 'info',
        description: [
            'Sets the number to be displayed.'
        ].join(' ')
    },
    valueformat: {
        valType: 'string',
        dflt: '.3s',
        role: 'style',
        editType: 'plot',
        description: [
            'Sets the value formatting rule using d3 formatting mini-language',
            'which is similar to those of Python. See',
            'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
        ].join(' ')
    },
    // position
    domain: domainAttrs({name: 'indicator', trace: true, editType: 'calc'}),

    // TODO: min and max could be replaced by axis range
    min: {
        valType: 'number',
        editType: 'calc',
        role: 'info',
        dflt: 0,
        description: [
            'Sets the minimum value of the gauge.'
        ].join(' ')
    },
    max: {
        valType: 'number',
        editType: 'calc',
        role: 'info',
        description: [
            'Sets the maximum value of the gauge.'
        ].join(' ')
    },

    title: {
        text: {
            valType: 'string',
            role: 'info',
            description: [
                'Sets the title of this indicator.'
            ].join(' ')
        },
        font: extendFlat({}, textFontAttrs, {
            description: [
                'Set the font used to display the title'
            ].join(' ')
        }),
        editType: 'ticks'
    },
    number: {
        font: extendFlat({}, textFontAttrs, {
            description: [
                'Set the font used to display main number'
            ].join(' ')
        }),
        align: {
            valType: 'enumerated',
            values: ['left', 'center', 'right'],
            dflt: 'center',
            role: 'style',
            editType: 'style',
            description: [
                'Sets the horizontal alignment of the `text` within the box.'
            ].join(' ')
        },
    },
    delta: {
        reference: {
            valType: 'number',
            editType: 'calc',
            description: [
                'Sets the reference value to compute the delta.'
            ].join(' ')
        },
        showpercentage: {
            valType: 'boolean',
            editType: 'style',
            role: 'style',
            dflt: false,
            description: [
                'Show relative change in percentage'
            ].join(' ')
        },
        valueformat: {
            valType: 'string',
            dflt: '.3s',
            role: 'style',
            editType: 'plot',
            description: [
                'Sets the value formatting rule using d3 formatting mini-language',
                'which is similar to those of Python. See',
                'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
            ].join(' ')
        },
        increasing: {
            symbol: {
                valType: 'string',
                role: 'style',
                dflt: cn.DIRSYMBOL.increasing,
                editType: 'style',
                description: [
                    'Sets the symbol to display for increasing value'
                ].join(' ')
            },
            color: {
                valType: 'color',
                role: 'style',
                dflt: cn.INCREASING_COLOR,
                editType: 'style',
                description: [
                    'Sets the color for increasing value.'
                ].join(' ')
            },
            editType: 'style'
        },
        decreasing: {
            symbol: {
                valType: 'string',
                role: 'style',
                dflt: cn.DIRSYMBOL.decreasing,
                editType: 'style',
                description: [
                    'Sets the symbol to display for increasing value'
                ].join(' ')
            },
            color: {
                valType: 'color',
                role: 'style',
                dflt: cn.DECREASING_COLOR,
                editType: 'style',
                description: [
                    'Sets the color for increasing value.'
                ].join(' ')
            },
            editType: 'style'
        },
        font: extendFlat({}, textFontAttrs, {
            description: [
                'Set the font used to display the delta'
            ].join(' ')
        }),
        editType: 'calc'
    },
    gauge: {
        shape: {
            valType: 'enumerated',
            editType: 'style',
            role: 'style',
            dflt: 'angular',
            values: ['angular', 'bullet'],
            description: [
                'Set the shape of the gauge'
            ].join(' ')
        },
        value: extendDeep({}, gaugeBarAttrs, {
            color: {dflt: 'green'},
            description: [
                'Set the appearance of the gauge\'s value'
            ].join(' ')
        }),
        // Background of the gauge
        bgcolor: {
            valType: 'color',
            role: 'style',
            editType: 'legend',
            description: 'Sets the gauge background color.'
        },
        bordercolor: {
            valType: 'color',
            dflt: colorAttrs.defaultLine,
            role: 'style',
            editType: 'legend',
            description: 'Sets the color of the border enclosing the gauge.'
        },
        borderwidth: {
            valType: 'number',
            min: 0,
            dflt: 0,
            role: 'style',
            editType: 'legend',
            description: 'Sets the width (in px) of the border enclosing the gauge.'
        },
        // Steps (or ranges) and thresholds
        steps: stepsAttrs,
        threshold: {
            color: {
                valType: 'color',
                role: 'style',
                dflt: colorAttrs.defaultLine,
                editType: 'style',
                description: [
                    'Sets the color of the threshold line.'
                ].join(' ')
            },
            size: {
                valType: 'number',
                role: 'style',
                min: 0,
                max: 1,
                editType: 'style',
                description: [
                    'Sets the height of the threshold line as a fraction.'
                ].join(' ')
            },
            width: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 1,
                editType: 'style',
                description: [
                    'Sets the width (in px) of the threshold line.'
                ].join(' ')
            },
            value: {
                valType: 'number',
                editType: 'calc',
                dflt: false,
                role: 'info',
                description: [
                    'Sets a treshold value drawn as a line.'
                ].join(' ')
            }
        },
        description: 'The gauge of the Indicator plot.',
        editType: 'plot'
        // TODO: in future version, add marker: (bar|needle)
    }
};
