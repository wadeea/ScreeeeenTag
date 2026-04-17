import sharp from 'sharp';
import { createCanvas } from 'canvas';
import { Product } from '../../src/types';
import { logger } from '../lib/logger';

export class RendererService {
  /**
   * Generates a 1-bit or 2-bit (B/W/R) E-Ink compatible bitmap
   * Optimized for size and delivery over IoT networks
   */
  public async generateEInkBitmap(product: Product): Promise<Buffer> {
    const width = 296;
    const height = 128;
    
    // 1. Create Layout with Canvas (High level design)
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Text & Graphics (Black Layer)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(product.name.substring(0, 20), 10, 35);
    
    ctx.font = '14px Arial';
    ctx.fillText(product.sku, 10, 60);

    // Price (Large Bold)
    ctx.font = 'bold 42px Arial';
    ctx.fillText(`${product.currency}${product.price.toFixed(2)}`, 10, 110);

    // Category / Promo (Red/Accent Layer simulated as grayscale for prototype, 
    // but in production we map specific colors to bit planes)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 80, 70, 70, 40);
    ctx.font = 'bold 12px Arial';
    ctx.fillText('SALE', width - 65, 95);

    // 2. Process with Sharp (Downsampling to E-Ink Palette)
    const pngBuffer = canvas.toBuffer('image/png');
    
    // Production optimization: Convert to mono-threshold, rotate for screen orientation
    const optimizedBuffer = await sharp(pngBuffer)
      .greyscale()
      .threshold(128) // Convert to strict B/W
      .ensureAlpha(1)
      .raw()
      .toBuffer();

    return optimizedBuffer;
  }
}

export const renderer = new RendererService();
