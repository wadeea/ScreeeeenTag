import { createCanvas } from 'canvas';

export interface EslTemplate {
  name: string;
  price: number;
  currency: string;
  sku: string;
  barcode: string;
}

export class RendererService {
  /**
   * Renders an ESL image (2.9 inch typical resolution: 296x128)
   * Optimization: Returns a Base64 string for the preview, 
   * but in production this would be converted to the specific 1-bit or 2-bit binary format.
   */
  public static async renderTagImage(data: EslTemplate): Promise<string> {
    const width = 296;
    const height = 128;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // Header / Name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(data.name.substring(0, 20), 10, 35);

    // SKU
    ctx.font = '12px Courier New';
    ctx.fillText(`SKU: ${data.sku}`, 10, 55);

    // Price
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${data.price.toFixed(2)}`, width - 20, 110);
    
    ctx.font = '24px Arial';
    ctx.fillText(data.currency, width - 20, 70);

    // Mock Barcode area
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 80, 120, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(data.barcode, 70, 100);

    return canvas.toDataURL('image/png');
  }

  /**
   * Converts Canvas data to the specific binary format E-Ink needs (B/W/R)
   * This is a simplified version for the PRD.
   */
  public static async generateBinary(data: EslTemplate): Promise<Buffer> {
    // In a real system, you'd iterate pixels and pack them into bits
    // 0 = White, 1 = Black
    return Buffer.from('MOCK_BINARY_DATA');
  }
}
