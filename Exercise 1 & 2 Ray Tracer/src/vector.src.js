

function Vector3() {}
Vector3.prototype = {

  e: function(idx) {
    if(idx == 1) return this.x;
    if(idx == 2) return this.y;
    if(idx == 3) return this.z;
  },

  setElements: function(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  },

  // Returns a copy of the vector
  dup: function() {
    return Vector3.createNew(this.x,this.y,this.z);
  },

  // Returns the modulus ('length') of the vector
  modulus: function() {
    return Math.sqrt(this.dot(this));
  },

  // Normalize the vector
  toUnitVectorN: function() {
    var r = this.modulus();
    if (r === 0) { return this; }
    this.x /= r;
    this.y /= r;
    this.z /= r;
    return this;
  },
  // Normalize the vector (with copy)
  toUnitVector: function() {
    var V = this.dup();
    return V.toUnitVectorN();
  },

  toVector4: function() {
    var V = Vector4.createNew(this.x, this.y, this.z, 1);
    return V;
  },

  // Add the argument to the vector
  addN: function(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    return this;
  },
  // Add the argument to the vector (with copy)
  add: function(vector) {
    var V = this.dup();
    return V.addN(vector);
  },

  // Subtract the argument to the vector
  subtractN: function(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
  },

  // Subtract the argument to the vector (with copy)
  subtract: function(vector) {
    var V = this.dup();
    return V.subtractN(vector);
  },

  // Multiply the argument to the vector
  multiplyN: function(scale) {
    this.x *= scale;
    this.y *= scale;
    this.z *= scale;
    return this;
  },
  // Multiply the argument to the vector (with copy)
  multiply: function(scale) {
    var V = this.dup();
    return V.multiplyN(scale);
  },

  dotMultiplyN: function(vector) {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;
    return this;
  },

  dotMultiply: function(vector) {
    var V = this.dup();
    return V.dotMultiplyN(vector);
  },

  dotDivideN: function(vector) {
    this.x /= vector.x;
    this.y /= vector.y;
    this.z /= vector.z;
    return this;
  },

  dotDivide: function(vector) {
    var V = this.dup();
    return V.dotDivideN(vector);
  },

  // Returns the vector product of the vector with the argument
  // Both vectors must have dimensionality 3
  cross: function(vector) {
    return Vector3.createNew(
      (this.y * vector.z) - (this.z * vector.y),
      (this.z * vector.x) - (this.x * vector.z),
      (this.x * vector.y) - (this.y * vector.x)
    );
  },

  // Returns the scalar product of the vector with the argument
  dot: function(vector) {
    var product = 0;
    product += this.x * vector.x;
    product += this.y * vector.y;
    product += this.z * vector.z;
    return product;
  },

  minN: function(vector) {
    this.x = Math.min(this.x,vector.x);
    this.y = Math.min(this.y,vector.y);
    this.z = Math.min(this.z,vector.z);
    return this;
  },

  min: function(vector) {
    var V = this.dup();
    return V.minN(vector);
  },

  minScaleN: function(scale) {
    this.x = Math.min(this.x, scale);
    this.y = Math.min(this.y, scale);
    this.z = Math.min(this.z, scale);
    return this;
  },
  
  maxN: function(vector) {
    this.x = Math.max(this.x,vector.x);
    this.y = Math.max(this.y,vector.y);
    this.z = Math.max(this.z,vector.z);
    return this;
  },

  max: function(vector) {
    var V = this.dup();
    return V.maxN(vector);
  },

  reflect: function(vector) {
    var ref = vector.multiply(this.dot(vector));
    var par = ref.subtract(this);
    ref.addN(par);
    return ref;
  },

  // refract the vector
  // eta = incident index / refract index
  refract: function(vector, eta) {
    // note that vector is normal of the surface
    var dot = this.dot(vector);
    var k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) {
      var R = $V(0, 0, 0);
      return R;
    } else {
      var R = this.multiply(eta);
      R.subtractN(vector.multiply(eta * dot + Math.sqrt(k)));
      return R;
    }
  }
};
  
// Constructor function
Vector3.createNew = function(x,y,z) {
  var V = new Vector3();
  return V.setElements(x,y,z);
};

// Utility functions
var $V = Vector3.createNew;

