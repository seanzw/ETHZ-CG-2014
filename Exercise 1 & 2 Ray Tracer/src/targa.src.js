
// DO NOT modify this file if you don't know what you are doing

// to load a texture you need to call: var myTexture = readTGA('./data/textureFile.tga');
// it is done asynchronously, so the rendering loop will wait until loaded
/*
	The only properties you need from the TGA variable are:
		height in #pixels: myTexture.header.height
		width in #pixels: myTexture.header.width
		array of colors: myTexture.image (stored like this: [b, g, r, b, g, r, ...] row-by-row with values between 0 and 255
		
		Access example:
		var id = 3 * (row * myTexture.header.width + col);

		var r = myTexture.image[id + 2] / 255.0;
		var g = myTexture.image[id + 1] / 255.0;
		var b = myTexture.image[id + 0] / 255.0;
*/

/*function readTGA(path) {
	console.log("Reading TGA file: " + path);
	var tga = new TGA();
	var req = new XMLHttpRequest();
	waitingForData++;
	req.open('GET', path, true);
	req.responseType = 'arraybuffer';
	
	req.onload = function(e) {
		if (this.status === 200) {
			tga.load(new Uint8Array(req.response));
			console.log("TGA file successfully loaded (width: " + tga.header.width + ", height: " + tga.header.height + ")");
			waitingForData--;
		}
	};
	req.send(null);
	
	return tga;
}*/

function Targa() {}

Targa.createNew = function(path, useMipMap) {
	console.log("Reading TGA file: " + path);
	var tga = new TGA();
	tga.useMipMap = useMipMap;
	var req = new XMLHttpRequest();
	waitingForData++;
	req.open('GET', path, true);
	req.responseType = 'arraybuffer';
	
	req.onload = function(e) {
		if (this.status === 200) {
			tga.load(new Uint8Array(req.response));
			console.log("TGA file successfully loaded (width: " + tga.header.width + ", height: " + tga.header.height + ")");
			waitingForData--;
			if (tga.useMipMap == true) {
				tga.generateMipMap(1, 0.5, 0.25);
			}
		}
	};
	req.send(null);
	
	return tga;
};

function myLog2(num) {
	return Math.log(num) / Math.LN2;
}


 /**
 * @fileoverview jsTGALoader - Javascript loader for TGA file
 * @author Vincent Thibault
 * @version 1.2.0
 * @blog http://blog.robrowser.com/javascript-tga-loader.html
 */

