var assign = require("object-assign");
var rectClamp = require("rect-clamp");
var rectCrop = require("rect-crop");
var rectMix = require("rect-mix");
var BezierEasing = require("bezier-easing");
var mix = require("./mix");
var SegmentTimeline = require("./SegmentTimeline");

function SegmentKenBurns (start, end, renderChannel, data, index) {
  SegmentTimeline.call(this, start, end, renderChannel);
  this.data = data;
  this.index = index;
  this.clamped = true; // TODO make property of data
}

SegmentKenBurns.prototype = assign({}, SegmentTimeline.prototype, {
  enter: function (ctx) {
    var item = this.data;
    var image = ctx.images.get(item.image);
    var kenburns = ctx.getChannelContext(this.channel);
    this.kenburns = kenburns;
    this.image = image;
    this.canvas = ctx.getChannel(this.channel);
    
    var from = rectCrop.largest;
    var to = rectCrop.largest;
    if (item.kenburns) {
      if (item.kenburns.from) from = rectCrop.apply(null, item.kenburns.from);
      if (item.kenburns.to) to = rectCrop.apply(null, item.kenburns.to);
    }
    this.from = from;
    this.to = to;

    this.easing = BezierEasing.apply(null, item.kenburns && item.kenburns.easing || [0, 0, 1, 1]);
    this.viewport = [ 0, 0, image.width, image.height ];

    this.computeBounds();
    kenburns.runStart(image);
    return [ "slide", item, this.index ];
  },

  resize: function () {
    this.computeBounds();
  },

  leave: function () {
    var kenburns = this.kenburns;
    kenburns.runEnd();
    return [ "slideEnd", this.data, this.index ];
  },

  render: function (t) {
    var image = this.image;
    var kenburns = this.kenburns;
    var bound = rectMix(this.fromCropBound, this.toCropBound, this.easing(mix(this.startT, this.endT, t)));
    if (this.clamped) bound = rectClamp(bound, this.viewport);
    kenburns.draw(image, bound);
  },

  cropBound: function (crop) {
    var canvas = this.canvas;
    var image = this.image;
    var bnds = crop(canvas, image);
    if (this.clamped) bnds = rectClamp(bnds, this.viewport);
    return bnds;
  },

  computeBounds: function () {
    this.fromCropBound = this.cropBound(this.from);
    this.toCropBound = this.cropBound(this.to);
  },
});

module.exports = SegmentKenBurns;