import { describe, it, expect, vi } from 'vitest';
import { Canvas2DRenderer } from '../../../src/ui/canvas-renderer.js';

describe('Canvas2DRenderer Unit Tests', () => {
  it('test_canvas_renderer_initialization_and_dpi_scaling', () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        scale: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn()
      }),
      getBoundingClientRect: vi.fn().mockReturnValue({ width: 800, height: 600 }),
      width: 0,
      height: 0
    } as unknown as HTMLCanvasElement;

    const renderer = new Canvas2DRenderer(mockCanvas);
    expect(renderer.getHexRadius()).toBe(28);
  });
});
