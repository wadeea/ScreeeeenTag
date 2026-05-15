import sharp from 'sharp';
import { createCanvas } from 'canvas';
import { Product } from '../../src/types';
import { logger } from '../lib/logger';

export class RendererService {
  /**
   * Generates a 1-bit or 2-bit (B/W/R) E-Ink compatible bitmap
   * Optimized for size and delivery over IoT networks
   */
  public async generateEInkBitmap(product: Product, width = 800, height = 480): Promise<Buffer> {
    // 1. Create Layout with Canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Solid White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Industrial Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 15;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Product Header Area
    ctx.fillStyle = '#000000';
    ctx.fillRect(25, 25, width - 50, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial';
    ctx.fillText(product.name.toUpperCase().substring(0, 25), 45, 82);

    // SKU Area (Black)
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.fillText(`CODE: ${product.sku}`, 45, 140);

    // PRICE (The star of the show)
    // We use a specific Red for the price to trigger the red layer on ET0750
    ctx.fillStyle = '#ff0000'; 
    ctx.font = 'bold 220px Arial';
    const priceText = product.price.toFixed(2);
    ctx.fillText(priceText, 35, 400);

    // Currency (Black)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(product.currency, width - 150, 420);

    // Promo Section (Bottom Right - Red Rectangle)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(width - 300, height - 150);
    ctx.lineTo(width - 25, height - 150);
    ctx.lineTo(width - 25, height - 25);
    ctx.lineTo(width - 150, height - 25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 45px Arial';
    ctx.fillText('BIG SALE', width - 260, height - 70);

    // 2. Advanced E-Ink Processing with Sharp
    const pngBuffer = canvas.toBuffer('image/png');
    
    // We perform manual dithering simulation via thresholding and color separation
    // In many ETAG versions, the Base64 image is just a PNG that the AP converts.
    // However, some versions need a 2-plane bitmap. 
    // We send a dithered PNG which is the safest universal format for AP04.
    const optimizedBuffer = await sharp(pngBuffer)
      .png({ palette: true, colors: 3 }) // Black, White, Red
      .toBuffer();

    return optimizedBuffer;
  }
}

export const renderer = new RendererService();
