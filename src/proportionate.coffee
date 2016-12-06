Array.prototype.proportionate = (num, max)->
  return this[0] if num is 0
  return this[this.length-1] if num is max
  percent = num / max
  where = (this.length - 1) * percent
  return this[parseInt(Math.min(this.length-2, Math.max(1,where)))]