/* Copyright (c) 2013, Vincent Thibault. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

(function(_global) {
	"use strict";

	// Find Context
	var shim = {};
	if (typeof (exports) === 'undefined') {
		if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
			shim.exports = {};
			define(function() {
				return shim.exports;
			});
		} else {
			// Browser
			shim.exports = typeof (window) !== 'undefined' ? window : _global;
		}
	} 
	else {
		// Commonjs
		shim.exports = exports;
	}

	// Namespace
	(function(exports) {

		// Constructor
		function Targa() {
			this.header   = null;
			this.offset   = 0;
			this.use_rle  = false;
			this.use_pal  = false;
			this.use_rgb  = false;
			this.use_grey = false;
		}

		// TGA Constants
		Targa.TYPE_NO_DATA     = 0;
		Targa.TYPE_INDEXED     = 1;
		Targa.TYPE_RGB         = 2;
		Targa.TYPE_GREY        = 3;
		Targa.TYPE_RLE_INDEXED = 9;
		Targa.TYPE_RLE_RGB     = 10;
		Targa.TYPE_RLE_GREY    = 11;
		
		Targa.ORIGIN_MASK      = 0x30;
		Targa.ORIGIN_SHIFT     = 0x04;
		Targa.ORIGIN_BL        = 0x00;
		Targa.ORIGIN_BR        = 0x01;
		Targa.ORIGIN_UL        = 0x02;
		Targa.ORIGIN_UR        = 0x03;

		/**
		 * Open a targa file using XHR, be aware with Cross Domain files...
		 *
		 * @param {string} path - Path of the filename to load
		 * @param {function} callback - callback to trigger when the file is loaded
		 */
		Targa.prototype.open = function Targa_open(path, callback) {
			var req, _this = this;
			req = new XMLHttpRequest();
			req.responseType = 'arraybuffer';
			
			req.open('GET', path, true);
			req.onload = function(e) {
				if (this.status === 200) {
					_this.load(new Uint8Array(req.response));
					callback.call(_this);
				}
			};
			req.send(null);
		};
		
		/**
		 * Load and parse a TGA file
		 *
		 * @param {Uint8Array} data - Binary data of the TGA file
		 */
		Targa.prototype.load = function Targa_load(data) {
			// Not enough data to contain header ?
			if (data.length < 19)
				throw new Error('Targa::load() - Not enough data to contain header.');

			// Read Header
			this.offset = 0;
			this.header = {
				id_length:       data[this.offset++],
				colormap_type:   data[this.offset++],
				image_type:      data[this.offset++],
				colormap_index:  data[this.offset++] | data[this.offset++] << 8,
				colormap_length: data[this.offset++] | data[this.offset++] << 8,
				colormap_size:   data[this.offset++],
				origin: [
					data[this.offset++] | data[this.offset++] << 8, 
					data[this.offset++] | data[this.offset++] << 8
				],
				width:      data[this.offset++] | data[this.offset++] << 8,
				height:     data[this.offset++] | data[this.offset++] << 8,
				pixel_size: data[this.offset++],
				flags:      data[this.offset++]
			};

			// Assume it's a valid Targa file.
			this.checkHeader();
			if (this.header.id_length + this.offset > data.length) {
				throw new Error('Targa::load() - No data ?');
			}

			// Skip not needed data
			this.offset += this.header.id_length;

			// Get some informations.
			switch (this.header.image_type) {
				case Targa.TYPE_RLE_INDEXED:
					this.use_rle = true;
				case Targa.TYPE_INDEXED:
					this.use_pal = true;
					break;
				
				case Targa.TYPE_RLE_RGB:
					this.use_rle = true;
				case Targa.TYPE_RGB:
					this.use_rgb = true;
					break;
				
				case Targa.TYPE_RLE_GREY:
					this.use_rle = true;
				case Targa.TYPE_GREY:
					this.use_grey = true;
					break;
			}
			
			this.parse(data);
		};

		/**
		 * Check the header of TGA file to detect errors
		 *
		 * @throws Error
		 */
		Targa.prototype.checkHeader = function Targa_checkHeader() {
			switch (this.header.image_type) {
				// Check indexed type
				case Targa.TYPE_INDEXED:
				case Targa.TYPE_RLE_INDEXED:
					if (this.header.colormap_length > 256 || this.header.colormap_size !== 24 || this.header.colormap_type !== 1) {
						throw new Error("Targa::checkHeader() - Invalid type colormap data for indexed type");
					}
					break;

				// Check colormap type
				case Targa.TYPE_RGB:
				case Targa.TYPE_GREY:
				case Targa.TYPE_RLE_RGB:
				case Targa.TYPE_RLE_GREY:
					if (this.header.colormap_type) {
						throw new Error("Targa::checkHeader() - Invalid type colormap data for colormap type");
					}
					break;

				// What the need of a file without data ?
				case Targa.TYPE_NO_DATA:
					throw new Error("Targa::checkHeader() - No data on this TGA file");

				// Invalid type ?
				default:
					throw new Error("Targa::checkHeader() - Invalid type '" + this.header.image_type + "'");
			}

			// Check image size
			if (this.header.width <= 0 || this.header.height <= 0) {
				throw new Error('Targa::checkHeader() - Invalid image size');
			}

			// Check pixel size
			if (this.header.pixel_size !== 8 
			 && this.header.pixel_size !== 16 
			 && this.header.pixel_size !== 24 
			 && this.header.pixel_size !== 32) {
				throw new Error("Targa::checkHeader() - Invalid pixel size '" + this.header.pixel_size + "'");
			}
		};

		/**
		 * Parse data from TGA file
		 *
		 * @param {Uint8Array} data - Binary data of the TGA file
		 */
		Targa.prototype.parse = function Targa_parse(data) {
			var _header, 
			    numAlphaBits, 
			    pixel_data, 
			    pixel_size, 
			    pixel_total;
			
			_header      = this.header;
			numAlphaBits = _header.flags & 0xf;
			pixel_size   = _header.pixel_size >> 3;
			pixel_total  = _header.width * _header.height * pixel_size;

			// Read palettes
			if (this.use_pal) {
				this.palettes = data.subarray(
				this.offset, 
				this.offset += _header.colormap_length * pixel_size
				);
			}

			// Read LRE
			if (this.use_rle) {
				pixel_data = new Uint8Array(pixel_total);
				
				var c, count, i;
				var offset = 0;
				var pixels = new Uint8Array(pixel_size);
				
				while (offset < pixel_total) {
					c     = data[this.offset++];
					count = (c & 0x7f) + 1;

					// RLE pixels.
					if (c & 0x80) {
						// Bind pixel tmp array
						for (i = 0; i < pixel_size; ++i) {
							pixels[i] = data[this.offset++];
						}

						// Copy pixel array
						for (i = 0; i < count; ++i) {
							pixel_data.set(pixels, offset + i * pixel_size);
						}
						
						offset += pixel_size * count;
					} 

					// Raw pixels.
					else {
						count *= pixel_size;
						for (i = 0; i < count; ++i) {
							pixel_data[offset + i] = data[this.offset++];
						}
						offset += count;
					}
				}
			} 

			// RAW Pixels
			else {
				pixel_data = data.subarray(
					this.offset, 
					this.offset += (
						this.use_pal 
							? _header.width * _header.height 
							: pixel_total
					)
				);
			}
			this.image = new Array();
			this.image.push(pixel_data);
		};

		/**
		 * Return a ImageData object from a TGA file
		 *
		 * @param {imageData} imageData - Optional ImageData to work with
		 * @returns {imageData}
		 */
		Targa.prototype.getImageData = function Targa_getImageData(imageData) {
			var width  = this.header.width, 
			    height = this.header.height, 
			    x_start, 
			    y_start, 
			    x_step, 
			    y_step, 
			    y_end, 
			    x_end, 
			    func, 
			    data;
			
			data = 
				// sent as argument
				imageData || 

				// In main frame ?
				(document && document.createElement('canvas').getContext('2d').createImageData(width, height)) || 

				// Not have access to document.
				{
					width: width,
					height: height,
					data: new Uint8Array(width * height * 4)
				};

			// Check how we should write the pixels
			switch ((this.header.flags & Targa.ORIGIN_MASK) >> Targa.ORIGIN_SHIFT) {
				default:
				case Targa.ORIGIN_UL:
					x_start = 0;
					x_step = 1;
					x_end = width;
					y_start = 0;
					y_step = 1;
					y_end = height;
					break;
				
				case Targa.ORIGIN_BL:
					x_start = 0;
					x_step = 1;
					x_end = width;
					y_start = height - 1;
					y_step = -1;
					y_end = -1;
					break;
				
				case Targa.ORIGIN_UR:
					x_start = width - 1;
					x_step = -1;
					x_end = -1;
					y_start = 0;
					y_step = 1;
					y_end = height;
					break;
				
				case Targa.ORIGIN_BR:
					x_start = width - 1;
					x_step = -1;
					x_end = -1;
					y_start = height - 1;
					y_step = -1;
					y_end = -1;
					break;
			}

			// TODO: use this.header.origin[0-1] ?
			// x_start += this.header.origin[0];
			// y_start += this.header.origin[1];

			// Load the specify method
			func = 'getImageData' + (this.use_grey ? 'Grey' : '') + (this.header.pixel_size) + 'bits';
			this[func](data.data, y_start, y_step, y_end, x_start, x_step, x_end);
			return data;
		};

		/**
		 * Return a canvas with the TGA render on it
		 *
		 * @returns {canvas}
		 */
		Targa.prototype.getCanvas = function Targa_getCanvas() {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			var imageData = ctx.createImageData(this.header.width, this.header.height);
			canvas.width = this.header.width;
			canvas.height = this.header.height;
			ctx.putImageData(this.getImageData(imageData), 0, 0);
			return canvas;
		};

		/**
		 * Return a dataURI of the TGA file
		 *
		 * @param {string} type - Optional image content-type to output (default: image/png)
		 * @returns {canvas}
		 */
		Targa.prototype.getDataURL = function Targa_getDatURL(type) {
			return this.getCanvas().toDataURL(type || "image/png");
		};

		/**
		 * Return a ImageData object from a TGA file (8bits)
		 *
		 * @param {imageData} imageData - ImageData to bind
		 * @param {int} y_start - start at y pixel.
		 * @param {int} x_start - start at x pixel.
		 * @param {int} y_step  - increment y pixel each time.
		 * @param {int} y_end   - stop at pixel y.
		 * @param {int} x_step  - increment x pixel each time.
		 * @param {int} x_end   - stop at pixel x.
		 * @returns {imageData}
		 */
		Targa.prototype.getImageData8bits = function Targa_getImageData8bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end) {
			var image = this.image[0], colormap = this.palettes;
			var width = this.header.width, height = this.header.height;
			var color, i = 0, x, y;
			
			for (y = y_start; y !== y_end; y += y_step) {
				for (x = x_start; x !== x_end; x += x_step, i++) {
					color = image[i];
					imageData[(x + width * y) * 4 + 3] = 255;
					imageData[(x + width * y) * 4 + 2] = colormap[(color * 3) + 0];
					imageData[(x + width * y) * 4 + 1] = colormap[(color * 3) + 1];
					imageData[(x + width * y) * 4 + 0] = colormap[(color * 3) + 2];
				}
			}
			
			return imageData;
		};

		/**
		 * Return a ImageData object from a TGA file (16bits)
		 *
		 * @param {imageData} imageData - ImageData to bind
		 * @param {int} y_start - start at y pixel.
		 * @param {int} x_start - start at x pixel.
		 * @param {int} y_step  - increment y pixel each time.
		 * @param {int} y_end   - stop at pixel y.
		 * @param {int} x_step  - increment x pixel each time.
		 * @param {int} x_end   - stop at pixel x.
		 * @returns {imageData}
		 */
		Targa.prototype.getImageData16bits = function Targa_getImageData16bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end) {
			var image = this.image[0];
			var width = this.header.width, height = this.header.height;
			var color, i = 0, x, y;
			
			for (y = y_start; y !== y_end; y += y_step) {
				for (x = x_start; x !== x_end; x += x_step, i += 2) {
					color = image[i + 0] + (image[i + 1] << 8); // Inversed ?
					imageData[(x + width * y) * 4 + 0] = (color & 0x7C00) >> 7;
					imageData[(x + width * y) * 4 + 1] = (color & 0x03E0) >> 2;
					imageData[(x + width * y) * 4 + 2] = (color & 0x001F) >> 3;
					imageData[(x + width * y) * 4 + 3] = (color & 0x8000) ? 0 : 255;
				}
			}
			
			return imageData;
		};

		/**
		 * Return a ImageData object from a TGA file (24bits)
		 *
		 * @param {imageData} imageData - ImageData to bind
		 * @param {int} y_start - start at y pixel.
		 * @param {int} x_start - start at x pixel.
		 * @param {int} y_step  - increment y pixel each time.
		 * @param {int} y_end   - stop at pixel y.
		 * @param {int} x_step  - increment x pixel each time.
		 * @param {int} x_end   - stop at pixel x.
		 * @returns {imageData}
		 */
		Targa.prototype.getImageData24bits = function Targa_getImageData24bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end) {
			var image = this.image[0];
			var width = this.header.width, height = this.header.height;
			var i = 0, x, y;
			
			for (y = y_start; y !== y_end; y += y_step) {
				for (x = x_start; x !== x_end; x += x_step, i += 3) {
					imageData[(x + width * y) * 4 + 3] = 255;
					imageData[(x + width * y) * 4 + 2] = image[i + 0];
					imageData[(x + width * y) * 4 + 1] = image[i + 1];
					imageData[(x + width * y) * 4 + 0] = image[i + 2];
				}
			}
			
			return imageData;
		};

		/**
		 * Return a ImageData object from a TGA file (32bits)
		 *
		 * @param {imageData} imageData - ImageData to bind
		 * @param {int} y_start - start at y pixel.
		 * @param {int} x_start - start at x pixel.
		 * @param {int} y_step  - increment y pixel each time.
		 * @param {int} y_end   - stop at pixel y.
		 * @param {int} x_step  - increment x pixel each time.
		 * @param {int} x_end   - stop at pixel x.
		 * @returns {imageData}
		 */
		Targa.prototype.getImageData32bits = function Targa_getImageData32bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end) {
			var image = this.image[0];
			var width = this.header.width, height = this.header.height;
			var i = 0, x, y;
			
			for (y = y_start; y !== y_end; y += y_step) {
				for (x = x_start; x !== x_end; x += x_step, i += 4) {
					imageData[(x + width * y) * 4 + 2] = image[i + 0];
					imageData[(x + width * y) * 4 + 1] = image[i + 1];
					imageData[(x + width * y) * 4 + 0] = image[i + 2];
					imageData[(x + width * y) * 4 + 3] = image[i + 3];
				}
			}
			
			return imageData;
		};

		/**
		 * Return a ImageData object from a TGA file (8bits grey)
		 *
		 * @param {imageData} imageData - ImageData to bind
		 * @param {int} y_start - start at y pixel.
		 * @param {int} x_start - start at x pixel.
		 * @param {int} y_step  - increment y pixel each time.
		 * @param {int} y_end   - stop at pixel y.
		 * @param {int} x_step  - increment x pixel each time.
		 * @param {int} x_end   - stop at pixel x.
		 * @returns {imageData}
		 */
		Targa.prototype.getImageDataGrey8bits = function Targa_getImageDataGrey8bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end) {
			var image = this.image[0];
			var width = this.header.width, height = this.header.height;
			var color, i = 0, x, y;
			
			for (y = y_start; y !== y_end; y += y_step) {
				for (x = x_start; x !== x_end; x += x_step, i++) {
					color = image[i];
					imageData[(x + width * y) * 4 + 0] = color;
					imageData[(x + width * y) * 4 + 1] = color;
					imageData[(x + width * y) * 4 + 2] = color;
					imageData[(x + width * y) * 4 + 3] = 255;
				}
			}
			
			return imageData;
		};

		/**
		 * Return a ImageData object from a TGA file (16bits grey)
		 *
		 * @param {imageData} imageData - ImageData to bind
		 * @param {int} y_start - start at y pixel.
		 * @param {int} x_start - start at x pixel.
		 * @param {int} y_step  - increment y pixel each time.
		 * @param {int} y_end   - stop at pixel y.
		 * @param {int} x_step  - increment x pixel each time.
		 * @param {int} x_end   - stop at pixel x.
		 * @returns {imageData}
		 */
		Targa.prototype.getImageDataGrey16bits = function Targa_getImageDataGrey16bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end) {
			var image = this.image[0];
			var width = this.header.width, height = this.header.height;
			var i = 0, x, y;
			
			for (y = y_start; y !== y_end; y += y_step) {
				for (x = x_start; x !== x_end; x += x_step, i += 2) {
					imageData[(x + width * y) * 4 + 0] = image[i + 0];
					imageData[(x + width * y) * 4 + 1] = image[i + 0];
					imageData[(x + width * y) * 4 + 2] = image[i + 0];
					imageData[(x + width * y) * 4 + 3] = image[i + 1];
				}
			}
			
			return imageData;
		};

		/**
		 * return the texture color information at [u, v]
		 *
		 * @param {double} radius   - used in trilinear interpolation, the pixel per ray
		 * @returns {vector3} color
		 */
		Targa.prototype.getTextureColor = function Targa_getTextureColor(u, v, radius) {
			if (this.useMipMap == false) {
				// do the bilinear interpolation	
				return this.bilinear(this.header.width, this.header.height, this.image[0], u, v);
			} else {
				// do the trilinear interpolation
				return this.trilinear(u, v, radius);
			}
		};

		Targa.prototype.getWidth = function Targa_getWidth() {
			return this.header.width;
		};

		Targa.prototype.getNormal = function Targa_getNormal(u, v, radius) {
			if (this.useMipMap == false) {
				var normal = this.bilinear(this.header.width, this.header.height, this.image[0], u, v);
				return normal.multiplyN(2).addN(-1);
			} else {
				var normal = this.trilinear(u, v, radius);
				return normal.multiplyN(2).addN($V(-1, -1, -1)).toUnitVectorN();
			}
		};

		// bilinear interpolation
		// x, y should be the farction part of the real [x, y] coordinate
		// the interpolation is like this
		//--------------------------------------------
		// color_11					color_12
		// 				[x, y]
		// color_21 				color_22
		//---------------------------------------------
		Targa.prototype.bilinear = function Targa_bilinear(width, height, img, u, v) {
			// do the bilinear interpolation
			var y = v * (height - 1);
			var x = u * (width - 1);

			var index_11 = 3 * (Math.floor(y) * width + Math.floor(x));
			var index_12 = 3 * (Math.floor(y) * width + Math.ceil(x));
			var index_21 = 3 * (Math.ceil(y) * width + Math.floor(x));
			var index_22 = 3 * (Math.ceil(y) * width + Math.ceil(x));

			x -= Math.floor(x);
			y -= Math.floor(y);

			var color_11 = $V(img[index_11 + 2] / 255.0, img[index_11 + 1] / 255.0, img[index_11 + 0] / 255.0);
			var color_12 = $V(img[index_12 + 2] / 255.0, img[index_12 + 1] / 255.0, img[index_12 + 0] / 255.0);
			var color_21 = $V(img[index_21 + 2] / 255.0, img[index_21 + 1] / 255.0, img[index_21 + 0] / 255.0);
			var color_22 = $V(img[index_22 + 2] / 255.0, img[index_22 + 1] / 255.0, img[index_22 + 0] / 255.0);

			var color_delta_1 = color_12.subtract(color_11);
			var color_delta_2 = color_22.subtract(color_21);
			var color_1_mid = color_11.add(color_delta_1.multiplyN(x));
			var color_2_mid = color_22.add(color_delta_2.multiplyN(x));
			var color_delta_3 = color_2_mid.subtract(color_1_mid);
			return color_1_mid.addN(color_delta_3.multiplyN(y));
		};

		Targa.prototype.trilinear = function Targa_trilinear(u, v, radius) {
			var level 		= myLog2(radius);
			var level_low 	= Math.floor(level);
			var level_high 	= Math.ceil(level);

			if (level_high > this.image.length - 1) {
				// this patch is too small to use trilinear interpolation
				var width = this.header.width / Math.pow(2, this.image.length - 1);
				var height = this.header.height / Math.pow(2, this.image.length - 1);
				var end = this.image.length - 1;

				var y = Math.round(v * (height - 1));
				var x = Math.round(u * (width - 1));
				var index = 3 * (y * width + x);

				return $V(this.image[end][index + 2] / 255.0, this.image[end][index + 1] / 255.0, this.image[end][index + 0] / 255.0);
			}

			if (level_low < 0) {
				// this patch is too small to use trilinear interpolation
				var width = this.header.width;
				var height = this.header.height;

				var y = Math.round(v * (height - 1));
				var x = Math.round(u * (width - 1));
				var index = 3 * (y * width + x);

				return $V(this.image[0][index + 2] / 255.0, this.image[0][index + 1] / 255.0, this.image[0][index + 0] / 255.0);
			}


			level -= level_low;

			var width_low 	= this.header.width / Math.pow(2, level_low);
			var width_high 	= this.header.width / Math.pow(2, level_high);
			var height_low  = this.header.height / Math.pow(2, level_low);
			var height_high = this.header.height / Math.pow(2, level_high);
			var color_low 	= this.bilinear(width_low, height_low, this.image[level_low], u, v);
			var color_high  = this.bilinear(width_high, height_high, this.image[level_high], u, v);
			var color_delta = color_high.subtract(color_low);
			return color_low.addN(color_delta.multiplyN(level));
		};

		// generate the mipmap
		// always assume that width and height are power of 2
		Targa.prototype.generateMipMap = function Targa_generateMipmap(ratio_exact, ratio_mid, ratio_mid_2) {
			var ratio_corner = 1 / (ratio_exact + 2 * ratio_mid + ratio_mid_2);
			var ratio_edge 	 = 1 / (ratio_exact + 3 * ratio_mid + 2 * ratio_mid_2);
			var ratio_gen	 = 1 / (ratio_exact + 4 * ratio_mid + 4 * ratio_mid_2);
			var width = this.header.width;
			var height = this.header.height;
			var width_level = myLog2(width);
			var height_level = myLog2(height);
			var level = Math.min(width_level, height_level);
			for (var i = 0; i < level; ++i) {
				var img = this.image[i];
				var size = width / 2 * height / 2 * 3;

				// initialize the new image
				this.image.push(new Uint8Array(size));

				// use float the ensure the accuracy
				var new_img = new Float32Array(size);

				var flag_x = false, flag_y = false;
				for (var y = 0; y < height; ++y) {
					flag_y = ! flag_y;
					for (var x = 0; x < width; ++x) {
						flag_x = ! flag_x;
						var index = 3 * (y * width + x);
						if (flag_x == true) {
							if (flag_y == true) {
								// mod(x, 2) = 0 and mod(y, 2) = 0
								var new_index = 3 * (y * width / 4 + x / 2);
								new_img[new_index + 0] += img[index + 0] * ratio_exact;
								new_img[new_index + 1] += img[index + 1] * ratio_exact;
								new_img[new_index + 2] += img[index + 2] * ratio_exact;
							} else {
								// mod(x, 2) = 0 and mod(y, 2) != 0
								if (y != height - 1) {
									var new_index_down 			= 3 * (Math.floor(y / 2) * width / 2 + x / 2);
									var new_index_up 			= 3 * (Math.ceil(y / 2) * width / 2 + x / 2);
									new_img[new_index_up + 0] 	+= img[index + 0] * ratio_mid;
									new_img[new_index_up + 1]	+= img[index + 1] * ratio_mid;
									new_img[new_index_up + 2] 	+= img[index + 2] * ratio_mid;
									new_img[new_index_down + 0] += img[index + 0] * ratio_mid;
									new_img[new_index_down + 1] += img[index + 1] * ratio_mid;
									new_img[new_index_down + 2] += img[index + 2] * ratio_mid;
								} else {
									var new_index_down 			= 3 * (Math.floor(y / 2) * width / 2 + x / 2);
									new_img[new_index_down + 0] += img[index + 0] * ratio_mid;
									new_img[new_index_down + 1] += img[index + 1] * ratio_mid;
									new_img[new_index_down + 2] += img[index + 2] * ratio_mid;
								}
							}
						} else {
							if (flag_y == true) {
								// mod(x, 2) != 0 and mod(y, 2) = 0
								if (x != width - 1) {
									var new_index_left 				= 3 * (y * width / 4 + Math.floor(x / 2));
									var new_index_right 			= 3 * (y * width / 4 + Math.ceil(x / 2));
									new_img[new_index_left + 0] 	+= img[index + 0] * ratio_mid;
									new_img[new_index_left + 1]	 	+= img[index + 1] * ratio_mid;
									new_img[new_index_left + 2] 	+= img[index + 2] * ratio_mid;
									new_img[new_index_right + 0] 	+= img[index + 0] * ratio_mid;
									new_img[new_index_right + 1] 	+= img[index + 1] * ratio_mid;
									new_img[new_index_right + 2] 	+= img[index + 2] * ratio_mid;
								} else {
									var new_index_left 				= 3 * (y * width / 4 + Math.floor(x / 2));
									new_img[new_index_left + 0] 	+= img[index + 0] * ratio_mid;
									new_img[new_index_left + 1]	 	+= img[index + 1] * ratio_mid;
									new_img[new_index_left + 2] 	+= img[index + 2] * ratio_mid;
								}

							} else {

								// mod(x, 2) != 0 and mod(y, 2) != 0
								var new_index_11 			= 3 * (Math.floor(y / 2) * width / 2 + Math.floor(x / 2));
								
								new_img[new_index_11 + 0] 	 += img[index + 0] * ratio_mid_2;
								new_img[new_index_11 + 1]	 += img[index + 1] * ratio_mid_2;
								new_img[new_index_11 + 2] 	 += img[index + 2] * ratio_mid_2;

								if (x != width - 1) {
									var new_index_21 		= 3 * (Math.floor(y / 2)  * width / 2 + Math.ceil(x / 2));
									new_img[new_index_21 + 0] += img[index + 0] * ratio_mid_2;
									new_img[new_index_21 + 1] += img[index + 1] * ratio_mid_2;
									new_img[new_index_21 + 2] += img[index + 2] * ratio_mid_2;
								}

								if (y != height - 1) {
									var new_index_12 			= 3 * (Math.ceil(y / 2)  * width / 2 + Math.floor(x / 2));
									new_img[new_index_12 + 0]  += img[index + 0] * ratio_mid_2;
									new_img[new_index_12 + 1]  += img[index + 1] * ratio_mid_2;
									new_img[new_index_12 + 2]  += img[index + 2] * ratio_mid_2;
								}

								if (x != width - 1 && y != height - 1) {
									var new_index_22 			= 3 * (Math.ceil(y / 2) * width / 2 + Math.ceil(x / 2));
									new_img[new_index_22 + 0] 	 += img[index + 0] * ratio_mid_2;
									new_img[new_index_22 + 1]	 += img[index + 1] * ratio_mid_2;
									new_img[new_index_22 + 2] 	 += img[index + 2] * ratio_mid_2;
								}
							}
						}
					}
				}

/*				// push the new img into the array
				for (var j = 0; j < new_img.length; ++j) {
					this.image[i + 1][j] = new_img[j];
				}
*/
				// update the width and height
				width /= 2;
				height /= 2;

				for (var y = 0; y < height; ++y) {
					for (var x = 0; x < width; ++ x) {
						var index = 3 * (y * width + x);
						if (y == 0 && x == 0) {
							// pixel in the corner
							// these pixels will all be mapped exactly as new pixels
							this.image[i + 1][index + 0] = new_img[index + 0] * ratio_corner;
							this.image[i + 1][index + 1] = new_img[index + 1] * ratio_corner;
							this.image[i + 1][index + 2] = new_img[index + 2] * ratio_corner;
						} else if (y == 0 || x == 0) {
							// pixels at the edge
							// these pixels are all be x mid or y mid
							this.image[i + 1][index + 0] = new_img[index + 0] * ratio_edge;
							this.image[i + 1][index + 1] = new_img[index + 1] * ratio_edge;
							this.image[i + 1][index + 2] = new_img[index + 2] * ratio_edge;
						} else {
							// pixel in the middle of the image
							this.image[i + 1][index + 0] = new_img[index + 0] * ratio_gen;
							this.image[i + 1][index + 1] = new_img[index + 1] * ratio_gen;
							this.image[i + 1][index + 2] = new_img[index + 2] * ratio_gen;
						}
					}
				}

				
			}
		};

		// Export data
		if (typeof (exports) !== 'undefined') {
			exports.TGA = Targa;
		}
	
	})(shim.exports);
})(this);

